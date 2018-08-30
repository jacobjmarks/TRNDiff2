$(document).ready(() => {
    $("#graph").height($("#graph").parent().parent().height() - $("#graph").position().top);

    graph = cytoscape({
        container: $("#graph"),
        style: [
            {
                selector: "node",
                style: {
                    "label": "data(name)",
                    "width": "data(size)",
                    "height": "data(size)"
                }
            },
            {
                selector: "edge",
                style: {
                    "curve-style": "bezier",
                    "target-arrow-shape": "triangle"
                }
            }
        ]
    });

    graph.on("select", "node", (e) => {
        e.target.connectedEdges().select();
    });
    graph.on("unselect", "node", (e) => {
        e.target.connectedEdges().deselect();
    });

    $.ajax({
        url: `${query.source}/${query.type}/${query.id}?graphable=1`,
        success: (data) => {
            drawGraph(data);
        },
        error: () => {
            alert("Error drawing graph.");
        }
    })
})

function drawGraph(elements) {
    graph.remove('*');
    graph.add(elements);

    graph.nodes(node => node.connectedEdges().empty()).hide();

    let layout = graph.layout({
        name: "cola",
        animate: true,
        refresh: 3,
        maxSimulationTime: 2000,
        nodeSpacing: 15
    })

    layout.one("layoutstop", () => {
        // Rerun simulation once to achieve better results
        layout.run();
    });

    layout.run();
}