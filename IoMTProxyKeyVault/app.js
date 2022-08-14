var Protocol = require('azure-iot-device-amqp').AmqpWs;
var Client = require('azure-iot-device').Client;
var Message = require('azure-iot-device').Message;
const flores = require("./lib/flores_connector.lib")
const vault = require("./lib/keyvault.lib")
const dps = require("./lib/registration.lib")
const iotHub = "iomt-workshop-io"

// Helper function to print results in the console
function printResultFor(op) {
    return function printResult(err, res) {
        if (err) console.log(op + ' error: ' + err.toString());
        if (res) console.log(op + ' status: ' + res.constructor.name);
    };
}

(async () => {
    try {
        /* ---------------------------------------------------------------
         Step 1: Simulate Kafka message received from device via Flores
        --------------------------------------------------------------- */
        console.log("\n----------------------- RECEIVE FLORES MESSAGE --------------------")

        var message = flores.receiveMessage({from:'bbraun-iot-device20'}); // simulation: wait until message is received

        // extract authentication information from Kafka message
        var deviceId = message.deviceId;
        var floresToken = message.token;
        //var floresToken = "somethingspoofed";
        var floresTokenExpires = message.expires;

        console.log("Received message from Flores with auth info:\n\tdeviceid\t'%s'\n\tfloresToken\t'%s'\n\texpires\t\t%s", deviceId, floresToken, floresTokenExpires);

        /* ---------------------------------------------------------------
         Step 2: Contact keyvault and exchange a verified Flores token against an Azure IoT Sas token
        --------------------------------------------------------------- */

        console.log("\n----------------------- EXCHANGE TOKENS --------------------")
        console.log("Validating Flores token:");
        const res = await vault.connectFromEnvironmentSync(); // connect to vault with ultimately limited user (only has stored procedure exec grant)

        var isValid = await vault.validateTokenSync(deviceId, floresToken, floresTokenExpires);

        if (!isValid) {
            console.error("\tError: Flores token is INVALID!");
            process.exit(1); // game over
        }

        console.log("\tFlores token successfully validated!");

        var sasToken = await vault.exchangeTokenSync(deviceId, floresToken, floresTokenExpires, iotHub);

        console.log("Exchanged token:\n\t%s", sasToken)

        /* ---------------------------------------------------------------
         Step 3: Instanciate IoTCient with exchanged token and send some test messages
        --------------------------------------------------------------- */

        console.log("\n------------------- CONNECT TO AZURE USING TOKEN --------------------")

        var client = Client.fromSharedAccessSignature(
            sasToken,
            Protocol
        );

        var connectCallback = function (err) {
            if (err) {
                console.error('Could not connect: ' + err.message);
                if (err.message.includes("not registered")) { // Houston, we have an unregistered device! let's do something about it
                    vault.getRegistrationToken(deviceId, floresToken, floresTokenExpires, (err, registrationToken) => {
                        if (err) {
                            console.log("Error getting registration token: " + err.toString());
                            process.exit(1);
                        }
                        console.log("Registering device '%s' with token:\n\t%s", deviceId, registrationToken)
                        dps.register(deviceId, registrationToken, (err, res) => {
                            if (err) {
                                console.log(err.toString());
                                process.exit(1);
                            }
                            console.log("SUCCESSfully registered device '%s'",deviceId);
                        })
                    });

                }


            } else {
                console.log('Client connected');

                // Create a message and send it to the IoT Hub every two seconds
                var sendInterval = setInterval(function () {
                    var windSpeed = 10 + (Math.random() * 4); // range: [10, 14]
                    var temperature = 20 + (Math.random() * 10); // range: [20, 30]
                    var humidity = 60 + (Math.random() * 20); // range: [60, 80]
                    var data = JSON.stringify({ deviceId: 'myFirstDevice', windSpeed: windSpeed, temperature: temperature, humidity: humidity });
                    var message = new Message(data);
                    message.properties.add('temperatureAlert', (temperature > 28) ? 'true' : 'false');
                    console.log('Sending message: ' + message.getData());
                    client.sendEvent(message, printResultFor('send'));
                }, 2000);

                client.on('error', function (err) {
                    console.error(err.message);
                });

                client.on('disconnect', function () {
                    clearInterval(sendInterval);
                    client.removeAllListeners();
                    client.open(connectCallback);
                });
            }
        };

        client.open(connectCallback);
    } catch (e) {
        console.log(e);
    }
})();
