const mongoUtil = require( './MongoDB' );


module.exports = {

    getData: (prop,tbName)=>{
        return new Promise((resolve,reject)=>{
            const db = mongoUtil.getDb();
            let dbo = db.db("mydb");
            dbo.collection(tbName).findOne(prop,(err,data)=> {
                if (err) reject(err);
                console.log("getting here",data);
                resolve(data);
            });
        });
    },

    insertData: (doc,tbName)=> {
        return new Promise((resolve,reject)=>{
            const db = mongoUtil.getDb();
            let dbo = db.db("mydb");
            dbo.collection(tbName).insertOne(doc,(err,resp)=>{
                if (err) reject(err);
                console.log("inserted  here");
                resolve(true);
            });
        });
    },


    resetTable : (tbName)=>{
        return new Promise((resolve,reject)=>{
            const db = mongoUtil.getDb();
            let dbo = db.db("mydb");
            dbo.collection(tbName).deleteMany({}).then(res=>{
                resolve(true);
            });
        });
    },

    updateTable : (upProp,query,tbname)=>{
        return new Promise((resolve,reject)=>{
            const db = mongoUtil.getDb();
            let dbo = db.db("mydb");
            console.log(upProp);
            dbo.collection(tbname).replaceOne(query, upProp, function(err, res) {
                if (err) reject(err);
                console.log("1 document updated");
                resolve(true);
            });
        });
    }


};



