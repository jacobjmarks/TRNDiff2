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

module.exports.getGenomes = (cb) => {
    cb(null, db.genomes);
}

module.exports.getRegulogs = (cb) => {
    cb(null, db.regulogs);
}

module.exports.getRegulons = (genomeId, cb) => {
    cb(null, db.regulons.filter((r) => r.genomeId === genomeId));
}

module.exports.getGenes = (regulonId, cb) => {
    cb(null, db.genes.filter((g) => g.regulonId === regulonId));
}

module.exports.getRegulators = (regulonId, cb) => {
    cb(null, db.regulators.filter((r) => r.regulonId === regulonId));
}

module.exports.status = (cb) => cb(null, 200);