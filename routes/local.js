const express = require("express");
const router = express.Router();
const formidable = require('formidable');
const fs = require('fs');
const readline = require('readline');
const csv = require('jquery-csv');

const MIME_CSV = "text/csv"
const MIME_EXCEL = "application/vnd.ms-excel"

router.post("/", (req, res) => {    
    
    // Get the form data using Formidable
    var form = new formidable.IncomingForm();
    
    // Do things if there is a file present
    form.parse(req)
    .on('file', (name, file) => {
        //console.log('Uploaded file', name, file);
        
        // First check if the MIME type is correct
        // Excel is counted because CSV created in Excel can have an Excel MIME
        // type
        if (file.type.includes(MIME_CSV) ||  file.type.includes(MIME_EXCEL)) {
            console.log("MIME type indicates this is a CSV or Excel file")
        } else {
            console.log("MIME type indicates this is not a CSV or Excel file")
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write("You did not upload a CSV file!");
            res.end();
            return;
        }
      
        // If it is, try to parse it
        console.log('Attempting to read file...');
        fs.readFile(file.path, function(err, data) {
            if (err) throw err;
            console.log('File read');
            console.log('Attempting to parse CSV...');
            try {
                // Try to parse the data as a string into a CSV array using
                // jquery-csv
                records = csv.toArrays(data.toString());
                console.log("CSV parsed");
                
                // Now try to seperate it out into the seperate types of object
                // Based on the parse code in the older TRNDiff                
                var genomeRecords = [];
                var regulogRecords = [];
                var regulonRecords = [];
                var geneRecords = [];
                var regulatorRecords = [];
                var siteRecords = [];
                var tables = [ genomeRecords, regulogRecords, regulonRecords, geneRecords, regulatorRecords, siteRecords ];
                var tableNames = [ "genomes", "regulogs", "regulons", "genes", "regulators", "sites" ];
                var currentTable;
                
                console.log("Attempting to add records to object tables...")
                // Go through each line in the CSV array
                for (var i = 0; i < records.length; i++) {
                    
                    // Skip the current line if it is empty
                    if (records[i].length < 1 || records[i] == null || records[i][0].length == 0 || records[i][0] == "") continue;
                    
                    var nameIndex = tableNames.indexOf(records[i][0].toLowerCase());
                    
                    // If the current line is a title of one of the objects,
                    // set the table index and make sure the table exists
                    if ( nameIndex >= 0 ) {
                        console.log("Parsing " + tableNames[nameIndex] + " table");
                        currentTable = tables[nameIndex];
                    }
                        
                    // Otherwise add the current line to the table at the current index
                    else {
                        currentTable.push(records[i]);
                    }
                }
                
                console.log("Completed adding records");
                console.log("Attempting to create genomes table");
                var genomes = parseGenomes(genomeRecords);
                console.log("Attempting to create regulogs table");
                var regulogs = parseRegulogs(regulogRecords);
                console.log("Attempting to create regulons table");
                var regulons = parseRegulons(regulonRecords);
                console.log("Attempting to create genes table");
                var genes = parseGenes(geneRecords);
                console.log("Attempting to create regulators table");
                var regulators = parseRegulators(regulatorRecords);
                console.log("Attempting to create sites table");
                var sites = parseSites(siteRecords);
                
                console.log("Successfully parsed CSV records")
                
                //res.writeHead(200, {'Content-Type': 'text/html'});
                //res.write("Successfully loaded: ");
                console.log(genomes.length + " genome(s)");
                //res.write(genomes.length + " genome(s), ");
                /*for (var i = 0; i < genomes.length; i++) {
                    console.log(genomes[i]);
                }*/
                //console.log(genomes[0]);
                console.log(regulogs.length + " regulog(s)");
                //res.write(regulogs.length + " regulog(s), ");
                /*for (var i = 0; i < regulogs.length; i++) {
                    console.log(regulogs[i]);
                }*/
                //console.log(regulogs[0]);
                console.log(regulons.length + " regulon(s)");
                //res.write(regulons.length + " regulon(s), ");
                /*for (var i = 0; i < regulons.length; i++) {
                    console.log(regulons[i]);
                }*/
                //console.log(regulons[0]);
                console.log(genes.length + " gene(s)");
                //res.write(genes.length + " gene(s), ");
                /*for (var i = 0; i < genes.length; i++) {
                    console.log(genes[i]);
                }*/
                //console.log(genes[0]);
                console.log(regulators.length + " regulator(s)");
                //res.write(regulators.length + " regulator(s), and ");
                /*for (var i = 0; i < regulators.length; i++) {
                    console.log(regulators[i]);
                }*/
                //console.log(regulators[0]);
                console.log(sites.length + " site(s)");
                //res.write(sites.length + " site(s)");
                /*for (var i = 0; i < sites.length; i++) {
                    console.log(sites[i]);
                }*/
                //console.log(sites[0]);
                //res.end();
                
                console.log("Preparing CSV records to draw wagon wheels...");
                
                // This is based on "getRegulogNetwork" from regprecise-local.js
                let goTerms = JSON.parse(fs.readFileSync("./db/go/rp-gene-terms.json"));
                let network = {};
                network["selected-regulon"] = regulons[0].regulonId;
                network["regulons"] = regulons;
                network["selected-genome"] = genomes.find(g => g.genomeId == regulons[0].genomeId);

                for (let regulon of network["regulons"]) {
                    let newGenes = genes.filter(g => g.regulonId == regulon.regulonId);
                    newGenes = newGenes.filter(g => g.name != undefined);

                    regulon.regulator = regulators.find(g => g.name && g.name.toLowerCase() == regulon.regulatorName.toLowerCase())
                    regulon.targetGenes = newGenes.filter(g => g.name && g != regulon.regulator);

                    for (let gene of regulon.targetGenes) {
                        gene.sites = sites.filter(s => s.geneVIMSSId == gene.vimssId);
                        
                        // Only try to get a GO term if one wasn't already
                        // loaded from the CSV
                        if (gene.term == null) {
                            let goTerm = goTerms.find(t => t.geneName == gene.name)
                            if (goTerm != null) {
                                gene.term = goTerm.term;
                            } else {
                                gene.term = "unknown";
                            }
                        }
                    }
                }

                // Calculate and add distances...

                let uniqueGeneNames = network["regulons"].map(r => r.targetGenes.map(tg => tg.name))
                                                         .reduce((a, b) => a.concat(b), [])
                                                         .filter((name, index, self) => self.indexOf(name) === index)
                                                         .sort((a, b) => a.localeCompare(b))

                let binaryGeneMatrix = generateBinaryGeneMatrix(uniqueGeneNames, network["regulons"]);
                let target = binaryGeneMatrix[regulons[0].regulonId];

                for (let key of Object.keys(binaryGeneMatrix)) {
                    let regulon = network["regulons"].find(r => r.regulonId == key);
                    regulon.hammingDist = hammingDist(target, binaryGeneMatrix[key]);
                    regulon.levensteinDist = levensteinDist(target, binaryGeneMatrix[key]);
                }

                network.binaryGeneMatrix = binaryGeneMatrix;

                network.regulons = network.regulons.sort((a, b) => a.hammingDist - b.hammingDist);
    
                // Adding these for access purposes
                network["regulog"] = regulogs.find(r => r.regulogId == regulons[0].regulogId);
                network["regulators"] = [];
                network["genomes"] = [];
                for (let regulon of network["regulons"]) {
                    for (let regulator of regulators.filter(r => r.regulonId == regulon.regulonId)) {
                        network.regulators.push(regulator);
                    }
                    for (let genome of genomes.filter(g => g.genomeId == regulon.genomeId)) {
                        network.genomes.push(genome);
                    }
                }
                
                console.log("Attempting to render CSV records as wagon wheels...");
                res.render("wagon-wheels.pug", { network: network });
                return;
            
            // Catch an error and display it
            } catch (err) {
                console.log("Failed to parse CSV")
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write("An error occured while attempting to parse the CSV file: ");
                res.write(err.message)
                res.end();
                return;                
            }
        });
        /*instream = fs.createReadStream(file.path);
        outstream = new (require('stream'))();
        rl = readline.createInterface(instream, outstream);
        
        rl.on('line', function (line) {
            console.log(line);
        });
        
        rl.on('close', function (line) {
            console.log(line);
            console.log('done reading file.');
        });*/
      
        /*console.log('Deleting uploaded file...');
        fs.unlink(file.path, function (err) {
            if (err) throw err;
            console.log('File deleted!');
        });*/
    });
});
    
