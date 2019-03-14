$(document).ready(() => {
    $("#sort-regulons-by.dropdown").dropdown({
        onChange: (value) => {
            /*if (value.includes("kmeans")) {
                let k = value[value.length - 1];
                $.ajax({
                    method: "POST",
                    url: "kmeanscluster",
                    dataType: "json",
                    data: {
                        data: regulogNetwork.binaryGeneMatrix,
                        k: k
                    },
                    success: (data) => {
                        drawClusteredWagonWheels(data);
                    },
                    error: (xhr, status, error) => {
                        var errorMessage = xhr.status + ': ' + xhr.statusText
                        alert("An error has occurred: " + errorMessage);
                    }
                })
                return;
            }*/
            regulogNetwork.regulons.sort((a, b) => {
                switch(value) {
                    case "hamming-distance":
                        return a.hammingDist - b.hammingDist;
                    case "levenstein-distance":
                        return a.levensteinDist - b.levensteinDist;
                    case "gene-count":
                        return b.targetGenes.length - a.targetGenes.length;
                    case "genome-name":
                        return a.genomeName.localeCompare(b.genomeName);
                    default:
                        return 0;
                }
            })

            if (currentClusters != - 1) {
                sortClusteredRegulons(currentClusters);
                drawClusteredWagonWheels(currentClusters);
            } else {                
                drawWagonWheels();
            }
        }
    });

    $("#sort-genes-by.dropdown").dropdown({
        onChange: (value) => {
            geneSortFunc = (() => {
                switch(value) {
                    case "name":
                        return (a, b) => a.name.localeCompare(b.name);
                    case "function":
                        return (a, b) => a.function.localeCompare(b.function);
                    case "go-term":
                        return (a, b) => a.term.localeCompare(b.term);
                    default:
                        return () => true;
                }
            })()

            if (currentClusters != - 1) {
                drawClusteredWagonWheels(currentClusters)
            } else {
                drawWagonWheels()
            }
        }
    });
    
    $("#cluster-regulons-by.dropdown").dropdown({
        onChange: (value) => {
            if (value.includes("kmeans")) {
                let k = value[value.length - 1];
                $.ajax({
                    method: "POST",
                    url: "kmeanscluster",
                    dataType: "json",
                    data: {
                        data: regulogNetwork.binaryGeneMatrix,
                        k: k
                    },
                    success: (data) => {
                        sortClusteredRegulons(data);
                        drawClusteredWagonWheels(data);
                    },
                    error: (xhr, status, error) => {
                        var errorMessage = xhr.status + ': ' + xhr.statusText
                        alert("An error has occurred: " + errorMessage);
                    }
                })
                return;
            }
            
            drawWagonWheels()
        }
    });
})

/**
 * Sorts the regulons in clusters, based on the ordering of the original regulon
 * data in regulogNetwork (which is ordered from selecting a sort option here)
 */
function sortClusteredRegulons(data) {
    let regulonIds = [];
    for (var i = 0; i < regulogNetwork.regulons.length; i++) {
        regulonIds.push(regulogNetwork.regulons[i].regulonId);
    }
    for (var i = 0; i < data.length; i++) {
        data[i].sort((a, b) => {
            return regulonIds.indexOf(a) - regulonIds.indexOf(b);
        })
    }
}

/**
 * Generates a string in older TRNDiff CSV format which can be exported
 */
