function viewWagonWheels(regulogId) {
    $("#select-data .table").empty();
    $("#select-data .table").hide();
    $("#graph").empty();

    isLoading(true);
    $.ajax({
        method: "GET",
        url: `/regprecise/graph/wagonwheels/regulog/${regulogId}`,
        success: (regulonNetworks) => {
            let graph = $("#graph");

            let tempDiv = $("<div>").addClass("column");
            graph.append(tempDiv);
            let svgWidth = tempDiv.outerWidth();
            let svgHeight = svgWidth;
            graph.empty();

            for (let regulon of regulonNetworks) {
                let svg = $("<svg>").width(svgWidth).height(svgHeight);
                
                svg.append(
                    $("<circle>")
                        .attr("cx", svg.width() / 2)
                        .attr("cy", svg.height() / 2)
                        .attr("r", 10)
                )

                graph.append(svg);
            }

            graph.html(graph.html());
        },
        error: () => {
            alert("Error fetching graph network");
        },
        complete: () => {
            isLoading(false);
        }
    })
}