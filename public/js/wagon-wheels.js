let columns = 4;

$(document).ready(() => {
    $("body").append(tooltip = $("<tooltip>")
        .addClass("ui segment")
        .css("position", "absolute")
        .css("z-index", 10)
        .css("visibility", "hidden")
        .css("padding", "10px")
        .css("background-color", "rgba(255,255,255,0.75)"))
})

function viewWagonWheels(regulogId) {
    $("#select-data .table").empty();
    $("#select-data .table").hide();

    isLoading(true);
    $.ajax({
        method: "GET",
        url: `/regprecise/regulognetwork/${regulogId}`,
        success: (regulonNetworks) => {
            drawWagonWheels(regulonNetworks);

            $(window).resize(() => { if ($("#graph #body").html()) drawWagonWheels(regulonNetworks) })
            $("#btn-zoom-out").unbind().click(() => { columns++; drawWagonWheels(regulonNetworks) })
            $("#btn-zoom-in").unbind().click(() => { if (columns > 1) { columns--; drawWagonWheels(regulonNetworks) } })
        },
        error: () => {
            alert("Error fetching graph network");
        },
        complete: () => {
            isLoading(false);
        }
    })
}

function svgElem(tag) {
    return document.createElementNS("http://www.w3.org/2000/svg", tag);
}

function drawWagonWheels(regulonNetworks) {
    $("#graph").show();
    const svgDivMargin = 14;
    let svgDivSize = ($("#graph").width() - (svgDivMargin * columns)) / columns;
    let svgSize = svgDivSize;

    // regulonNetworks = regulonNetworks.sort((a, b) => b.targetGenes.length - a.targetGenes.length);

    let spokeLength = svgSize * 0.75;
    let spokeAngle = 360 / regulonNetworks.map(r => r.targetGenes.map(tg => tg.name))
                                          .reduce((a, b) => a.concat(b), [])
                                          .filter((name, index, self) => self.indexOf(name) === index)
                                          .length;
    let geneNodeRadius = Math.min(svgSize * 0.05, 10);

    let geneNodePositions = {};

    let graph = $("#graph #body");
    graph.empty();

    for (let regulon of regulonNetworks) {
        let svgDiv = $("<div>")
            .addClass("wagonwheel ui card")
            .width(svgDivSize)

        let svg = $(svgElem("svg"))
            .attr({
                "width": svgSize,
                "height": svgSize
            })
        svgDiv.append(svg);

        let svgFooter = $("<div>")
                .addClass("header")
                .text(regulon.genomeName)
        svgDiv.append(svgFooter);

        let toRadians = (degrees) => degrees / 180 * Math.PI;

        let from = {
            x: svgSize / 2,
            y: svgSize / 2
        }

        for (let gene of regulon.targetGenes) {
            let to = (() => {
                if (!geneNodePositions[gene.name]) {
                    geneNodePositions[gene.name] = {
                        x: from.x + Math.cos(toRadians((270 + spokeAngle * Object.keys(geneNodePositions).length) % 360)) * spokeLength/2,
                        y: from.y + Math.sin(toRadians((270 + spokeAngle * Object.keys(geneNodePositions).length) % 360)) * spokeLength/2
                    }
                }
                return geneNodePositions[gene.name];
            })()

            let spoke = $(svgElem("line"))
                .attr({
                    "x1": from.x,
                    "y1": from.y,
                    "x2": to.x,
                    "y2": to.y,
                    "stroke-width": 2,
                    "stroke": "#8dd3c7"
                })
            svg.append(spoke);
            
            if (!gene.sites.length) spoke.css("stroke-dasharray", "5, 5").css("opacity", 0.5);

            function highlighNodeAndSpoke(color) {
                $("svg").find("circle.gene-node").each(function () {
                    let circle = $(this);
                    if (circle.data("gene-data").name == gene.name) {
                        circle.attr("fill", color);
                        $("svg").find("line").each(function () {
                            let line = $(this);
                            if (line.attr("x2") == circle.attr("cx") && line.attr("y2") == circle.attr("cy")) {
                                line.css("stroke", color);
                            }
                        })
                    }
                })
            }

            let node = $(svgElem("circle"))
                .addClass("gene-node")
                .data("gene-data", gene)
                .attr({
                    "cx": to.x,
                    "cy": to.y,
                    "r": geneNodeRadius,
                    "fill": "#8dd3c7"
                })
                .on("mouseover", () => {
                    highlighNodeAndSpoke("blue");

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
                    highlighNodeAndSpoke("#8dd3c7");
                    tooltip.css("visibility", "hidden");
                })
            svg.append(node);
        }

        let centroidMargin = $(svgElem("circle"))
            .addClass("centroid-margin")
            .attr({
                "cx": svgSize / 2,
                "cy": svgSize / 2,
                "r": geneNodeRadius * 1.5,
                "fill": "white"
            })
        svg.append(centroidMargin);
        
        let centroid = $(svgElem("circle"))
            .addClass("centroid")
            .attr({
                "cx": svgSize / 2,
                "cy": svgSize / 2,
                "r": geneNodeRadius
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

        graph.append(svgDiv);
    }

    // Redraw if available width has changed after drawing
    // (usually due to scrollbar popin)
    if ($("#graph").width() < (svgDivSize + svgDivMargin) * columns) {
        drawWagonWheels(regulonNetworks);
    }
}