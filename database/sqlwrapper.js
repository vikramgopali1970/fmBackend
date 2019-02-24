const dbConn = require('../database/connection');


module.exports = {
    execute : (query)=> {
        console.log(query);
        let Promises = [];
        return new Promise((resolve, reject)=>{
            dbConn((err, con)=>{
                if(err) {
                    console.log('mysql connection error : ', err);
                    reject(err);
                }
                let exec =(query)=>{
                    return new Promise((resolve, reject)=>{
                        con.query(query,(err, data)=>{
                            if(err){
                                console.log('mysql error ', err);
                                reject(err);
                            }else{
                                resolve(data);
                            }
                        });
                    });
                };
                for(let i = 0;i<query.length;i++){
                    Promises.push(exec(query[i]));
                }
                Promise.all(Promises).then(result=>{
                    con.release();
                    resolve(result);
                }).catch(error=>{
                    con.release();
                    reject(error);
                });
            })
        })
    }
};