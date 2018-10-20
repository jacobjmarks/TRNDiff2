let columns = 4;

let geneSortFunc = (a, b) => a.name.localeCompare(b.name);

const goTermColors = {
    "catalytic activity":               "#8dd3c7",
    "binding":                          "#bebada",
    "transporter activity":             "#fb8072",
    "molecular function regulator":     "#80b1d3",
    "transcription regulator activity": "#fdb462",
    "molecular carrier activity":       "#b3de69",
    "molecular transducer activity":    "#fccde5",
    "cargo receptor activity":          "#d9d9d9",
    "translation regulator activity":   "#bc80bd",
    "protein tag":                      "#ccebc5",
    "antioxidant activity":             "#a6cee3",
    "structural molecule activity":     "#1f78b4",
    "molecular_function":               "#b2df8a",
    "hijacked molecular function":      "#33a02c"
};

$(document).ready(() => {
    $("body").append(tooltip = $("<tooltip>")
        .addClass("ui segment")
        .css("position", "absolute")
        .css("z-index", 10)
        .css("visibility", "hidden")
        .css("padding", "10px")
        .css("background-color", "rgba(255,255,255,0.75)"))

        drawWagonWheels();

        $(window).resize(() => {
            if ($("#graph #body").html()) drawWagonWheels()
        })
        
        $("#btn-zoom-out").click(() => {
            columns++;
            drawWagonWheels()
        })
        
        $("#btn-zoom-in").click(() => {
            if (columns > 1) columns--;
            drawWagonWheels()
        })

        $("#btn-compare-and").click(() => { compareSelected("AND") })
        $("#btn-compare-or").click(() => { compareSelected("OR") })
        $("#btn-compare-xor").click(() => { compareSelected("XOR") })
})

function toRadians(degrees) {
    return degrees / 180 * Math.PI;
}

function svgElem(tag) {
    return document.createElementNS("http://www.w3.org/2000/svg", tag);
}

function drawWagonWheels() {
    $("#graph").show();
    svgDivMargin = 14;
    svgDivSize = ($("#graph").width() - (svgDivMargin * columns)) / columns;
    svgSize = svgDivSize;

    regulons = regulogNetwork.regulons;

    uniqueGenes = regulons
                    .map(r => r.targetGenes)
                    .reduce((a, b) => a.concat(b), [])
                    .reduce((a, b) => {
                        if (!a.find(g => g.name == b.name)) {
                            a.push(b);
                        }
                        return a;
                    }, [])
                    .sort(geneSortFunc)

    if (!window.uniqueGenesByName) {
        uniqueGenesByName = [...uniqueGenes].sort((a, b) => a.name.localeCompare(b.name));
    }

    spokeLength = svgSize * 0.75;
    spokeAngle = 360 / uniqueGenes.length;

    origin = {
        x: svgSize / 2,
        y: svgSize / 2
    }

    geneNodeRadius = Math.min(spokeLength/2 * toRadians(spokeAngle) / 2, 10);
    geneNodePositions = (() => {
        let positions = {};
        uniqueGenes.map(g => g.name).forEach((name, i) => {
            let angle = toRadians((270 + spokeAngle * i) % 360);
            positions[name] = {
                x: svgSize / 2 + Math.cos(angle) * spokeLength/2,
                y: svgSize / 2 + Math.sin(angle) * spokeLength/2
            }
        })
        return positions;
    })();

    let graph = $("#graph #body");
    graph.empty();

    for (let regulon of regulons) {
        if (!Object.keys(regulon).includes("selectable")) regulon.selectable = true;
        drawWagonWheel(regulon, graph);
    }

    // Redraw if available width has changed after drawing
    // (usually due to scrollbar popin)
    if ($("#graph").width() < (svgDivSize + svgDivMargin) * columns) {
        drawWagonWheels();
    }
}

/**
 * Draw and append a single wagonwheel of the provided regulon to the given HTML
 * element.
 * @param {JSON} regulon Regulon for which to graph
 * @param {Element} div HTML element to append wagonwheel
 */
