const express = require("express");
const app = express();
const pug = require("pug");
const fs = require("fs");

const regprecise = require("./libs/regprecise.js");
const regNetwork = require("./libs/reg-network.js");
const regulondb = require("./libs/regulondb.js");

const PORT = 3000;

app.use(express.static("public"));

app.get("/", (req, res) => {
    res.render("index.pug");
});

app.get("/tab-:index", (req, res) => {
    res.render("new-tab.pug", { tabIndex: req.params.index });
});

app.get("/regprecise/status", (req, res) => {
    regprecise.status((status) => {
        res.send(`${status}`);
    });
});

app.get("/regprecise/genomes", (req, res) => {
    regprecise.getGenomes((err, genomes) => {
        if (err) return res.status(500).end();
        res.json(genomes);
    });
});

app.get("/regulondb", (req, res) => {
    regulondb.getRegulators((err, network) => {
        if (err) return res.status(500).end();
        res.send(network);
    });
});

// app.get("/regprecise/regulatorynetwork/:genomeId", (req, res) => {
//     regNetwork.getRegulatoryNetwork(req.params.genomeId, (err, network, graph) => {
//         if (err) return res.status(500).end();
//         res.json({ network: network, graph: graph });
//     });
// });

app.listen(PORT, () => {
    console.debug("Server listening on port " + PORT);
});