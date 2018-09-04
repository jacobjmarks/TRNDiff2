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