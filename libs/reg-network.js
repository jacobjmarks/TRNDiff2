// const regprecise = require("./regprecise.js");

// module.exports.getRegulatoryNetwork = (genomeId, cb) => {
//     let network = {
//         genomeId: genomeId,
//         regulators: []
//     };

//     regprecise.getRegulons(genomeId, (err, regulons) => {
//         if (err) return cb(err);

//         let regulatorCount = regulons.length;

//         for (let regulon of regulons) {
//             regprecise.getRegulators(regulon.regulonId, (err, regulators) => {
//                 if (err) return cb(err);
//                 if (!regulators) {
//                     regulatorCount--;
//                     // console.log("NO REGULATORS FOR REGULON: " + regulon.regulonId);
//                     return;
//                 }
                
//                 let regulator = regulators[0];
//                 regulator.genes = [];

//                 regprecise.getGenes(regulon.regulonId, (err, genes) => {
//                     if (err) return cb(err);

//                     for (let gene of genes) {
//                         if (gene.vimssId != regulator.vimssId) {
//                             regulator.genes.push(gene);
//                         } else {
//                             regulator.function = gene.function;
//                         }
//                     }

//                     network.regulators.push(regulator);

//                     if (network.regulators.length == regulatorCount) {
//                         network.regulators.sort((a, b) => a.vimssId - b.vimssId);
                                                
//                         cb(null, network, generateCytoscapeGraph(network));
//                     }
//                 })
//             })
//         }
//     })
// }

// module.exports.trNetworkToGraph = (network) => {
//     let regulators = network.regulators;
//     let graph = [];

//     for (let regulator of regulators) {
//         graph.push({
//             group: "nodes",
//             data: {
//                 id: regulator.name.toLowerCase(),
//                 name: regulator.name,
//                 size: regulator.genes.length
//             }
//         });

//         for (let gene of regulator.genes) {
//             graph.push({
//                 group: "edges",
//                 data: {
//                     id: `${regulator.name.toLowerCase()}_${gene.name.toLowerCase()}`,
//                     source: regulator.name.toLowerCase(),
//                     target: gene.name.toLowerCase()
//                 }
//             });
//         }
//     }

//     return graph;
// }
