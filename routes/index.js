const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
    res.render("index.pug");
});

router.get("/tab-:index", (req, res) => {
    res.render("new-tab.pug", { tabIndex: req.params.index });
});

router.get("/graph", (req, res) => {
    if (!Object.keys(req.query).length || !req.query.source || !req.query.type || !req.query.id) {
        res.statusCode = 302;
        res.location("/");
        res.end();
        return;
    }

    res.render("graph.pug", { query: JSON.stringify(req.query) });
});

module.exports = router;