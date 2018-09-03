const request = require("request");

module.exports.getGenomes = (cb) => {
    request({
        method: "GET",
        url: `http://regprecise.lbl.gov/Services/rest/genomes`,
    }, (error, response, body) => {
        if (error || response.statusCode != 200) return cb(new Error(error || response.statusMessage));
        let genomes = JSON.parse(body)["genome"];
        return cb(null, genomes.length ? genomes : [genomes]);
    })
}

module.exports.getRegulons = (genomeId, cb) => {
    request({
        method: "GET",
        url: `http://regprecise.lbl.gov/Services/rest/regulons?genomeId=${genomeId}`,
    }, (error, response, body) => {
        if (error || response.statusCode != 200) return cb(new Error(error || response.statusMessage));
        let regulons = JSON.parse(body)["regulon"];
        return cb(null, regulons.length ? regulons : [regulons]);
    })
}

module.exports.getGenes = (regulonId, cb) => {
    request({
        method: "GET",
        url: `http://regprecise.lbl.gov/Services/rest/genes?regulonId=${regulonId}`,
    }, (error, response, body) => {
        if (error || response.statusCode != 200) return cb(new Error(error || response.statusMessage));
        let genes = JSON.parse(body)["gene"];
        return cb(null, genes.length ? genes : [genes]);
    })
}

module.exports.getRegulators = (regulonId, cb) => {
    request({
        method: "GET",
        url: `http://regprecise.lbl.gov/Services/rest/regulators?regulonId=${regulonId}`,
    }, (error, response, body) => {
        if (error || response.statusCode != 200) return cb(new Error(error || response.statusMessage));
        body = JSON.parse(body);
        let regulators = body && body["regulator"];
        if (!regulators) return cb(null, null);
        return cb(null, regulators.length ? regulators : [regulators]);
    })
}

module.exports.status = (cb) => {
    request({
        method: "GET",
        url: `http://regprecise.lbl.gov/Services/rest/release`,
    }, (error, response, body) => {
        cb(error ? new Error(error) : null, response.statusCode);
    })
}