const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
    res.render("hammerTest.pug");
});

module.exports = router;