// The required fields for each of the object types
const REQUIRED_GENOME_FIELDS = [ "genomeId", "name", "rnaRegulonCount", "rnaSiteCount", "taxonomyId", "tfRegulonCount", "tfSiteCount" ]
const REQUIRED_REGULOG_FIELDS = [ "effector", "pathway", "regulationType", "regulatorFamily", "regulatorName", "regulogId", "taxonName" ]
const REQUIRED_REGULON_FIELDS = [ "effector", "genomeId", "genomeName", "pathway", "regulationType", "regulatorFamily", "regulatorName", "regulogId", "regulonId" ]
const REQUIRED_GENE_FIELDS = [ "geneFunction", "locusTag", "name", "regulonId", "vimssId" ]
const REQUIRED_REGULATOR_FIELDS = [ "locusTag", "name", "regulatorFamily", "regulonId", "vimssId" ]
const REQUIRED_SITE_FIELDS = [ "geneLocusTag", "geneVIMSSId", "position", "regulonId", "score", "sequence" ]

// Creates an object representing genomes that is consistent with retrieving
// from the (currently local) RegPrecise database
// The first row passed is assumed to be the header row, and an empty table
// will be returned if it does not contain all of the required values
function parseGenomes(table) {    
    var genomes = [];
    var requiredFields = REQUIRED_GENOME_FIELDS;
    
    // Return immediately if an empty table was passed
    if (table.length < 1) {
        console.log("parseGenomes: Was given an empty table");
        return genomes;
    }
    
    // Contains the index of each of the required fields, as the CSV could have
    // them in any order
    var columnIndexes = [];
    
    // Determine the index of each field from the first row of the parameter
    // table. If the header does not contain one of the field names, throw an
    // error
    for (var i = 0; i < requiredFields.length; i++) {
        if (table[0].indexOf(requiredFields[i]) == -1) {
            console.log("parseGenomes: The header of this table does not contain " + requiredFields[i]);
            return genomes;
        } else {
            columnIndexes[requiredFields[i]] = table[0].indexOf(requiredFields[i]);
        }
    }
    
    // Go through the rest of the rows in the parameter table and create an
    // object for each of them, adding them to the new table
    for (var i = 1; i < table.length; i++) {
        
        var currentGenome = {};
        // Go through each required field and get the value of the current row
        // for each
        for (var j = 0; j < requiredFields.length; j++) {
            currentGenome[requiredFields[j]] = table[i][columnIndexes[requiredFields[j]]];
        }
        
        genomes.push(currentGenome);
    }
    
    // Return the new completed table
    return genomes;
}

