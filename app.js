const express = require("express");
const app = express();
const pug = require("pug");
const fs = require("fs");

const PORT = 3000;

app.use(express.static("public"));

app.use("/", require("./routes/index.js"));
app.use("/regprecise", require("./routes/regprecise.js"));
app.use("/regulondb", require("./routes/regulondb.js"));

app.listen(PORT, () => {
    console.debug("Server listening on port " + PORT);
});