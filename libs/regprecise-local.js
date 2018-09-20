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

module.exports.getRegulogNetwork = (regulonId, cb) => {
    let network = {};
    let regulon = db.regulons.find(r => r.regulonId == regulonId);
    network["selected-regulon"] = regulon.regulonId;
    network["regulons"] = db.regulons.filter(r => r.regulogId == regulon.regulogId);
    network["selected-genome"] = db.genomes.find(g => g.genomeId == regulon.genomeId);

    for (let regulon of network["regulons"]) {
        let genes = db.genes.filter(g => g.regulonId == regulon.regulonId);
        genes = genes.filter(g => g.name != undefined);

        regulon.regulator = genes.find(g => g.name && g.name.toLowerCase() == regulon.regulatorName.toLowerCase())
        regulon.targetGenes = genes.filter(g => g.name && g != regulon.regulator);

        for (let gene of regulon.targetGenes) {
            gene.sites = db.sites.filter(s => s.geneVIMSSId == gene.vimssId);
        }
    }

    // Calculate and add distances...

    let uniqueGeneNames = network["regulons"].map(r => r.targetGenes.map(tg => tg.name))
                                             .reduce((a, b) => a.concat(b), [])
                                             .filter((name, index, self) => self.indexOf(name) === index)

    let binaryGeneMatrix = generateBinaryGeneMatrix(uniqueGeneNames, network["regulons"]);
    let target = binaryGeneMatrix[regulonId];

    for (let key of Object.keys(binaryGeneMatrix)) {
        network["regulons"].find(r => r.regulonId == key).distance = hammingDist(target, binaryGeneMatrix[key]);
    }

    network.regulons = network.regulons.sort((a, b) => a.distance - b.distance);

    network.regulons.forEach(r => console.log(r.distance));

    cb(null, network);
}

function generateBinaryGeneMatrix(geneNames, regulons) {
    let matrix = {};

    for (let regulon of regulons) {
        let vector = "";
        for (let geneName of geneNames) {
            vector += regulon.targetGenes.find(g => g.name == geneName) ? "1" : "0";
        }
        matrix[regulon.regulonId] = vector;
    }

    return matrix;
}

function hammingDist(a, b) {
    let dist = 0;

    for (let i = 0; i < a.length; i++) {
        if (a[i] != b[i]) dist++;
    }

    return dist;
}

function levensteinDist(a, b) {
    let m = [], i, j, min = Math.min;

    if (!(a && b)) return (b || a).length;

    for (i = 0; i <= b.length; m[i] = [i++]);
    for (j = 0; j <= a.length; m[0][j] = j++);

    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            m[i][j] = b.charAt(i - 1) == a.charAt(j - 1)
                ? m[i - 1][j - 1]
                : m[i][j] = min(
                    m[i - 1][j - 1] + 1, 
                    min(m[i][j - 1] + 1, m[i - 1 ][j]))
        }
    }

    return m[b.length][a.length];
}