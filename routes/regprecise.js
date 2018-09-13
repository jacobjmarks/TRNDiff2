const express = require("express");
const router = express.Router();

const regprecise = require("../libs/regprecise-local.js");
const regNetwork = require("../libs/reg-network.js");

router.get("/status", (req, res) => {
    regprecise.status((err, status) => {
        if (err) { console.error(err); return res.status(500).end(); }
        res.send(`${status}`);
    });
});

router.get("/genomes", (req, res) => {
    regprecise.genomes(generateFilter(req.query), (err, genomes) => {
        if (err) { console.error(err); return res.status(500).end(); }
        if (req.headers["content-type"] == "application/json") return res.json(genomes);
        res.render("tables/rp-genomes.pug", { genomes: genomes });
    });
});

router.get("/regulogs", (req, res) => {
    regprecise.regulogs(generateFilter(req.query), (err, regulogs) => {
        if (err) { console.error(err); return res.status(500).end(); }
        res.json(regulogs);
    });
});

router.get("/regulons", (req, res) => {
    if (!Object.keys(req.query).length || !req.query.genomeId) return res.redirect("/regprecise/genomes");
    regprecise.genomes(g => g.genomeId == req.query.genomeId, (err, genome) => {
        if (err) { console.error(err); return res.status(500).end(); }
        regprecise.regulons(r => r.genomeId == req.query.genomeId, (err, regulons) => {
            if (err) { console.error(err); return res.status(500).end(); }
            res.render("tables/rp-regulons.pug", { genome: genome, regulons: regulons });
        });
    });
});

router.get("/genes", (req, res) => {
    regprecise.genes(generateFilter(req.query), (err, genes) => {
        if (err) { console.error(err); return res.status(500).end(); }
        res.json(genes);
    });
});

router.get("/graph", (req, res) => {
    if (!Object.keys(req.query).length || !req.query.regulonId) return res.redirect("/regprecise/genomes");
    regprecise.getRegulogNetwork(req.query.regulonId, (err, network) => {
        if (err) { console.error(err); return res.status(500).end(); }
        if (req.headers["content-type"] == "application/json") return res.json(network);
        res.render("wagon-wheels.pug", { network: JSON.stringify(network) });
    })
});

function generateFilter(reqQuery) {
    let keys = Object.keys(reqQuery);
    if (!keys.length) return r => true;
    return (obj) => {
        for (let key of keys) {
            if (obj[key] != reqQuery[key]) return false;
        }
        return true;
    }
}

module.exports = router;