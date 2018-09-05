let columns = 4;

$(document).ready(() => {
    tooltip = d3.select("body").append("tooltip")
        .style("position", "absolute")
        .style("z-index", 10)
        .style("visibility", "hidden")
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
            $("#btn-zoom-in").unbind().click(() => { if (columns > 1) columns--; drawWagonWheels(regulonNetworks) })
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
    let graph = d3.select("#graph #body");
    graph.html("");
    let svgSize = $("#graph").parent().width() / columns;

    // regulonNetworks = regulonNetworks.sort((a, b) => b.targetGenes.length - a.targetGenes.length);

    let spokeLength = svgSize * 0.75;
    let spokeAngle = 360 / regulonNetworks.map(r => r.targetGenes.map(tg => tg.name))
                                          .reduce((a, b) => a.concat(b), [])
                                          .filter((name, index, self) => self.indexOf(name) === index)
                                          .length;
    let geneNodeRadius = Math.min(svgSize * 0.05, 10);

    let geneNodePositions = {};

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
            
            if (!gene.sites.length) spoke.style("stroke-dasharray", "5, 5")

            let node = svg.append("circle")
                .datum(gene)
                .attr("class", "gene-node")
                .attr("cx", to.x)
                .attr("cy", to.y)
                .attr("r", geneNodeRadius)
                .attr("fill", "#8dd3c7")
                .on("mouseover", () => {
                    d3.selectAll("svg")
                        .selectAll("circle.gene-node")
                        .each(function (d, i) {
                            if (d.name == gene.name) {
                                d3.select(this).attr("fill", "blue");
                            }
                        })
                })
                .on("mouseout", () => {
                    d3.selectAll("svg")
                        .selectAll("circle.gene-node")
                        .each(function (d, i) {
                            if (d.name == gene.name) {
                                d3.select(this).attr("fill", "#8dd3c7");
                            }
                        })
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
            .on("mouseout", () => { tooltip.style("visibility", "hidden") })
            .on("mousemove", () => { tooltip.style("top",(d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px") })
            .on("mouseover", () => {
                tooltip
                    .text(regulon.regulatorName)
                    .style("visibility", "visible")
            })
    }
}