const usage = "Usage: node scrape.js {genomes|regulons|regulogs|genes|regulators|sites}";
if (process.argv.length < 3) return console.log(usage);

const http = require("http");
const fs = require("fs");
const readline = require('readline');

const REQUEST_DELAY = 100; // milliseconds

const base = "http://regprecise.lbl.gov/Services/rest";

function GET(target, cb) {
    http.get(`${base}/${target}`, (rsp) => {
        if (rsp.statusCode != 200) return cb(new Error(rsp.statusCode));
        let data = "";
        rsp.on("data", chunk => data += chunk);
        rsp.on("end", () => cb(null, JSON.parse(data)));
    }).on("error", (err) => {
        cb(err);
    })
}

function prompt(message, cb) {
    let rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question(message, (answer) => {
        cb(answer);
        rl.close();
    });
}

function scrape(target, collection, qsFunc, addResultFunc, cb) {
    let requestCount = 0;
    let timeToWait = 0;
    let abort = false;
    let results = [];

    const request = (item) => {
        requestCount++;
        GET(target + (item ? qsFunc(item) : ""), (err, result) => {
            if (abort) return;
            if (err) { cb(err); return abort = true; }
            if (!result) return;

            results = addResultFunc(results, result);

            requestCount--;
            if (!requestCount) {
                cb(null, results);
            }
        })
    }

    if (!collection) return request();
    for (let item of collection) {
        if (abort) break;
        setTimeout(() => {
            if (abort) return;
            request(item);
        }, timeToWait += REQUEST_DELAY)
    }

}

