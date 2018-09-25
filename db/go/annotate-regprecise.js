const fs = require("fs");
const levenshtein = require("fast-levenshtein");

let genes = JSON.parse(fs.readFileSync("../regprecise/genes.json"));
let terms = JSON.parse(fs.readFileSync("go-terms.json"));

genes = genes.filter(g => g.function);
terms = terms.filter(t => t.term_type == "molecular_function" && !t.is_obsolete);

let annotated = [];

for (let gene of genes) {
    let termDistances = terms.map(t => levenshtein.get(gene.function, t.name));

    annotated.push({
        geneVIMSSId: gene.vimssId,
        term: terms[termDistances.indexOf(Math.min(...termDistances))].name
    })

    process.stdout.write('\r' + (annotated.length / genes.length * 100).toFixed(3) + '%');
}

fs.writeFileSync("../regprecise/genes-go.json", JSON.stringify(annotated));