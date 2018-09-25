const fs = require("fs");

let tsv = fs.readFileSync("go-terms.tsv").toString();
let lines = tsv.split("\n");

let terms = [];

for (let line of lines) {
    let values = line.split("\t");

    terms.push({
        id: Number.parseInt(values[0]),
        name: values[1],
        term_type: values[2],
        acc: values[3],
        is_obsolete: Number.parseInt(values[4]),
        is_root: Number.parseInt(values[5]),
        is_relation: Number.parseInt(values[6])
    });
}

fs.writeFileSync("go-terms.json", JSON.stringify(terms));