const soap = require("soap");

let soapClient;

module.exports.getRegulons = (cb) => {
    soap.createClient("http://regulondb.ccg.unam.mx/webservices/NetWork.jws?wsdl", (err, client) => {
        if (err) return cb(err);

        client.getTFTF(null, (err, result) => {
            if (err) return cb(err);
            cb(null, result.getTFTFReturn.$value);
        });
    })
}

// function setupSoapClient() {
//     soap.
// }