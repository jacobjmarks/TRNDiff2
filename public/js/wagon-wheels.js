let columns = 4;

$(document).ready(() => {
    tooltip = $("<tooltip>")
        .addClass("ui segment")
        .css("position", "absolute")
        .css("z-index", 10)
        .css("visibility", "hidden")
        .css("padding", "10px")
        .css("background-color", "rgba(255,255,255,0.75)")
    $("body").append(tooltip);
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

function drawWagonWheels(regulonNetworks) {
    $("#graph").show();
    let svgSize = $("#graph").width() / columns;

    // regulonNetworks = regulonNetworks.sort((a, b) => b.targetGenes.length - a.targetGenes.length);

    let spokeLength = svgSize * 0.75;
    let spokeAngle = 360 / regulonNetworks.map(r => r.targetGenes.map(tg => tg.name))
                                          .reduce((a, b) => a.concat(b), [])
                                          .filter((name, index, self) => self.indexOf(name) === index)
                                          .length;
    let geneNodeRadius = Math.min(svgSize * 0.05, 10);

    let geneNodePositions = {};

    let graph = d3.select("#graph #body");
    graph.html("");

    for (let regulon of regulonNetworks) {
        let svg = graph.append("svg")
            .attr("width", svgSize)
            .attr("height", svgSize)

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

            let spoke = svg.append("line")
                .attr("x1", from.x)
                .attr("y1", from.y)
                .attr("x2", to.x)
                .attr("y2", to.y)
                .attr("stroke-width", 2)
                .attr("stroke", "#8dd3c7")
            
            if (!gene.sites.length) spoke.style("stroke-dasharray", "5, 5").style("opacity", 0.5);

            function highlighNodeAndSpoke(color) {
                d3.selectAll("svg")
                    .selectAll("circle.gene-node")
                    .each(function (d, i) {
                        if (d.name == gene.name) {
                            let circle = d3.select(this);
                            circle.attr("fill", color);
                            d3.selectAll("svg").selectAll("line").each(function(d, i) {
                                let line = d3.select(this);
                                if (line.attr("x2") == circle.attr("cx") && line.attr("y2") == circle.attr("cy")) {
                                    line.style("stroke", color);
                                }
                            })
                        }
                    })
            }

            let node = svg.append("circle")
                .datum(gene)
                .attr("class", "gene-node")
                .attr("cx", to.x)
                .attr("cy", to.y)
                .attr("r", geneNodeRadius)
                .attr("fill", "#8dd3c7")
                .on("mouseover", () => {
                    highlighNodeAndSpoke("blue");

                    tooltip.empty();
                    tooltip
                        .append($("<table>")
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
                .on("mousemove", () => { tooltip.css("top",(d3.event.pageY-10)+"px").css("left",(d3.event.pageX+10)+"px") })
                .on("mouseout", () => {
                    highlighNodeAndSpoke("#8dd3c7");
                    tooltip.css("visibility", "hidden");
                })
        }

        let centroidMargin = svg.append("circle")
            .attr("class", "centroid-margin")
            .attr("cx", svgSize / 2)
            .attr("cy", svgSize / 2)
            .attr("r", geneNodeRadius * 1.5)
            .attr("fill", "white")
        
        let centroid = svg.append("circle")
            .attr("class", "centroid")
            .attr("cx", svgSize / 2)
            .attr("cy", svgSize / 2)
            .attr("r", geneNodeRadius)
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
            .on("mousemove", () => { tooltip.css("top",(d3.event.pageY-10)+"px").css("left",(d3.event.pageX+10)+"px") })
            .on("mouseout", () => { tooltip.css("visibility", "hidden") })
    }

    // Redraw if available width has changed after drawing
    // (usually due to scrollbar popin)
    if ($("#graph").width() < svgSize * columns) {
        drawWagonWheels(regulonNetworks);
    }
}