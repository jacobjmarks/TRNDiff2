const fs = require("fs");
const levenshtein = require("fast-levenshtein");

let genes = JSON.parse(fs.readFileSync("../regprecise/genes.json"))
    .filter(g => g.function)
    .reduce((a, b) => {
        if (!a.find(g => g.name == b.name)) {
            a.push(b);
        }
        return a;
    }, [])

let terms = JSON.parse(fs.readFileSync("term.json"))
    .filter(t => t.term_type == "molecular_function" && !t.is_obsolete);

let term2term = JSON.parse(fs.readFileSync("term2term.json"));

let parentTermCache = {};

let findParentTerm = (termId) => {
    return parentTermCache[termId] || (() => {
        let t2t = term2term.find(t => t.term2_id == termId);
    
        while ((next = term2term.find(t => t.term2_id == t2t.term1_id)) && next.term1_id != 47375) {
            t2t = next;
        }
    
        return parentTermCache[termId] = terms.find(t => t.id == t2t.term2_id);
    })()
}

let annotated = [];

for (let gene of genes) {
    let termDistances = terms.map(t => levenshtein.get(gene.function, t.name));

    annotated.push({
        geneName: gene.name,
        term: findParentTerm(terms[termDistances.indexOf(Math.min(...termDistances))].id).name
    })

    process.stdout.write('\r' + (annotated.length / genes.length * 100).toFixed(2) + '%');
}

fs.writeFileSync("rp-gene-terms.json", JSON.stringify(annotated));