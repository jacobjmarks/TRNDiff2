const soap = require("soap");

let soapClient;

module.exports.getRegulators = (cb) => {
    soap.createClient("http://regulondb.ccg.unam.mx/webservices/NetWork.jws?wsdl", (err, client) => {
        if (err) return cb(err);

        client.getTFTF(null, (err, result) => {
            if (err) return cb(err);
            cb(null, parseResponseTSV(result.getTFTFReturn.$value));
        });
    })
}

function parseResponseTSV(tsv) {
    let result = [];

    for (let line of tsv.split('\n')) {
        let values =  line.split('\t');
        result.push({
            regulator: values[0],
            regulates: values[1],
            effect: values[2],
            evidence: values[3],
            strength: values[4]
        });
    }

    return result;
}