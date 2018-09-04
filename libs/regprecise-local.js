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