$(document).ready(() => {
    $("#sort-regulons-by.dropdown").dropdown({
        onChange: (value) => {
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

            drawWagonWheels();
        }
    });

    $("#sort-genes-by.dropdown").dropdown({

    });
})