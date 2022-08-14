const http = require("axios");

module.exports = {
    register: (deviceId, registrationToken, cb) => {

        var token = {}
        
        registrationToken.split(" ")[1].split("&").map(x => token[x.split("=")[0]] = x.split("=")[1]);

        var DPS_idScope = token.sr.split("/")[0];       
        var devid = token.sr.split("/")[2];

        if (devid !== deviceId) return cb("ERROR: deviceId provided does not match deviceId in registrationToken!", null)

        var uri = DPS_idScope + '/registrations/' + devid + '/register?api-version=2019-03-31'

        var httpOptions = {
            method: 'PUT',
            url: 'https://global.azure-devices-provisioning.net/' + uri,
            data: JSON.stringify({ registrationId: devid }),
            headers: {
                'Authorization': registrationToken,
                'Accept': 'application/json',
                'Content-Type': 'application/json; charset=utf-8'
            },
            //json: true
        };

        http(httpOptions)
        .then(response => {            
            //console.log("SUCCESS:",response);
            return cb(null, response);
        })
        .catch(err => {
            //console.log("FAILED:",err.toString());
            return cb(err, null);
        })

        //console.log(httpOptions);
        
    }
}