// Creates an object representing regulogs that is consistent with retrieving
// from the (currently local) RegPrecise database
// The first row passed is assumed to be the header row, and an empty table
// will be returned if it does not contain all of the required values
function parseRegulogs(table) {
    var regulogs = [];
    var requiredFields = REQUIRED_REGULOG_FIELDS;
    
    // Return immediately if an empty table was passed
    if (table.length < 1) {
        console.log("parseRegulogs: Was given an empty table");
        return regulogs;
    }
    
    // Contains the index of each of the required fields, as the CSV could have
    // them in any order
    var columnIndexes = [];
    
    // Determine the index of each field from the first row of the parameter
    // table. If the header does not contain one of the field names, throw an
    // error
    for (var i = 0; i < requiredFields.length; i++) {
        if (table[0].indexOf(requiredFields[i]) == -1) {
            console.log("parseRegulogs: The header of this table does not contain " + requiredFields[i]);
            return regulogs;
        } else {
            columnIndexes[requiredFields[i]] = table[0].indexOf(requiredFields[i]);
        }
    }
    
    // Go through the rest of the rows in the parameter table and create an
    // object for each of them, adding them to the new table
    for (var i = 1; i < table.length; i++) {
        
        var currentRegulog = {};
        // Go through each required field and get the value of the current row
        // for each
        for (var j = 0; j < requiredFields.length; j++) {
            currentRegulog[requiredFields[j]] = table[i][columnIndexes[requiredFields[j]]];
        }
        
        regulogs.push(currentRegulog);
    }
    
    // Return the new completed table
    console.log("parseRegulogs: Finished");
    return regulogs;
}

