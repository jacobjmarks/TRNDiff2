const request = require("request");

module.exports.getGenomes = (cb) => {
    request("http://regprecise.lbl.gov/Services/rest/genomes", (err, res, body) => {
        if (err) return cb(err);
        let genomes = JSON.parse(body);
        cb(null, genomes.genome ? genomes.genome : [genomes]);
    });
}