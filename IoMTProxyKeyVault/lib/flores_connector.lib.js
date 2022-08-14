const crypto = require("crypto")
module.exports = {
    receiveMessage: (inobj) => {
        let deviceId = "bbraun-iot-device19";
        if (inobj.from) deviceId = inobj.from;
        let expires = (Date.now() / 1000).toFixed(0) + 3600
        
        return { 
            deviceId, 
            //token: Buffer.from(crypto.randomBytes(10)).toString("base64")
            token: crypto.createHmac('sha256', "floreskey")
                .update(deviceId + '\n' + expires)
                .digest('base64'),
            expires
        } // returned object
    }
}