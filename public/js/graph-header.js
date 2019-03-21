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

            if (currentClusters !== - 1) {
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

            if (currentClusters !== - 1) {
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

    // Show the popup for the query highlight button when it's clicked
    $("#search-query_item").click((event) => {
        event.stopPropagation();
        document.getElementById('search-query_popup').style.display = '';
    });
    
    // Don't propogate events when clicking in a popup
    $.each($(".ChooserPopup"), (i, popup) => {
        $(popup).click((event) => { event.stopPropagation(); } );
    });

    // If the user clicks anywhere (except an element with stop propagation),
    // clear any popups
    document.onclick = function() {
        $.each($(".ChooserPopup"), (i, popup) => {
            $(popup).css('display', 'none');
        });
    }
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
        let genomeId = genome.genomeId !== undefined ? genome.genomeId : '';
        let name = genome.name !== undefined ? genome.name : '';
        let rnaRegulonCount = genome.rnaRegulonCount !== undefined ? genome.rnaRegulonCount : '';
        let rnaSiteCount = genome.rnaSiteCount !== undefined ? genome.rnaSiteCount : '';
        let taxonomyId = genome.taxonomyId !== undefined ? genome.taxonomyId : '';
        let tfRegulonCount = genome.tfRegulonCount !== undefined ? genome.tfRegulonCount : '';
        let tfSiteCount = genome.tfSiteCount !== undefined ? genome.tfSiteCount : '';

        // Add them to the string
        CSV += genomeId + ',"' + name + '",' + rnaRegulonCount + ',' + rnaSiteCount + ',' + taxonomyId + ',' + tfRegulonCount + ',' + tfSiteCount + '\n';
    }

    // Regulogs
    console.log('Adding regulog data...');
    CSV += '\n\nRegulogs\n\neffector,pathway,regulationType,regulatorFamily,regulatorName,regulogId,taxonName,numGroups\n';

    let regulog = regulogNetwork.regulog;

    // Get all the attributes, or an empty string if they are not present
    let effector = regulog.effector !== undefined ? regulog.effector : '';
    let pathway = regulog.pathway !== undefined ? regulog.pathway : '';
    let regulationType = regulog.regulationType !== undefined ? regulog.regulationType : '';
    let regulatorFamily = regulog.regulatorFamily !== undefined ? regulog.regulatorFamily : '';
    let regulatorName = regulog.regulatorName !== undefined ? regulog.regulatorName : '';
    let regulogId = regulog.regulogId !== undefined ? regulog.regulogId : '';
    let taxonName = regulog.taxonName !== undefined ? regulog.taxonName : '';

    // Add them to the string
    CSV += '"' + effector + '","' + pathway + '","' + regulationType + '","' + regulatorFamily + '","' + regulatorName + '",' + regulogId + ',"' + taxonName + '"';

    // If there is more than one group, add the number of groups
    if (currentClusters !== -1 && currentClusters.length > 1) {
        CSV += ',' + currentClusters.length + '\n';
    // Otherwise set the number of groups to one
    } else {
        CSV += ',1\n';
    }

    // Regulons
    console.log('Adding regulon data...');
    CSV += '\n\nRegulons\n\neffector,genomeId,genomeName,pathway,regulationType,regulatorFamily,regulatorName,regulogId,regulonId,selected,order,groupNumber\n';

    // Since genes are added to the regulon objects, make a list of them here
    let genes = [];

    //for (let regulon of regulogNetwork.regulons) {
    for (var i = 0; i < regulogNetwork.regulons.length; i++) {
        regulon = regulogNetwork.regulons[i];

        // Get all the attributes, or an empty string if they are not present
        let effector = regulon.effector !== undefined ? regulon.effector : '';
        let genomeId = regulon.genomeId !== undefined ? regulon.genomeId : '';
        let genomeName = regulon.genomeName !== undefined ? regulon.genomeName : '';
        let pathway = regulon.pathway !== undefined ? regulon.pathway : '';
        let regulationType = regulon.regulationType !== undefined ? regulon.regulationType : '';
        let regulatorFamily = regulon.regulatorFamily !== undefined ? regulon.regulatorFamily : '';
        let regulatorName = regulon.regulatorName !== undefined ? regulon.regulatorName : '';
        let regulogId = regulon.regulogId !== undefined ? regulon.regulogId : '';
        let regulonId = regulon.regulonId !== undefined ? regulon.regulonId : '';
        let selected = selectedRegulons.indexOf(regulonId) !== -1 ? 'true' : 'false';

        // Add them to the string
        CSV += '"' + effector + '",' + genomeId + ',"' + genomeName + '","' + pathway + '","' + regulationType + '","' + regulatorFamily + '","' + regulatorName + '",' + regulogId + ',' + regulonId + ',' + selected + '';

        // If there is more than one group, add the group they are in as well
        // as the correct ordering for that group
        if (currentClusters !== -1 && currentClusters.length > 1) {
            for (var j = 0; j < currentClusters.length; j++) {
                if (currentClusters[j].indexOf(regulon.regulonId) !== -1) {
                    CSV += ',' + currentClusters[j].indexOf(regulonId) + ',' + (j+1) + '\n';
                    break;
                }
            }
        // Otherwise just get the order and set the groupNumber as '1'
        } else {
            CSV += ',' + i + ',1\n';
        }

        // Store all the target genes for this regulon
        for (let gene of regulon.targetGenes) {
            genes.push(gene);
        }
    }

    // Genes
    console.log('Adding gene data...');
    CSV += '\n\nGenes\n\ngeneFunction,locusTag,name,regulonId,vimssId,goParentTerm,selected\n'

    // Since sites are added to the gene objects, make a list of them here
    let sites = [];

    for (let gene of genes) {

        // Get all the attributes, or an empty string if they are not present
        let geneFunction = gene.function !== undefined ? gene.function : '';
        let locusTag = gene.locusTag !== undefined ? gene.locusTag : '';
        let name = gene.name !== undefined ? gene.name : '';
        let regulonId = gene.regulonId !== undefined ? gene.regulonId : '';
        let vimssId = gene.vimssId !== undefined ? gene.vimssId : '';
        let goParentTerm = gene.term !== undefined ? gene.term : '';
        let selected = selectedGenes.indexOf(name) !== -1 ? 'true' : 'false';

        // Add them to the string
        CSV += '"' + geneFunction + '","' + locusTag + '","' + name + '",' + regulonId + ',' + vimssId + ',"' + goParentTerm + '",' + selected + '\n';

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
        let locusTag = regulator.locusTag !== undefined ? regulator.locusTag : '';
        let name = regulator.name !== undefined ? regulator.name : '';
        let regulatorFamily = regulator.regulatorFamily !== undefined ? regulator.regulatorFamily : '';
        let regulonId = regulator.regulonId !== undefined ? regulator.regulonId : '';
        let vimssId = regulator.vimssId !== undefined ? regulator.vimssId : '';

        // Add them to the string
        CSV += '"' + locusTag + '","' + name + '","' + regulatorFamily + '",' + regulonId + ',' + vimssId + '\n';
    }

    // Sites
    console.log('Adding site data...');
    CSV += '\n\nSites\n\ngeneLocusTag,geneVIMSSId,position,regulonId,score,sequence\n'

    for (let site of sites) {

        // Get all the attributes, or an empty string if they are not present
        let geneLocusTag = site.geneLocusTag !== undefined ? site.geneLocusTag : '';
        let geneVIMSSId = site.geneVIMSSId !== undefined ? site.geneVIMSSId : '';
        let position = site.position !== undefined ? site.position : '';
        let regulonId = site.regulonId !== undefined ? site.regulonId : '';
        let score = site.score !== undefined ? site.score : '';
        let sequence = site.sequence !== undefined ? site.sequence : '';

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