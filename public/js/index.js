$(document).ready(() => {
    $("#div-sidebar").css("height", $(window).height() - 30);
    $("#div-sidebar-body").css("height", $(window).height() - $("#div-sidebar-body").position().top - 45);
    
    $(window).resize(() => {
        $("#div-sidebar").css("height", $(window).height() - 30);
        $("#div-sidebar-body").css("height", $(window).height() - $("#div-sidebar-body").position().top - 45);
    })
    
    $("#select-source").change((e) => {
        switch(e.target.value) {
            case "regprecise":
                fetch_RegPrecise();
                break;
            case "regulondb":
                fetch_RegulonDB();
                break;
            default:
                break;
        }
    })

    $("#div-graph").width($("#div-graph").parent().width());
    $("#div-graph").height($("#div-graph").parent().height());

    graph = cytoscape({
        container: $("#div-graph")
    })
})

function fetch_RegPrecise() {
    $.ajax({
        method: "GET",
        url: "/regprecise/genomes",
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
                    fetch_GenomeRegulatoryNetwork(genome.genomeId, (err, regulators, graph) => {
                        if (err) return window.alert("Error.");
                        let rows = [];
                        for (let regulator of regulators) {
                            let row = $(pugTemplate_regulator({
                                name: regulator.name
                            }))[0];

                            rows.push(row);
                        }

                        populateSideBar(rows);
                        updateGraph(graph);
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

function populateSideBar(rows) {
    let sidebar = $("#div-sidebar-body");
    sidebar.empty();
    for (let row of rows) {
        sidebar.append(row);
    }
}

function updateGraph(elements) {
    graph.remove('*');
    graph.add(elements);
    graph.layout({
        name: "cola"
    }).run();
}