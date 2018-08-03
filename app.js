const express = require("express");
const app = express();

const PORT = 3000;

app.get("/", (req, res) => {
    res.end();
});

app.listen(PORT, () => {
    console.debug("Server listening on port " + PORT);
});