const express = require("express");
const app = express();
const pug = require("pug");
const fs = require("fs");

const regprecise = require("./libs/regprecise-local.js");
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
    regprecise.status((err, status) => {
        if (err) { console.error(err); return res.status(500).end(); }
        res.send(`${status}`);
    });
});

app.get("/regprecise/genomes", (req, res) => {
    regprecise.getGenomes((err, genomes) => {
        if (err) { console.error(err); return res.status(500).end(); }
        res.json(genomes);
    });
});

app.get("/regulondb/genome/:id", (req, res) => {
    regulondb.getRegulators((err, network) => {
        if (err) { console.error(err); return res.status(500).end(); }
        res.json(req.query.graphable ? regNetwork.trNetworkToGraph(network) : network);
    });
});

app.get("/graph", (req, res) => {
    if (!Object.keys(req.query).length || !req.query.source || !req.query.type || !req.query.id) {
        res.statusCode = 302;
        res.location("/");
        res.end();
        return;
    }

    res.render("graph.pug", { query: JSON.stringify(req.query) });
});

// app.get("/regprecise/regulatorynetwork/:genomeId", (req, res) => {
//     regNetwork.getRegulatoryNetwork(req.params.genomeId, (err, network, graph) => {
//         if (err) { console.error(err); return res.status(500).end(); }
//         res.json({ network: network, graph: graph });
//     });
// });

app.listen(PORT, () => {
    console.debug("Server listening on port " + PORT);
});