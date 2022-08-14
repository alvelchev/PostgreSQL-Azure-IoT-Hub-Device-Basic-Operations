require('dotenv').config({ path: './.env' })
const { Client } = require('pg')

var client = null;

var executePostgresFunction = (functionName, paramsArray, cb)  => {
    
    if (!client) return cb("Not connected",null);

    var paramsString = "";

    for (var i = 0; i < paramsArray.length; i++) {
        paramsString += "$" + (i+1).toString() + ",";
    }

    if (paramsString.length>0) paramsString=paramsString.substr(0,paramsString.length-1);

    const res = client.query("SELECT " + functionName + "("+ paramsString + ") as result", paramsArray, (err, res) => {
      
        if (err) {  
            cb(err,null);
        } else cb(null,res.rows[0].result);
    });
}

var executePostgresFunctionSync = async (functionName, paramsArray) => {
    if (!client) throw ("Not connected");

    var paramsString = "";

    for (var i = 0; i < paramsArray.length; i++) {
        paramsString += "$" + (i+1).toString() + ",";
    }
    
    if (paramsString.length>0) paramsString=paramsString.substr(0,paramsString.length-1);
    
    const res = await client.query("SELECT " + functionName + "("+ paramsString + ") as result", paramsArray);
          
    return res.rows[0].result;
    
}

module.exports = {
    connectFromEnvironment: (cb) => {
        client = new Client({
            user: process.env.PGUSER,
            host: process.env.PGHOST,
            database: process.env.PGDATABASE,
            password: process.env.PGPASSWORD,
            port: process.env.PGPORT,
          })        
        client.connect((err) => {
            cb(err);
        })      
    },
    connectFromEnvironmentSync: async () => {
        client = new Client({
            user: process.env.PGUSER,
            host: process.env.PGHOST,
            database: process.env.PGDATABASE,
            password: process.env.PGPASSWORD,
            port: process.env.PGPORT,
          })        
        await client.connect();
    },

    getToken: (iotHub, deviceId,cb) => {
        executePostgresFunction("getToken",[deviceId,iotHub],cb);        
    },
    validateTokenSync: async (deviceId, floresToken, floresTokenExpires) => {
        const res = await executePostgresFunctionSync('validateToken',[deviceId, floresToken,floresTokenExpires]);
        return res;
    },
    exchangeTokenSync: async (deviceId,floresToken,floresTokenExpires, iotHub) => {
        const res = await executePostgresFunctionSync('exchangeToken',[deviceId, floresToken,floresTokenExpires, iotHub]);
        return res;
    },
    getRegistrationTokenSync: async (deviceId,floresToken,floresTokenExpires) => {
        const res = await executePostgresFunctionSync('getregistrationtoken',[deviceId, floresToken,floresTokenExpires]);
        return res;
    },
    getRegistrationToken: (deviceId,floresToken,floresTokenExpires,cb) => {
        executePostgresFunction("getregistrationtoken",[deviceId, floresToken,floresTokenExpires],cb);        
    },    
    testKeysTable: (cb) => {
        if (!client) return cb("Not connected",null);
        const res = client.query("SELECT * FROM keys", null, (err, res) => {
            if (err) {  
                cb(err,null);
            } else cb(null,res.rows[0].thekey);
        });        
    }
}