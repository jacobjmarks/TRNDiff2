const request = require("request");
const soap = require("soap");

let soapClient;

module.exports.getRegulators = (cb) => {
    soap.createClient("http://regulondb.ccg.unam.mx/webservices/NetWork.jws?wsdl", (err, client) => {
        if (err) return cb(new Error(err));

        client.getTFTF(null, (err, result) => {
            if (err) return cb(new Error(err));

            let network;
            try {
                network = parseToTRNetwork(result.getTFTFReturn.$value);
            } catch (e) {
                console.log("Error parsing RegulonDB tsv.");
                return cb(e);
            }

            cb(null, network);
        });
    })
}

function parseToTRNetwork(tsv) {
    let network = {
        genomeName: undefined,
        regulators: []
    }

    for (let line of tsv.split('\n')) {
        const values = line.split('\t');
        let regulatorName = values[0];
        let regulatedGene = values[1];
        let effect = values[2];
        let evidence = values[3];
        let strength = values[4];
        
        if (regulatedGene.toLowerCase() == regulatorName.toLowerCase()) continue;

        let rIndex = network.regulators.findIndex(r => r.name == regulatorName);
        if (rIndex == -1) {
            network.regulators.push({ name: regulatorName, genes: [] });
            rIndex = network.regulators.length - 1;
        }

        network.regulators[rIndex].genes.push({
            name: regulatedGene,
            effect: effect,
            strength: strength,
            evidence: evidence
        });
    }

    return network;
}