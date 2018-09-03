const express = require("express");
const router = express.Router();

const regulondb = require("../libs/regulondb.js");
const regNetwork = require("../libs/reg-network.js");

router.get("/genome/:id", (req, res) => {
    regulondb.getRegulators((err, network) => {
        if (err) { console.error(err); return res.status(500).end(); }
        res.json(req.query.graphable ? regNetwork.trNetworkToGraph(network) : network);
    });
});

module.exports = router;