switch (process.argv[2]) {
    case "genomes": // --------------------------------------------------------------------------------------------- GENOMES
        scrape("genomeStats", null, null, (_, result) => result["genomeStat"], (err, results) => {
            if (err) return console.error(err);
            fs.writeFile("genomes.json", JSON.stringify(results), (err) => {
                if (err) return console.error(err);
                console.log("Successfully dumped to genomes.json");
            })
        })
        break;
    case "regulons": // ------------------------------------------------------------------------------------------- REGULONS
        if (!fs.existsSync("genomes.json")) return console.log("Please scrape genomes first.");
        fs.readFile("genomes.json", (err, data) => {
            if (err) return console.error(err);
            let genomes = JSON.parse(data);

            let eta = genomes.length * REQUEST_DELAY / 1000 / 60;
            prompt(`ETA ${eta.toFixed(2)} minutes. Proceed? (Y/n) `, (answer) => {
                if (answer == 'n') process.exit();
                scrape("regulons", genomes, g => `?genomeId=${g.genomeId}`,
                    (results, result) => {
                        result = result["regulon"];
                        return results.concat(result.length ? result : [result]);
                    },
                    (err, results) => {
                        if (err) return console.error(err);
                        fs.writeFile("regulons.json", JSON.stringify(results), (err) => {
                            if (err) return console.error(err);
                            console.log("Successfully dumped to regulons.json");
                        })
                    }
                );
            })
        });
        break;
    case "regulogs": // ------------------------------------------------------------------------------------------- REGULOGS
        if (!fs.existsSync("regulons.json")) return console.log("Please scrape regulons first.");
        fs.readFile("regulons.json", (err, data) => {
            if (err) return console.error(err);
            let regulons = JSON.parse(data);

            let regulogIDs = regulons.map(r => r.regulogId).filter((id, index, self) => self.indexOf(id) === index);

            let eta = regulogIDs.length * REQUEST_DELAY / 1000 / 60;
            prompt(`ETA ${eta.toFixed(2)} minutes. Proceed? (Y/n) `, (answer) => {
                if (answer == 'n') process.exit();
                scrape("regulog", regulogIDs, rID => `?regulogId=${rID}`,
                    (results, result) => {
                        results.push(result);
                        return results;
                    },
                    (err, results) => {
                        if (err) return console.error(err);
                        fs.writeFile("regulogs.json", JSON.stringify(results), (err) => {
                            if (err) return console.error(err);
                            console.log("Successfully dumped to regulogs.json");
                        })
                    }
                );
            })
        });
        break;
    case "genes": // ------------------------------------------------------------------------------------------------- GENES
        if (!fs.existsSync("regulogs.json")) return console.log("Please scrape regulogs first.");
        fs.readFile("regulogs.json", (err, data) => {
            if (err) return console.error(err);
            let regulogs = JSON.parse(data);

            let eta = regulogs.length * REQUEST_DELAY / 1000 / 60;
            prompt(`ETA ${eta.toFixed(2)} minutes. Proceed? (Y/n) `, (answer) => {
                readline.close();
                if (answer == 'n') process.exit();
                scrape("genes", regulogs, r => `?regulogId=${r.regulogId}`,
                    (results, result) => {
                        result = result["gene"];
                        return results.concat(result.length ? result : [result]);
                    },
                    (err, results) => {
                        if (err) console.error(err);
                        fs.writeFile("genesTest.json", JSON.stringify(results), (err) => {
                            if (err) return console.error(err);
                            console.log("Successfully dumped to genes.json");
                        })
                    }
                );
            })
        })
        break;
    case "regulators": // --------------------------------------------------------------------------------------- REGULATORS
        if (!fs.existsSync("regulogs.json")) return console.log("Please scrape regulogs first.");
        fs.readFile("regulogs.json", (err, data) => {
            if (err) return console.error(err);
            let regulogs = JSON.parse(data);

            let eta = regulons.length * REQUEST_DELAY / 1000 / 60;
            prompt(`ETA ${eta.toFixed(2)} minutes. Proceed? (Y/n) `, (answer) => {
                if (answer == 'n') process.exit();
                scrape("regulators", regulogs, r => `?regulogId=${r.regulogId}`,
                    (results, result) => {
                        result = result["regulator"];
                        return results.concat(result.length ? result : [result]);
                    },
                    (err, results) => {
                        if (err) console.error(err);
                        fs.writeFile("regulators.json", JSON.stringify(results), (err) => {
                            if (err) return console.error(err);
                            console.log("Successfully dumped to regulators.json");
                        })
                    }
                );
            })
        })
        break;
    case "sites": // ------------------------------------------------------------------------------------------------- SITES
        if (!fs.existsSync("regulogs.json")) return console.log("Please scrape regulogs first.");
        fs.readFile("regulogs.json", (err, data) => {
            if (err) return console.error(err);
            let regulogs = JSON.parse(data);

            let eta = regulogs.length * REQUEST_DELAY / 1000 / 60;
            prompt(`ETA ${eta.toFixed(2)} minutes. Proceed? (Y/n) `, (answer) => {
                if (answer == 'n') process.exit();
                scrape("sites", regulogs, r => `?regulogId=${r.regulogId}`,
                    (results, result) => {
                        result = result["site"];
                        return results.concat(result.length ? result : [result]);
                    },
                    (err, results) => {
                        if (err) console.error(err);
                        fs.writeFile("sitesTest.json", JSON.stringify(results), (err) => {
                            if (err) return console.error(err);
                            console.log("Successfully dumped to sites.json");
                        })
                    }
                );
            })
        })
        break;
    case "count": // ------------------------------------------------------------------------------------------ DEBUG: COUNT
        const count = (path) => {
            try {
                let json = JSON.parse(fs.readFileSync(path));
                return json && json.length;
            } catch (e) { return null }
        }
        console.log("Genomes: " + count("genomes.json"))
        console.log("Regulons: " + count("regulons.json"))
        console.log("Regulogs: " + count("regulogs.json"))
        console.log("Genes: " + count("genes.json"))
        console.log("Regulators: " + count("regulators.json"))
        console.log("Sites: " + count("sites.json"))
        break;
    // case "test":
    //     readline.close();
    //     let a = JSON.parse(fs.readFileSync("xxx"));
    //     console.log(a.length);
    //     let b = JSON.parse(fs.readFileSync("xxx"));
    //     console.log(b.length);

    //     let count = 0;

    //     for (let obj of b) {
    //         if (!a.find((o) => {
    //             for (let key of Object.keys(obj)) {
    //                 if (!o[key] || o[key] != obj[key]) return false;
    //             }
    //             return true;
    //         })) count++;
    //     }
        
    //     console.log(count);

    //     break;
    default:
        console.log(usage);
        break;
}