const request = require("request");

module.exports.getGenomes = (cb) => {
    request({
        method: "GET",
        url: `http://regprecise.lbl.gov/Services/rest/genomes`,
    }, (error, response, body) => {
        if (response.statusCode != 200) return cb("Error retrieving genomes.");
        let genomes = JSON.parse(body)["genome"];
        return cb(null, genomes.length ? genomes : [genomes]);
    })
}

module.exports.getRegulons = (genomeId, cb) => {
    request({
        method: "GET",
        url: `http://regprecise.lbl.gov/Services/rest/regulons?genomeId=${genomeId}`,
    }, (error, response, body) => {
        if (response.statusCode != 200) return cb("Error retrieving regulons.");
        let regulons = JSON.parse(body)["regulon"];
        return cb(null, regulons.length ? regulons : [regulons]);
    })
}

module.exports.getGenes = (regulonId, cb) => {
    request({
        method: "GET",
        url: `http://regprecise.lbl.gov/Services/rest/genes?regulonId=${regulonId}`,
    }, (error, response, body) => {
        if (response.statusCode != 200) return cb("Error retrieving genes.");
        let genes = JSON.parse(body)["gene"];
        return cb(null, genes.length ? genes : [genes]);
    })
}

module.exports.getRegulators = (regulonId, cb) => {
    request({
        method: "GET",
        url: `http://regprecise.lbl.gov/Services/rest/regulators?regulonId=${regulonId}`,
    }, (error, response, body) => {
        if (response.statusCode != 200) return cb("Error retrieving regulator.");
        body = JSON.parse(body);
        let regulators = body && body["regulator"];
        if (!regulators) return cb(null, null);
        return cb(null, regulators.length ? regulators : [regulators]);
    })
}

module.exports.getRegulatoryNetwork = (genomeId, cb) => {
    let network = {
        genomeId: genomeId,
        regulators: []
    };

    this.getRegulons(genomeId, (err, regulons) => {
        if (err) return cb(err);

        let regulatorCount = regulons.length;

        for (let regulon of regulons) {
            this.getRegulators(regulon.regulonId, (err, regulators) => {
                if (err) return cb(err);
                if (!regulators) {
                    regulatorCount--;
                    // console.log("NO REGULATORS FOR REGULON: " + regulon.regulonId);
                    return;
                }
                
                let regulator = regulators[0];
                regulator.genes = [];

                this.getGenes(regulon.regulonId, (err, genes) => {
                    if (err) return cb(err);

                    for (let gene of genes) {
                        if (gene.vimssId != regulator.vimssId) {
                            regulator.genes.push(gene);
                        } else {
                            regulator.function = gene.function;
                        }
                    }

                    network.regulators.push(regulator);

                    if (network.regulators.length == regulatorCount) {
                        network.regulators.sort((a, b) => a.vimssId - b.vimssId);
                                                
                        cb(null, network, generateCytoscapeGraph(network));
                    }
                })
            })
        }
    })
}

function generateCytoscapeGraph(regulatoryNetwork) {
    let regulators = regulatoryNetwork.regulators;
    let graph = [];

    for (let regulator of regulators) {
        graph.push({
            group: "nodes",
            data: {
                id: regulator.vimssId,
                name: regulator.name
            }
        });

        for (let gene of regulator.genes) {
            for (let queryRegulator of regulators) {
                if (regulator == queryRegulator) continue;
                for (let queryGene of queryRegulator.genes) {
                    if (gene.vimssId == queryGene.vimssId) {
                        graph.push({
                            group: "edges",
                            data: {
                                id: `${gene.vimssId}_${queryGene.vimssId}`,
                                source: regulator.vimssId,
                                target: queryRegulator.vimssId
                            }
                        })
                        break;
                    }
                }
            }
        }
    }

    return graph;
}