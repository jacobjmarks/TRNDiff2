let columns = 4;

function viewWagonWheels(regulogId) {
    $("#select-data .table").empty();
    $("#select-data .table").hide();
    $("#graph").empty();

    isLoading(true);
    $.ajax({
        method: "GET",
        url: `/regprecise/graph/wagonwheels/regulog/${regulogId}`,
        success: (regulonNetworks) => {
            let graph = d3.select("#graph");
            let svgSize = $(".ui.container").width() / columns;

            let tooltip = d3.select("body").append("div")
                .style("position", "absolute")
                .style("z-index", 10)
                .style("visibility", "hidden")

            for (let regulon of regulonNetworks) {
                let svg = graph.append("svg")
                    .attr("width", svgSize)
                    .attr("height", svgSize)
                
                let centroid = svg.append("circle")
                    .attr("cx", svgSize / 2)
                    .attr("cy", svgSize / 2)
                    .attr("r", 10)
                    .on("mouseout", () => { tooltip.style("visibility", "hidden") })
                    .on("mousemove", () => { tooltip.style("top",(d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px") })
                    .on("mouseover", () => {
                        tooltip
                            .text(regulon.regulatorName)
                            .style("visibility", "visible")
                    })

                let spokeRadius = svgSize * 0.75 / 2;
                let spokeAngle = 360 / regulon.targetGenes.length * 0.01745329252;

                let origin = {
                    x: centroid.attr("cx"),
                    y: centroid.attr("cy")
                }

                let index = 0;
                for (let gene of regulon.targetGenes) {
                    spokeAngle = index / (regulon.targetGenes.length / 2) * Math.PI;

                    let x1 = origin.x;
                    let y1 = origin.y;
                    let x2 = spokeRadius * Math.cos(spokeAngle) + svgSize / 2;
                    let y2 = spokeRadius * Math.sin(spokeAngle) + svgSize / 2;

                    let spoke = svg.append("line")
                        .attr("x1", x1)
                        .attr("y1", y1)
                        .attr("x2", x2)
                        .attr("y2", y2)
                        .attr("stroke-width", 2)
                        .attr("stroke", "black")

                    index++;
                }
            }
        },
        error: () => {
            alert("Error fetching graph network");
        },
        complete: () => {
            isLoading(false);
        }
    })
}