const express = require("express");
const app = express();
const pug = require("pug");
const fs = require("fs");

const regprecise = require("./libs/regprecise.js");
const regulondb = require("./libs/regulondb.js");

const PORT = 3000;

app.use(express.static("public"));

app.get("/", (req, res) => {
    res.render("index.pug");
});

app.get("/regprecise/genomes", (req, res) => {
    regprecise.getGenomes((err, genomes) => {
        if (err) return res.status(500).end();
        res.json(genomes);
    });
});

app.get("/regprecise/regulatorynetwork/:genomeId", (req, res) => {
    regprecise.getRegulatoryNetwork(req.params.genomeId, (err, network, graph) => {
        if (err) return res.status(500).end();
        res.json({ network: network, graph: graph });
    });
});

app.listen(PORT, () => {
    console.debug("Server listening on port " + PORT);
});

fs.writeFileSync("./public/js/pug-templates.js", pug.compileFileClient("./views/templates/genome.pug", { name: "pugTemplate_genome" }));