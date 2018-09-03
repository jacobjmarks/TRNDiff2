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
    regprecise.getGenomes((err, genomes) => {
        if (err) { console.error(err); return res.status(500).end(); }
        res.json(genomes);
    });
});

router.get("/regulogs", (req, res) => {
    regprecise.getRegulogs((err, regulogs) => {
        if (err) { console.error(err); return res.status(500).end(); }
        res.json(regulogs);
    })
})

// router.get("/regulatorynetwork/:genomeId", (req, res) => {
//     regNetwork.getRegulatoryNetwork(req.params.genomeId, (err, network, graph) => {
//         if (err) { console.error(err); return res.status(500).end(); }
//         res.json({ network: network, graph: graph });
//     });
// });

module.exports = router;