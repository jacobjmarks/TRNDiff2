const fs = require("fs");

let tsv = fs.readFileSync("term2term.tsv").toString();
let lines = tsv.split("\n");

let results = [];

for (let line of lines) {
    let values = line.split("\t");

    results.push({
        id: Number.parseInt(values[0]),
        relationship_type_id: Number.parseInt(values[1]),
        term1_id: Number.parseInt(values[2]),
        term2_id: Number.parseInt(values[3]),
        complete: Number.parseInt(values[4])
    });
}

fs.writeFileSync("term2term.json", JSON.stringify(results));