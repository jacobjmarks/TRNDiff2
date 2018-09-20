$(document).ready(() => {
    $("#sort-regulons-by.dropdown").dropdown({
        action: (text, value) => {
            regulonNetworks.sort((a, b) => {
                switch(value) {
                    case "distance":
                        return a.distance - b.distance;
                    case "gene-count":
                        return b.targetGenes.length - a.targetGenes.length;
                    case "genome-name":
                        return a.genomeName.localeCompare(b.genomeName);
                    default:
                        return 0;
                }
            })

            drawWagonWheels();
        }
    });

    $("#sort-genes-by.dropdown").dropdown({

    });
})