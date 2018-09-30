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

            drawWagonWheels();
        }
    });
})