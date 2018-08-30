let tabCount = 0;

// let selectedData = [];

let isLoading = (loading) => {
    if (loading) {
        $(".dimmer").dimmer("show");
    } else {
        $(".dimmer").dimmer("hide");
    }
}

$(document).ready(() => {
    $(".dimmer").dimmer({
        closable: false
    })

    $(".select-data .btn-src").click((e) => {
        switch($(e.target).data("source")) {
            case "rp-genomes":
                isLoading(true);
                $.ajax({
                    method: "GET",
                    url: "/regprecise/genomes",
                    success: (data) => {
                        console.log(data);
                    },
                    error: (e) => {
                        alert("Error retrieving RegPrecise Genomes");
                    },
                    complete: () => {                    
                        isLoading(false);
                    }
                })
                break;
            case "rdb-genomes":
                populateDataTable(
                    ["Name"],
                    [["Escherichia coli K-12"]]
                );
                break;
            default:
                break;
        }
    })

    $("button.btn-add-data").click((e) => {
        let table = $(".select-data table");
        selectData(table.find(".active").data("query"));
    });

    $(".select-data .tabular.menu .item").tab();

    checkSourceStatus();
    // $("#div-sidebar").css("height", $(window).height() - 30);
    // $("#div-sidebar-body").css("height", $(window).height() - $("#div-sidebar-body").position().top - 45);
    
    // $(window).resize(() => {
    //     $("#div-sidebar").css("height", $(window).height() - 30);
    //     $("#div-sidebar-body").css("height", $(window).height() - $("#div-sidebar-body").position().top - 45);
    // })

    // $("#div-sidebar").change(() => {
    //     $("#div-sidebar").css("height", $(window).height() - 30);
    //     $("#div-sidebar-body").css("height", $(window).height() - $("#div-sidebar-body").position().top - 45);
    // })
    
    // $("select#select-source").change((e) => {
    //     switch(e.target.value) {
    //         case "regprecise":
    //             $("select#regprecise-query").show();
    //             break;
    //         case "regulondb":
    //             fetch_RegulonDB();
    //             break;
    //         default:
    //             break;
    //     }
    // });

    // $("select#regprecise-query").change((e) => {
    //     fetch_RegPrecise(e.target.value);
    // });

    // $("#div-graph").height($("#div-graph").parent().parent().height() - $("#div-graph").position().top);

    // graph = cytoscape({
    //     container: $("#div-graph"),
    //     style: [
    //         {
    //             selector: "node",
    //             style: {
    //                 "label": "data(name)",
    //                 "width": "data(size)",
    //                 "height": "data(size)"
    //             }
    //         },
    //         {
    //             selector: "edge",
    //             style: {
    //                 "curve-style": "bezier",
    //                 "target-arrow-shape": "triangle"
    //             }
    //         }
    //     ]
    // });

    // graph.on("select", "node", (e) => {
    //     e.target.connectedEdges().select();
    // });
    // graph.on("unselect", "node", (e) => {
    //     e.target.connectedEdges().deselect();
    // });
})

function checkSourceStatus() {
    let tab = $(".tabular.menu .item[data-tab='regprecise']");
    let tabContent = $(".tab[data-tab='regprecise']");
    
    tab.addClass("disabled");
    tabContent.attr("data-tab", null);

    // RegPrecise
    $.get("/regprecise/status").done((status) => {
        if (status == 200) {
            tab.find(".icon").addClass("green");
            tab.removeClass("disabled");
            tabContent.attr("data-tab", "regprecise");
        } else {
            tab.find(".icon").addClass("red");
        }
        
        tab.find(".icon").show();
        tab.find(".loading").hide();
    });
}

function populateDataTable(headers, rows) {
    let table = $(".select-data table");
    table.empty();

    table.append($("<thead>").append(`<tr><th>${headers.join("</th><th>")}</th></tr>`));

    let tBody = $("<tbody>");
    for (let row of rows) {
        let tr = $("<tr>");
        for (let datum of row) {
            tr.append(`<td data-sort-value="${datum}">${datum}</td>`);
        }

        tr.css("cursor", "pointer");

        tr.click(() => {
            tBody.find("tr.active").removeClass("active");
            tr.addClass("active");
        })

        tr.data("query", {
            source: "RegulonDB",
            type: "Genome",
            name: row[0],
            id: undefined
        });

        tBody.append(tr);
    }

    table.append(tBody);
    table.tablesort();
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

// function selectData(data) {
//     selectedData.push(data);

//     populateSelectedData();

//     $(".select-data").hide();
//     $(".selected-data").show();
// }

// function populateSelectedData() {
//     let tableBody = $(".selected-data table > tbody");
//     tableBody.empty();

//     selectedData.forEach((d) => {
//         tableBody.append(
//             $("<tr>")
//                 .append($("<td>").text(d.source))
//                 .append($("<td>").text(d.type))
//                 .append($("<td>").text(d.name))
//         );
//     });
// }

// function fetch_RegPrecise(content) {
//     $("#div-sidebar-title").text("Genomes");
//     $("#div-sidebar-body").empty();

//     $.ajax({
//         method: "GET",
//         url: `/regprecise/${content}`,
//         success: (data) => {
//             console.log(data);
//             let genomes = data;
//             let rows = [];

//             for (let genome of genomes) {
//                 let row = $(pugTemplate_genome({
//                     name: genome.name,
//                     id: genome.genomeId,
//                     tid: genome.taxonomyId
//                 }))[0];

//                 $(row).click(() => {
//                     $("#div-sidebar-title").text("Regulators");
//                     $("#div-sidebar-body").empty();
//                     $("#div-sidebar-crumbs ol").append(
//                         $("<li>").addClass("breadcrumb-item").text(genome.name)
//                     )
//                     fetch_GenomeRegulatoryNetwork(genome.genomeId, (err, regulators, graph) => {
//                         if (err) return window.alert("Error.");
//                         let rows = [];
//                         for (let regulator of regulators) {
//                             let row = $(pugTemplate_regulator({
//                                 name: regulator.name,
//                                 family: regulator.regulatorFamily,
//                                 locusTag: regulator.locusTag,
//                                 id: regulator.vimssId,
//                                 regulonId: regulator.regulonId,
//                                 desc: regulator.function
//                             }))[0];

//                             $(row).hover(
//                                 (e) => { // In
//                                     window.graph.$id(regulator.vimssId).select();
//                                 },
//                                 (e) => { // Out
//                                     window.graph.$id(regulator.vimssId).deselect();
//                                 }
//                             )

//                             rows.push(row);
//                         }

//                         populateSideBar(rows);
//                         drawGraph(graph);
//                     });
//                 })

//                 rows.push(row);
//             }

//             populateSideBar(rows);
//         },
//         error: () => {
//             console.error("Error response from server.");
//         }
//     })
// }

// function fetch_GenomeRegulatoryNetwork(genomeId, cb) {
//     $.ajax({
//         method: "GET",
//         url: `/regprecise/regulatorynetwork/${genomeId}`,
//         success: (data) => {
//             console.log(data);
//             cb(null, data.network.regulators, data.graph);
//         },
//         error: () => {
//             cb(true);
//             console.error("Error response from server.");
//         }
//     })
// }

// function fetch_RegulonDB() {
//     $.ajax({
//         method: "GET",
//         url: "/regulondb/",
//         success: (data) => {
//             console.log(data);
//         },
//         error: () => {
//             console.error("Error response from server.");
//         }
//     })
// }

// function viewGenomes() {

// }

// function populateSideBar(rows) {
//     for (let row of rows) {
//         $("#div-sidebar-body").append(row);
//     }
// }