function drawWagonWheel(regulon, div) {
    let svgDiv = $("<div>")
        .addClass("ui card")
        .addClass("wagonwheel")
        .width(svgDivSize)
        .data("regulon-data", regulon)

    if (regulon.selectable) {
        svgDiv
            .on("mouseover", function() { $(this).css("cursor", "pointer"); })
            .on("mouseout", function() { $(this).css("cursor", "inherit"); })
            .click(function() {
                let div = $(this);
                if (!div.hasClass("active")) {
                    div.addClass("active");
                    div.append(
                        $("<div>").addClass("ui right corner green label").append(
                            $("<i>").addClass("check icon")
                        )
                    )
                } else {
                    div.removeClass("active");
                    div.find(".label").remove();
                }
            })
    }

    if (regulon.regulonId == regulogNetwork["selected-regulon"]) {
        svgDiv.css("border", "1px solid blue");
    }

    let svg = $(svgElem("svg"))
        .attr({
            "width": svgSize,
            "height": svgSize
        })
    svgDiv.append(svg);

    let svgFooter = $("<div>")
            .addClass("ui centered small header")
            .text(regulon.genomeName)
    svgDiv.append(svgFooter);

    for (let gene of regulon.targetGenes) {
        let to = geneNodePositions[gene.name];

        let color = goTermColors[gene.term];

        updateGoTermLegend(gene.term);

        let spoke = $(svgElem("line"))
            .addClass(`gene-spoke gene-${gene.name}`)
            .attr({
                "x1": origin.x,
                "y1": origin.y,
                "x2": to.x,
                "y2": to.y,
                "stroke-width": 2,
                "stroke": color
            })
        svg.append(spoke);
        
        if (!gene.sites.length) spoke.css("stroke-dasharray", "5, 5").css("opacity", 0.5);

        function highlight(color) {
            $(`svg circle.gene-node.gene-${gene.name}`).attr("fill", color);
            $(`svg line.gene-spoke.gene-${gene.name}`).css("stroke", color);
        }

        let node = $(svgElem("circle"))
            .addClass(`gene-node gene-${gene.name}`)
            .data("gene-data", gene)
            .attr({
                "cx": to.x,
                "cy": to.y,
                "r": geneNodeRadius,
                "fill": color
            })
            .on("mouseover", () => {
                highlight("blue");

                tooltip.empty();
                tooltip.append($("<table>")
                    .append($("<tr>")
                        .append($("<td>").text("Locus Tag"))
                        .append($("<td>").text(gene.locusTag || "n/a")))
                    .append($("<tr>")
                        .append($("<td>").text("Gene Name"))
                        .append($("<td>").text(gene.name)))
                    .append($("<tr>")
                        .append($("<td>").text("Function"))
                        .append($("<td>").text(gene.function || "n/a")))
                    .append($("<tr>")
                        .append($("<td>").text("Site/s"))
                        .append($("<td>").text(gene.sites.map(s => s.sequence).join(", ") || "n/a")))
                    .append(!gene.sites.length ? null : $("<tr>")
                        .append($("<td>").text("Site Position"))
                        .append($("<td>").text(gene.sites.map(s => s.position).join(", ") || "n/a")))
                    .append(!gene.sites.length ? null : $("<tr>")
                        .append($("<td>").text("Site Score"))
                        .append($("<td>").text(gene.sites.map(s => s.score).join(", ") || "n/a")))
                )
                tooltip.css("visibility", "visible")
            })
            .on("mousemove", () => { tooltip.css("top",(event.pageY-10)+"px").css("left",(event.pageX+10)+"px") })
            .on("mouseout", () => {
                highlight(color);
                tooltip.css("visibility", "hidden");
            })
        svg.append(node);
    }

    let centroidRadius = Math.min(svgSize * 0.05, 10);

    let centroidMargin = $(svgElem("circle"))
        .addClass("centroid-margin")
        .attr({
            "cx": svgSize / 2,
            "cy": svgSize / 2,
            "r": centroidRadius * 1.5,
            "fill": "white"
        })
    svg.append(centroidMargin);
    
    let centroid = $(svgElem("circle"))
        .addClass("centroid")
        .attr({
            "cx": svgSize / 2,
            "cy": svgSize / 2,
            "r": centroidRadius
        })
        .on("mouseover", () => {
            tooltip.empty();
            tooltip
                .append($("<table>")
                    .append($("<tr>")
                        .append($("<td>").text("Locus Tag"))
                        .append($("<td>").text(regulon.regulator && regulon.regulator.locusTag || "n/a")))
                    .append($("<tr>")
                        .append($("<td>").text("Regulator Family"))
                        .append($("<td>").text(regulon.regulatorFamily)))
                    .append($("<tr>")
                        .append($("<td>").text("Regulator Name"))
                        .append($("<td>").text(regulon.regulatorName)))
                    .append($("<tr>")
                        .append($("<td>").text("Regulation Type"))
                        .append($("<td>").text(regulon.regulationType)))
                    .append($("<tr>")
                        .append($("<td>").text("Function"))
                        .append($("<td>").text(regulon.regulator && regulon.regulator.function || "n/a")))
                    .append($("<tr>")
                        .append($("<td>").text("Target Genes"))
                        .append($("<td>").text(regulon.targetGenes.length)))
                )
                .css("visibility", "visible")
        })
        .on("mousemove", () => { tooltip.css("top",(event.pageY-10)+"px").css("left",(event.pageX+10)+"px") })
        .on("mouseout", () => { tooltip.css("visibility", "hidden") })
    svg.append(centroid);

    div.append(svgDiv);

    $(".gene-node, .centroid, .centroid-margin").hover(function(e) { e.stopPropagation() });
}