// Creates an object representing regulons that is consistent with retrieving
// from the (currently local) RegPrecise database
// The first row passed is assumed to be the header row, and an empty table
// will be returned if it does not contain all of the required values
function parseRegulons(table) {
    var regulons = [];
    var requiredFields = REQUIRED_REGULON_FIELDS;
    
    // Return immediately if an empty table was passed
    if (table.length < 1) {
        console.log("parseRegulons: Was given an empty table");
        return regulons;
    }
    
    // Contains the index of each of the required fields, as the CSV could have
    // them in any order
    var columnIndexes = [];
    
    // Determine the index of each field from the first row of the parameter
    // table. If the header does not contain one of the field names, throw an
    // error
    for (var i = 0; i < requiredFields.length; i++) {
        if (table[0].indexOf(requiredFields[i]) == -1) {
            console.log("parseRegulons: The header of this table does not contain " + requiredFields[i]);
            return regulons;
        } else {
            columnIndexes[requiredFields[i]] = table[0].indexOf(requiredFields[i]);
        }
    }
    
    // Go through the rest of the rows in the parameter table and create an
    // object for each of them, adding them to the new table
    for (var i = 1; i < table.length; i++) {
        
        var currentRegulon = {};
        // Go through each required field and get the value of the current row
        // for each
        for (var j = 0; j < requiredFields.length; j++) {
            currentRegulon[requiredFields[j]] = table[i][columnIndexes[requiredFields[j]]];
        }
        
        regulons.push(currentRegulon);
    }
    
    // Return the new completed table
    console.log("parseRegulons: Finished");    
    return regulons;
}

// Creates an object representing genes that is consistent with retrieving
// from the (currently local) RegPrecise database
// The first row passed is assumed to be the header row, and an empty table
// will be returned if it does not contain all of the required values
function parseGenes(table) {
    var genes = [];
    var requiredFields = REQUIRED_GENE_FIELDS;
    
    // Return immediately if an empty table was passed
    if (table.length < 1) {
        console.log("parseGenes: Was given an empty table");
        return genes;
    }
    
    // Contains the index of each of the required fields, as the CSV could have
    // them in any order
    var columnIndexes = [];
    
    // Determine the index of each field from the first row of the parameter
    // table. If the header does not contain one of the field names, throw an
    // error
    for (var i = 0; i < requiredFields.length; i++) {
        if (table[0].indexOf(requiredFields[i]) == -1) {
            console.log("parseGenes: The header of this table does not contain " + requiredFields[i]);
            return genes;
        } else {
            columnIndexes[requiredFields[i]] = table[0].indexOf(requiredFields[i]);
        }
    }
    
    // Check if there's a "goParentTerm" or "goTerm"; one or the other will be
    // used to give the gene's "term" if it exists
    var goParentTermIndex = table[0].indexOf("goParentTerm");
    var goTermIndex = table[0].indexOf("goTerm");
    
    // Go through the rest of the rows in the parameter table and create an
    // object for each of them, adding them to the new table
    for (var i = 1; i < table.length; i++) {
        
        var currentGene = {};
        // Go through each required field and get the value of the current row
        // for each
        for (var j = 0; j < requiredFields.length; j++) {
            
            // "geneFunction" is a special case - this TRNDiff expects "function"
            // hence we have to make sure the field name is the latter
            if (requiredFields[j] == "geneFunction") {
                currentGene["function"] = table[i][columnIndexes[requiredFields[j]]];
            } else {
                currentGene[requiredFields[j]] = table[i][columnIndexes[requiredFields[j]]];
            }
        }
        
        // Add existing GO terms if present
        if (goParentTermIndex != -1 && table[i][goParentTermIndex] != "") {
            currentGene.term = table[i][goParentTermIndex];
        } else if (goTermIndex != -1 && table[i][goTermIndex] != "") {
            currentGene.term = table[i][goTermIndex];            
        }
                
        genes.push(currentGene);
    }
    
    // Return the new completed table
    console.log("parseGenes: Finished");    
    return genes;
}

