const request = require("request");
const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");

const baseDir = "./db/regprecise/";

const dbZip = new AdmZip(path.join(baseDir, "regprecise.json.zip"));
dbZip.extractAllTo(baseDir);

const parse = (file) => JSON.parse(fs.readFileSync(path.join(baseDir, file)));

const db = {
    genomes: parse("genomes.json"),
    genes: parse("genes.json"),
    regulons: parse("regulons.json"),
    regulogs: parse("regulogs.json"),
    regulators: parse("regulators.json"),
    sites: parse("sites.json")
}

module.exports.genomes = (filter, cb) => {
    cb(null, db.genomes.filter(filter));
}

module.exports.genes = (filter, cb) => {
    cb(null, db.genes.filter(filter));
}

module.exports.regulogs = (filter, cb) => {
    cb(null, db.regulogs.filter(filter));
}

module.exports.regulons = (filter, cb) => {
    cb(null, db.regulons.filter(filter));
}

module.exports.regulators = (filter, cb) => {
    cb(null, db.regulators.filter(filter));
}

module.exports.sites = (filter, cb) => {
    cb(null, db.sites.filter(filter));
}

module.exports.status = (cb) => cb(null, 200);

module.exports.getRegulogNetwork = (regulogId, cb) => {
    let network = db.regulons.filter(r => r.regulogId == regulogId);

    for (let regulon of network) {
        let genes = db.genes.filter(g => g.regulonId == regulon.regulonId);

        regulon.regulator = genes.find(g => g.name && g.name.toLowerCase() == regulon.regulatorName.toLowerCase())
        regulon.targetGenes = genes.filter(g => g.name && g != regulon.regulator);

        for (let gene of regulon.targetGenes) {
            gene.sites = db.sites.filter(s => s.geneVIMSSId == gene.vimssId);
        }
    }

    cb(null, network);
}
