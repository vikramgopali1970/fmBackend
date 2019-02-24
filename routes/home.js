const passport = require('passport');
const mongoUtil = require('../database/mongoUtility');
const axios = require('axios');
const timeseries = require("timeseries-analysis");

const currDb = "currentBudget";

updateSavings=(findQ)=>{
    return new Promise((resolve,reject)=>{
        mongoUtil.getData(findQ,"goals").then(goals=>{
            let newSavings = 0;
            goals.goals.map(obj=>{
                newSavings += Math.abs(obj.savings);
            });
            console.log(newSavings);
        })
    })
};

require('../passport')(passport);
module.exports = (router,sql,md5,moment,jwt)=>{

    router.post('/login',passport.authenticate('login',{session: true}),(req,res,next)=>{
        let data = req.body;
        const uname = data.username;
        const pass = data.password;
        const loginQuery = `select * from ilance_users where username = "${uname}"`;
        sql.execute([loginQuery]).then(data=>{
            let userData = Object.assign({},data[0][0]);
            let hash = md5(md5(pass)+userData.salt);
            if(userData.password === hash){
                delete userData["password"];
                delete userData["salt"];
                delete userData["secretquestion"];
                delete userData["secretanswer"];
                userData["expire"] = moment().add(180, 'm').valueOf();
                const token = jwt.encode(userData,"secret");
                res.send({'status': true, 'user': userData, 'token': 'JWT ' + token, route:"dashboard"});
            }else{
                res.json("No Match");
            }
        }).catch(error=>{
            console.log(error);
        });
    });

    router.post('/putGoal',(req,res,next)=> {
        let data = req.body;
        let obj = {
            userName : data.userName,
            goals : []
        };
        mongoUtil.insertData(obj,"goals").then(dataIns=>{
            res.json({status:dataIns,data:"inserted"});
        })
    });

    router.post('/getGoal',(req,res,next)=> {
        let data = req.body;
        let findQ = {
            "userName":data.userName
        };
        mongoUtil.getData(findQ,"goals").then(dataIns=>{
            updateSavings();
            res.json({status:true,data:dataIns});
        })
    });

    router.post('/getRetirementVal',(req,res,next)=> {
        let data = req.body;
        let findQ = {
            "userName":data.userName
        };
        let vals={
            postRetireYrs : parseInt(data.postRetireYrs),
            pension : parseInt(data.pension),
            rate : parseFloat(data.rate)
        };
        mongoUtil.getData(findQ,"user").then(dataGet=>{
            let savings = dataGet.savings;
            console.log(`http://127.0.0.1:8890/getPV?rate=${vals.rate}&nper=${vals.postRetireYrs}&pmt=${vals.pension}&fv=0`);
            axios.get(`http://127.0.0.1:8890/getPV?rate=${vals.rate}&nper=${vals.postRetireYrs}&pmt=${vals.pension}&fv=0`).then(resp=>{
                res.json({status:true,data:resp.data.pv});
            })
        });

    });

    router.post('/addGoal',(req,res,next)=>{
        let data = req.body;
        let findQ = {
            "userName":data.userName
        };
        let goal = {
            goalName : data.goalName,
            goalFuture : parseFloat(data.goalFuture),
            goalYears : parseInt(data.goalYears),
            goalRate : parseFloat(data.goalRate)
        };
        console.log(`http://127.0.0.1:8890/getPMT?rate=${goal.goalRate}&nper=${goal.goalYears}&pv=0&fv=${goal.goalFuture}`);
        axios.get(`http://127.0.0.1:8890/getPMT?rate=${goal.goalRate}&nper=${goal.goalYears}&pv=0&fv=${goal.goalFuture}`).then(data=>{
            console.log(data.data.pmt);
            goal["savings"] = (parseFloat(data.data.pmt))
            mongoUtil.getData(findQ,"goals").then(dd=>{
                dd.goals.push(goal);
                mongoUtil.updateTable(dd,findQ,"goals").then(updated=>{
                    res.json({status:true,data:updated});
                })
            })
        });
        //http://127.0.0.1:8890/getPMT?rate=0.1&nper=3&pv=0&fv=24640-->PMT
        //http://127.0.0.1:8890/getPV?rate=0.06&nper=10&pmt=8000&fv=0
        //

        // mongoUtil.getData(findQ,"goals").then(dataFind=>{
        //     dataFind.goals.push(goal);
        // });
        // axios.get(`http://127.0.0.1:8889/getLabel?angle=${txn.desc}`).then(resp=>{
        //     console.log(resp.data,findQ);
        //     let labelData = resp.data;
        //     mongoUtil.getData(findQ,"currentBudget").then(getData1=>{
        //         console.log("the data is ",getData1);
        //         getData1[labelData.category] -= txn.amt;
        //         mongoUtil.updateTable(getData1,findQ,currDb).then(upRes=>{
        //             res.json({status:true, msg:"updated"});
        //         })
        //     });

        // }).catch(err=>{
        //     res.json({status: false, msg: err});
        // });

    });

    router.post('/transact',(req,res,next)=>{
        let data = req.body;
        let findQ = {
            "userName":data.name
        };
        let txn = {
            date : data.date,
            desc : data.desc,
            amt : data.amt
        };
        axios.get(`http://127.0.0.1:8889/getLabel?angle=${txn.desc}`).then(resp=>{
            console.log(resp.data,findQ);
            let labelData = resp.data;
            mongoUtil.getData(findQ,"currentBudget").then(getData1=>{
                console.log("the data is ",getData1);
                getData1[labelData.category] -= txn.amt;
                mongoUtil.updateTable(getData1,findQ,currDb).then(upRes=>{
                    res.json({status:true, msg:"updated"});
                })
            });

        }).catch(err=>{
            res.json({status: false, msg: err});
        });

    });



    router.post('/updateBudget',(req,res,next)=> {
        let data  = req.body;
        let myobj = {$set:{
                "user_id" : 1,
                "userName" : data.name,
                "month" : data.month,
                "year" : data.year,
                "Miscellaneous" : data.misc,
                "Money_Transfer" : data.monTrns,
                "Bills" : data.bills,
                "Food" : data.food,
                "Subscription" : data.subscrip,
                "Shopping" : data.shop,
                "Grocery" : data.groc,
                "Travel" : data.travel,
                "Vacation" : data.vac
            }};
        console.log(myobj);
        mongoUtil.updateTable(myobj,{"userName" : data.userName},"currentBudget").then(data=>{
            res.json({status:"true",data:"updated"});
        });
    });

    router.post('/afford',(req,res,next)=> {
        let data  = req.body;
        let find = {
            userName : data.name,
        };
        console.log(find);
        mongoUtil.getData(find,"historyMaster").then(getData=>{
            mongoUtil.getData(find,"currentBudget").then(currData=>{
                res.json({status:true, masterData:getData, currData:currData});
            });

        }).catch(err=>{
            res.json({status:false,msg:err});
        });
    });



    // router.post('/insertUser',(req,res,next)=> {
    //     let data = req.body;
    //     mongoUtil.getData({"userName":data.name},"user").then(dataUser=>{
    //         let years_toRetirement = data.yrsToRetirement;
    //         let lir = dataUser.lir;
    //         let monthly_expense = 1000;
    //         let monthly_income = 2000;
    //         let monthlyExpenseFuture = ((monthly_expense) * (Math.pow((1 + parseFloat((lir / 100))), years_toRetirement)));
    //         let monthlyIncomeFuture = ((monthly_income) * (Math.pow((1 + parseFloat((rental_growth / 100))), years_toRetirement)));
    //     }).catch(err=>{
    //
    //     });
    //
    //
    // });

    router.post('/insertUser',(req,res,next)=> {
        let data = req.body;
        let obj = {
            userName : data.username,
            fname : data.fname,
            lname : data.lname,
            dob : data.dob,
            nigr : data.nigr,//net income growth
            lir : data.lir,//living inflation
            income : data.income,
            expense : data.expense,
            savings : data.income - data.expense
        };
        mongoUtil.insertData(obj,"user").then(result=>{
            res.json({status:result,data:"inserts"});
        });
    });

    router.post('/putTxn',(req,res,next)=> {
        let bal = [4630.5,4660.62,4700.93,4721.49,4745.8,5662.3,5701.96,5706.46,5725.15,5746.64,,5768.05,5311.05,5313.05,5313.97,5316.87,5333.1,5339.75,5348.51,5374.48,5387.36,5427.67,5421.23,5479.72,5470.96,5480.41,5531.51,5563.51,5563.52,5607.19,5205.19,5161.52,5177.51,6085.34,6098.15,6123.15,6148.15,6204.52,6205.06,6209.74,6212.24,6224.22,6227.21,6246.08,6267.03];
        let date = ["2019-02-20","2019-02-11","2019-02-11","2019-02-05","2019-02-04","2019-02-04","2019-02-04","2019-02-04","2019-02-04","2019-02-04","2019-02-04","2019-01-31","2019-01-28","2019-01-28","2019-01-28","2019-01-24","2019-01-22","2019-01-22","2019-01-22","2019-01-22","2019-01-22","2019-01-18","2019-01-18","2019-01-15","2019-01-14","2019-01-14","2019-01-14","2019-01-14","2019-01-14","2019-01-14","2019-01-08","2019-01-07","2019-01-07","2019-01-07","2019-01-07","2019-01-04","2019-01-03","2019-01-03","2019-01-02","2019-01-02","2019-01-02","2019-01-02","2019-01-02","2019-01-02"]
        let data = date.map((ele,i)=>{
            return [ele,bal[i]];
        });
        let d = new timeseries.main(timeseries.adapter.sin({cycles:4}));
        let coeffs = d.ARMaxEntropy(
            {
                data:   d.data.slice(0,data.length-1)
        });
        let forecast = 0;
        for (let i=0;i<coeffs.length;i++) {
            forecast -= d.data[data.length-1-i][1]*coeffs[i];
        }
        console.log("forecast",forecast);
        res.json({status:true,data:forecast});
        // mongoUtil.insertData()
    });



    router.post('/setBudgetMaster',(req,res,next)=> {
        let data = req.body;
        let myobj = {
            user_id: 1,
            userName: data.name,
            month: data.month,
            year: data.year,
            Miscellaneous: data.misc,
            Money_Transfer: data.monTrns,
            Bills: data.bills,
            Food: data.food,
            Subscription: data.subscrip,
            Shopping: data.shop,
            Grocery: data.groc,
            Travel: data.travel,
            Vacation: data.vac
        };
        console.log(myobj);
        mongoUtil.insertData(myobj, "historyMaster").then(insData => {
            mongoUtil.insertData(myobj, "currentBudget").then(insData => {
                res.json({status: true, data: "inserted"});
            }).catch(err => {
                res.json({status: false, msg: err});
            });
        });
    });

    router.post('/reset',(req,res,next)=> {
        // mongoUtil.resetTable("historyMaster");
        // mongoUtil.resetTable("currentBudget");
        // mongoUtil.resetTable("user");
        mongoUtil.resetTable("goals");
        res.json({status : "USer_Authenticated"});
    });

    return router;
};