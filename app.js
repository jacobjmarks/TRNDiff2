const express = require("express");
const app = express();
const bodyParser = require("body-parser");

const PORT = 3000;

app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use("/", require("./routes/index.js"));
app.use("/regprecise", require("./routes/regprecise.js"));
app.use("/regulondb", require("./routes/regulondb.js"));
app.use("/local", require("./routes/local.js"));
//app.use("/hammerTest", require("./routes/hammerTest.js"));

app.listen(PORT, () => {
    console.debug("Server listening on port " + PORT);
});