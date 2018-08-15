$(document).ready(() => {
    $("#div-sidebar").css("height", $(window).height() - 30);
    $("#div-sidebar-body").css("height", $(window).height() - $("#div-sidebar-body").position().top - 45);
    
    $(window).resize(() => {
        $("#div-sidebar").css("height", $(window).height() - 30);
        $("#div-sidebar-body").css("height", $(window).height() - $("#div-sidebar-body").position().top - 45);
    })

    $("#div-sidebar").change(() => {
        $("#div-sidebar").css("height", $(window).height() - 30);
        $("#div-sidebar-body").css("height", $(window).height() - $("#div-sidebar-body").position().top - 45);
    })
    
    $("select#select-source").change((e) => {
        switch(e.target.value) {
            case "regprecise":
                $("select#regprecise-query").show();
                break;
            case "regulondb":
                fetch_RegulonDB();
                break;
            default:
                break;
        }
    });

    $("select#regprecise-query").change((e) => {
        fetch_RegPrecise(e.target.value);
    });

    $("#div-graph").height($("#div-graph").parent().parent().height() - $("#div-graph").position().top);

    graph = cytoscape({
        container: $("#div-graph"),
        style: [
            {
                selector: "node",
                style: {
                    "label": "data(name)"
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
})

function fetch_RegPrecise(content) {
    $("#div-sidebar-title").text("Genomes");
    $("#div-sidebar-body").empty();

    $.ajax({
        method: "GET",
        url: `/regprecise/${content}`,
        success: (data) => {
            console.log(data);
            let genomes = data;
            let rows = [];

            for (let genome of genomes) {
                let row = $(pugTemplate_genome({
                    name: genome.name,
                    id: genome.genomeId,
                    tid: genome.taxonomyId
                }))[0];

                $(row).click(() => {
                    $("#div-sidebar-title").text("Regulators");
                    $("#div-sidebar-body").empty();
                    $("#div-sidebar-crumbs ol").append(
                        $("<li>").addClass("breadcrumb-item").text(genome.name)
                    )
                    fetch_GenomeRegulatoryNetwork(genome.genomeId, (err, regulators, graph) => {
                        if (err) return window.alert("Error.");
                        let rows = [];
                        for (let regulator of regulators) {
                            let row = $(pugTemplate_regulator({
                                name: regulator.name,
                                family: regulator.regulatorFamily,
                                locusTag: regulator.locusTag,
                                id: regulator.vimssId,
                                regulonId: regulator.regulonId,
                                desc: regulator.function
                            }))[0];

                            $(row).hover(
                                (e) => { // In
                                    window.graph.$id(regulator.vimssId).select();
                                },
                                (e) => { // Out
                                    window.graph.$id(regulator.vimssId).deselect();
                                }
                            )

                            rows.push(row);
                        }

                        populateSideBar(rows);
                        drawGraph(graph);
                    });
                })

                rows.push(row);
            }

            populateSideBar(rows);
        },
        error: () => {
            console.error("Error response from server.");
        }
    })
}

function fetch_GenomeRegulatoryNetwork(genomeId, cb) {
    $.ajax({
        method: "GET",
        url: `/regprecise/regulatorynetwork/${genomeId}`,
        success: (data) => {
            console.log(data);
            cb(null, data.network.regulators, data.graph);
        },
        error: () => {
            cb(true);
            console.error("Error response from server.");
        }
    })
}

function fetch_RegulonDB() {
    $.ajax({
        method: "GET",
        url: "/regulondb/",
        success: (data) => {
            console.log(data);
        },
        error: () => {
            console.error("Error response from server.");
        }
    })
}

function viewGenomes() {

}

function populateSideBar(rows) {
    for (let row of rows) {
        $("#div-sidebar-body").append(row);
    }
}

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