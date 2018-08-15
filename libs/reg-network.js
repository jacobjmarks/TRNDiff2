const regprecise = require("./regprecise.js");

module.exports.getRegulatoryNetwork = (genomeId, cb) => {
    let network = {
        genomeId: genomeId,
        regulators: []
    };

    regprecise.getRegulons(genomeId, (err, regulons) => {
        if (err) return cb(err);

        let regulatorCount = regulons.length;

        for (let regulon of regulons) {
            regprecise.getRegulators(regulon.regulonId, (err, regulators) => {
                if (err) return cb(err);
                if (!regulators) {
                    regulatorCount--;
                    // console.log("NO REGULATORS FOR REGULON: " + regulon.regulonId);
                    return;
                }
                
                let regulator = regulators[0];
                regulator.genes = [];

                regprecise.getGenes(regulon.regulonId, (err, genes) => {
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

    let geneCounts = regulators.map(r => r.genes.length);
    let minGeneCount = Math.min(...geneCounts);
    let maxGeneCount = Math.max(...geneCounts);

    const minNodeSize = 20;
    const maxNodeSize = 150;

    for (let queryRegulator of regulators) {
        graph.push({
            group: "nodes",
            data: {
                id: queryRegulator.vimssId,
                name: queryRegulator.name,
                size: minNodeSize + queryRegulator.genes.length / maxGeneCount * (maxNodeSize - minNodeSize)
            }
        });

        for (let queryGene of queryRegulator.genes) {
            for (let targetRegulator of regulators) {
                if (queryRegulator == targetRegulator) continue;
                if (queryGene.vimssId == targetRegulator.vimssId) {
                    graph.push({
                        group: "edges",
                        data: {
                            id: `${queryGene.vimssId}_${targetRegulator.vimssId}`,
                            source: queryRegulator.vimssId,
                            target: targetRegulator.vimssId
                        }
                    });
                    break;
                }
            }
        }
    }

    return graph;
}
