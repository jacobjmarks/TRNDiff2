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
        res.json(genomes);
    });
});

router.get("/regulogs", (req, res) => {
    regprecise.regulogs(generateFilter(req.query), (err, regulogs) => {
        if (err) { console.error(err); return res.status(500).end(); }
        res.json(regulogs);
    });
});

router.get("/regulons", (req, res) => {
    regprecise.regulons(generateFilter(req.query), (err, regulons) => {
        if (err) { console.error(err); return res.status(500).end(); }
        res.json(regulons);
    });
});

router.get("/genes", (req, res) => {
    regprecise.genes(generateFilter(req.query), (err, genes) => {
        if (err) { console.error(err); return res.status(500).end(); }
        res.json(genes);
    });
});

router.get("/graph/wagonwheels/regulog/:id", (req, res) => {
    regprecise.regulons(r => r.regulogId == req.params.id, (err, regulons) => {
        if (err) { console.error(err); return res.status(500).end(); }
        let network = [];

        for (let regulon of regulons) {
            regprecise.genes(g => g.regulonId == regulon.regulonId, (err, genes) => {
                if (err && !res.headersSent) { console.error(err); return res.status(500).end(); }

                regulon.regulator = genes.find(g => g.name.toLowerCase() == regulon.regulatorName.toLowerCase());
                regulon.targetGenes = [];
                
                for (let gene of genes.filter(g => g != regulon.regulator)) {
                    regprecise.sites(s => s.geneVIMSSId == gene.vimssId, (err, sites) => {
                        if (err && !res.headersSent) { console.error(err); return res.status(500).end(); }

                        gene.sites = sites;
                        regulon.targetGenes.push(gene);
                        network.push(regulon);

                        if (network.length == regulons.length) res.json(network);
                    })
                }

                network.push(regulon);

            })
        }
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