/**
 * Compare all selected regulon wagonwheels with the given binary method.
 * @param {string} method Binary comparison method (AND/OR/XOR)
 */
function compareSelected(method) {
    if ($(".wagonwheel.active").toArray().length < 2) return;
    let regulons = $(".wagonwheel.active").toArray().map((ww) => $(ww).data("regulon-data"));

    let binaryGeneMatrix = regulons.map((r) => r.regulonId).map((rId) => regulogNetwork.binaryGeneMatrix[rId]);

    let resultingMatrix = '0'.repeat(uniqueGenes.length).split('');

    for (let i = 0; i < resultingMatrix.length; i++) {
        let set = false;
        for (let j = 1; j < binaryGeneMatrix.length; j++) {
            switch (method) {
                case "AND":
                    if (binaryGeneMatrix[0][i] == '1' && binaryGeneMatrix[j][i] == '1') {
                        resultingMatrix[i] = '1';
                    } else {
                        resultingMatrix[i] = '0';
                        set = true;
                    }
                    break;
                case "OR":
                    if (binaryGeneMatrix[0][i] == '1' || binaryGeneMatrix[j][i] == '1') {
                        resultingMatrix[i] = '1';
                        set = true;
                    }
                    break;
                case "XOR":
                    if (binaryGeneMatrix[0][i] != binaryGeneMatrix[j][i]) {
                        resultingMatrix[i] = '1';
                        set = true;
                    }
                    break;
                default:
                    break;
            }
            if (set) break;
        }
    }

    let result = {
        genomeName: regulons.map(r => r.genomeName).join(' [' + method + '] '),
        regulatorFamily: regulons[0].regulatorFamily,
        regulatorName: regulons[0].regulatorName,
        regulatorType: regulons[0].regulationType,
        selectable: false,
        targetGenes: []
    }

    for (let i = 0; i < resultingMatrix.length; i++) {
        if (resultingMatrix[i] == '1') result.targetGenes.push(uniqueGenesByName[i]);
    }

    regulogNetwork.regulons.push(result);

    drawWagonWheel(result, $("#graph #body"));
}

/**
 * Adds an entry for the given term in the GO
 * Term color legend if it does not yet exist.
 * @param {string} term Term to add
 */
function updateGoTermLegend(term) {
    let legend = $("#goterm-legend");
    if (legend.has(`[id="${term}"]`).length < 1) {
        let xBtn = $("<i>").addClass("delete icon")
            .click((e) => {
                e.stopPropagation();
                highlightTerm(term, 1);
                xBtn.detach();
            })
        
        let label = $("<a>").addClass("ui large label").attr("id", term)
            .append(
                $("<i>").addClass("square icon")
                    .css("color", goTermColors[term])
            )
            .append(term)
            .click(() => {
                legend.find(".delete.icon").click();
                highlightTerm(term, "0.2");
                label.append(xBtn);
            })

        legend.append(label);
    }
}

/**
 * Highlight all nodes that belong to the given GO term. Works by setting the
 * opacity of all ~other~ nodes to the provided value.
 * @param {string} term Term to highlight
 * @param {Number} opacity Opacity of other nodes
 */
function highlightTerm(term, opacity) {
    $.each($(".gene-node"), (i, node) => {
        let gene = $(node).data("gene-data");
        if (gene.term != term) {
            $(`svg circle.gene-node.gene-${gene.name}`).css("opacity", opacity);
            $(`svg line.gene-spoke.gene-${gene.name}`).css("opacity", opacity);
        };
    })
}