function generateCSV() {
    console.log('Generating CSV...');
    let CSV = '';
    
    // Genomes
    console.log('Adding genome data...');
    CSV += 'Genomes\n\ngenomeId,name,rnaRegulonCount,rnaSiteCount,taxonomyId,tfRegulonCount,tfSiteCount\n';
    
    for (let genome of regulogNetwork.genomes) {
        
        // Get all the attributes, or an empty string if they are not present
        let genomeId = genome.genomeId != null ? genome.genomeId : '';
        let name = genome.name != null ? genome.name : '';
        let rnaRegulonCount = genome.rnaRegulonCount != null ? genome.rnaRegulonCount : '';
        let rnaSiteCount = genome.rnaSiteCount != null ? genome.rnaSiteCount : '';
        let taxonomyId = genome.taxonomyId != null ? genome.taxonomyId : '';
        let tfRegulonCount = genome.tfRegulonCount != null ? genome.tfRegulonCount : '';
        let tfSiteCount = genome.tfSiteCount != null ? genome.tfSiteCount : '';
        
        // Add them to the string
        CSV += genomeId + ',"' + name + '",' + rnaRegulonCount + ',' + rnaSiteCount + ',' + taxonomyId + ',' + tfRegulonCount + ',' + tfSiteCount + '\n';
    }
    
    // Regulogs
    console.log('Adding regulog data...');
    CSV += '\n\nRegulogs\n\neffector,pathway,regulationType,regulatorFamily,regulatorName,regulogId,taxonName\n';
    
    let regulog = regulogNetwork.regulog;
        
    // Get all the attributes, or an empty string if they are not present
    let effector = regulog.effector != null ? regulog.effector : '';
    let pathway = regulog.pathway != null ? regulog.pathway : '';
    let regulationType = regulog.regulationType != null ? regulog.regulationType : '';
    let regulatorFamily = regulog.regulatorFamily != null ? regulog.regulatorFamily : '';
    let regulatorName = regulog.regulatorName != null ? regulog.regulatorName : '';
    let regulogId = regulog.regulogId != null ? regulog.regulogId : '';
    let taxonName = regulog.taxonName != null ? regulog.taxonName : '';
    
    // Add them to the string
    CSV += '"' + effector + '","' + pathway + '","' + regulationType + '","' + regulatorFamily + '","' + regulatorName + '",' + regulogId + ',"' + taxonName + '"\n';
    
    // Regulons
    console.log('Adding regulon data...');
    CSV += '\n\nRegulons\n\neffector,genomeId,genomeName,pathway,regulationType,regulatorFamily,regulatorName,regulogId,regulonId\n';
    
    // Since genes are added to the regulon objects, make a list of them here
    let genes = [];
    
    for (let regulon of regulogNetwork.regulons) {
        
        // Get all the attributes, or an empty string if they are not present
        let effector = regulon.effector != null ? regulon.effector : '';
        let genomeId = regulon.genomeId != null ? regulon.genomeId : '';
        let genomeName = regulon.genomeName != null ? regulon.genomeName : '';
        let pathway = regulon.pathway != null ? regulon.pathway : '';
        let regulationType = regulon.regulationType != null ? regulon.regulationType : '';
        let regulatorFamily = regulon.regulatorFamily != null ? regulon.regulatorFamily : '';
        let regulatorName = regulon.regulatorName != null ? regulon.regulatorName : '';
        let regulogId = regulon.regulogId != null ? regulon.regulogId : '';
        let regulonId = regulon.regulonId != null ? regulon.regulonId : '';
        
        // Add them to the string
        CSV += '"' + effector + '",' + genomeId + ',"' + genomeName + '","' + pathway + '","' + regulationType + '","' + regulatorFamily + '","' + regulatorName + '",' + regulogId + ',' + regulonId + '\n';
        
        // Store all the target genes for this regulon
        for (let gene of regulon.targetGenes) {
            genes.push(gene);
        }
    }
    
    // Genes
    console.log('Adding gene data...');
    CSV += '\n\nGenes\n\ngeneFunction,locusTag,name,regulonId,vimssId,goParentTerm\n'
    
    // Since sites are added to the gene objects, make a list of them here
    let sites = [];
    
    for (let gene of genes) {
        
        // Get all the attributes, or an empty string if they are not present
        let geneFunction = gene.function != null ? gene.function : '';
        let locusTag = gene.locusTag != null ? gene.locusTag : '';
        let name = gene.name != null ? gene.name : '';
        let regulonId = gene.regulonId != null ? gene.regulonId : '';
        let vimssId = gene.vimssId != null ? gene.vimssId : '';
        let goParentTerm = gene.term != null ? gene.term : '';
        
        // Add them to the string
        CSV += '"' + geneFunction + '","' + locusTag + '","' + name + '",' + regulonId + ',' + vimssId + ',"' + goParentTerm + '"\n';
        
        // Store all the sites for this gene
        for (let site of gene.sites) {
            sites.push(site);
        }
    }
    
    // Regulators
    console.log('Adding regulator data...');
    CSV += '\n\nRegulators\n\nlocusTag,name,regulatorFamily,regulonId,vimssId\n'
    
    for (let regulator of regulogNetwork.regulators) {
        
        // Get all the attributes, or an empty string if they are not present
        let locusTag = regulator.locusTag != null ? regulator.locusTag : '';
        let name = regulator.name != null ? regulator.name : '';
        let regulatorFamily = regulator.regulatorFamily != null ? regulator.regulatorFamily : '';
        let regulonId = regulator.regulonId != null ? regulator.regulonId : '';
        let vimssId = regulator.vimssId != null ? regulator.vimssId : '';
        
        // Add them to the string
        CSV += '"' + locusTag + '","' + name + '","' + regulatorFamily + '",' + regulonId + ',' + vimssId + '\n';
    }
    
    // Sites
    console.log('Adding site data...');
    CSV += '\n\nSites\n\ngeneLocusTag,geneVIMSSId,position,regulonId,score,sequence\n'
    
    for (let site of sites) {
        
        // Get all the attributes, or an empty string if they are not present
        let geneLocusTag = site.geneLocusTag != null ? site.geneLocusTag : '';
        let geneVIMSSId = site.geneVIMSSId != null ? site.geneVIMSSId : '';
        let position = site.position != null ? site.position : '';
        let regulonId = site.regulonId != null ? site.regulonId : '';
        let score = site.score != null ? site.score : '';
        let sequence = site.sequence != null ? site.sequence : '';
        
        // Add them to the string
        CSV += '"' + geneLocusTag + '",' + geneVIMSSId + ',' + position + ',' + regulonId + ',' + score + ',"' + sequence + '"\n';
    }
    
    console.log('Done');
    download(CSV, 'regulog' + regulogId + '.csv', 'text/csv');
}

// https://stackoverflow.com/questions/13405129/javascript-create-and-save-file
// Function to download data to a file
function download(data, filename, type) {
    var file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
                url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 0); 
    }
}