// Creates an object representing regulators that is consistent with retrieving
// from the (currently local) RegPrecise database
// The first row passed is assumed to be the header row, and an empty table
// will be returned if it does not contain all of the required values
function parseRegulators(table) {
    var regulators = [];
    var requiredFields = REQUIRED_REGULATOR_FIELDS;
    
    // Return immediately if an empty table was passed
    if (table.length < 1) {
        console.log("parseRegulators: Was given an empty table");
        return regulators;
    }
    
    // Contains the index of each of the required fields, as the CSV could have
    // them in any order
    var columnIndexes = [];
    
    // Determine the index of each field from the first row of the parameter
    // table. If the header does not contain one of the field names, throw an
    // error
    for (var i = 0; i < requiredFields.length; i++) {
        if (table[0].indexOf(requiredFields[i]) == -1) {
            console.log("parseRegulators: The header of this table does not contain " + requiredFields[i]);
            return regulators;
        } else {
            columnIndexes[requiredFields[i]] = table[0].indexOf(requiredFields[i]);
        }
    }
    
    // Go through the rest of the rows in the parameter table and create an
    // object for each of them, adding them to the new table
    for (var i = 1; i < table.length; i++) {
        
        var currentRegulator = {};
        // Go through each required field and get the value of the current row
        // for each
        for (var j = 0; j < requiredFields.length; j++) {
            currentRegulator[requiredFields[j]] = table[i][columnIndexes[requiredFields[j]]];
        }
        
        regulators.push(currentRegulator);
    }
    
    // Return the new completed table
    console.log("parseRegulators: Finished");    
    return regulators;
}

// Creates an object representing sites that is consistent with retrieving
// from the (currently local) RegPrecise database
// The first row passed is assumed to be the header row, and an empty table
// will be returned if it does not contain all of the required values
function parseSites(table) {
    var sites = [];
    var requiredFields = REQUIRED_SITE_FIELDS;
    
    // Return immediately if an empty table was passed
    if (table.length < 1) {
        console.log("parseSites: Was given an empty table");
        return sites;
    }
    
    // Contains the index of each of the required fields, as the CSV could have
    // them in any order
    var columnIndexes = {};
    
    // Determine the index of each field from the first row of the parameter
    // table. If the header does not contain one of the field names, throw an
    // error
    for (var i = 0; i < requiredFields.length; i++) {
        if (table[0].indexOf(requiredFields[i]) == -1) {
            console.log("parseSites: The header of this table does not contain " + requiredFields[i]);
            return sites;
        } else {
            columnIndexes[requiredFields[i]] = table[0].indexOf(requiredFields[i]);
        }
    }
    
    // Go through the rest of the rows in the parameter table and create an
    // object for each of them, adding them to the new table
    for (var i = 1; i < table.length; i++) {
        
        var currentSite = {};
        // Go through each required field and get the value of the current row
        // for each
        for (var j = 0; j < requiredFields.length; j++) {
            currentSite[requiredFields[j]] = table[i][columnIndexes[requiredFields[j]]];
        }
        
        sites.push(currentSite);
    }
    
    // Return the new completed table
    console.log("parseSites: Finished");
    return sites;
}

// copied from regprecise-local
function generateBinaryGeneMatrix(geneNames, regulons) {
    let matrix = {};

    for (let regulon of regulons) {
        let vector = "";
        for (let geneName of geneNames) {
            vector += regulon.targetGenes.find(g => g.name == geneName) ? "1" : "0";
        }
        matrix[regulon.regulonId] = vector;
    }

    return matrix;
}

// copied from regprecise-local
function hammingDist(a, b) {
    let dist = 0;

    for (let i = 0; i < a.length; i++) {
        if (a[i] != b[i]) dist++;
    }

    return dist;
}

// copied from regprecise-local
function levensteinDist(a, b) {
    let m = [], i, j, min = Math.min;

    if (!(a && b)) return (b || a).length;

    for (i = 0; i <= b.length; m[i] = [i++]);
    for (j = 0; j <= a.length; m[0][j] = j++);

    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            m[i][j] = b.charAt(i - 1) == a.charAt(j - 1)
                ? m[i - 1][j - 1]
                : m[i][j] = min(
                    m[i - 1][j - 1] + 1, 
                    min(m[i][j - 1] + 1, m[i - 1 ][j]))
        }
    }

    return m[b.length][a.length];
}

// copied from regprecise.js
const regprecise = require("../libs/regprecise-local.js");

router.post("/kmeanscluster", (req, res) => {
    regprecise.kMeansCluster(req.body.data, req.body.k, (err, result) => {
        if (err) { console.error(err); return res.status(500).end(); }
        res.json(result);
    })
})

module.exports = router;