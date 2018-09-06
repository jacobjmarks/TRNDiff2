$(document).ready(() => {
    $("#select-data .secondary.menu a.item").click((e) => {
        switch($(e.target).data("source")) {
            case "rp-genomes":
                isLoading(true);
                $.ajax({
                    method: "GET",
                    url: "/regprecise/genomes",
                    success: (genomes) => {
                        populateDataTable(
                            ["RegPrecise ID", "TaxID", "Name", "RNA Regulons", "RNA Sites", "TF Regulons", "TF Sites"],
                            genomes.map((g) => {
                                return {
                                    "RegPrecise ID": g.genomeId,
                                    "TaxID": g.taxonomyId,
                                    "Name": g.name,
                                    "RNA Regulons": g.rnaRegulonCount,
                                    "RNA Sites": g.rnaSiteCount,
                                    "TF Regulons": g.tfRegulonCount,
                                    "TF Sites": g.tfSiteCount
                                }
                            }),
                            (row) => {
                                isLoading(true);
                                $.ajax({
                                    method: "GET",
                                    url: `/regprecise/regulons?genomeId=${$(row).data("RegPrecise ID")}`,
                                    success: (regulons) => {
                                        populateDataTable(
                                            ["Regulog ID", "Regulon ID", "Regulation Type", "Effector", "Regulator Family", "Regulator Name", "Pathway"],
                                            regulons.map((r) => {
                                                return {
                                                    "Regulog ID": r.regulogId,
                                                    "Regulon ID": r.regulonId,
                                                    "Regulation Type":  r.regulationType,
                                                    "Effector": r.effector,
                                                    "Regulator Family": r.regulatorFamily,
                                                    "Regulator Name": r.regulatorName,
                                                    "Pathway": r.pathway
                                                }
                                            }),
                                            (row) => {
                                                viewWagonWheels($(row).data("Regulog ID"));
                                            }
                                        )
                                    },
                                    error: () => {
                                        alert("Error retrieving RegPrecise Regulons");
                                    },
                                    complete: () => {
                                        isLoading(false);
                                    }
                                })
                            }
                        )
                    },
                    error: (e) => {
                        alert("Error retrieving RegPrecise Genomes");
                    },
                    complete: () => {                    
                        isLoading(false);
                    }
                })
                break;
            case "rp-regulogs":
                isLoading(true);
                $.ajax({
                    method: "GET",
                    url: "/regprecise/regulogs",
                    success: (data) => {
                        populateDataTable(
                            ["Regulog ID", "Taxonomy", "Effector", "Pathway", "Regulation Type", "Regulator Family", "Regulator Name"],
                            data.map((r) => {
                                return {
                                    "Regulog ID": r.regulogId,
                                    "Taxonomy": r.taxonName,
                                    "Effector": r.effector,
                                    "Pathway": r.pathway,
                                    "Regulation Type": r.regulationType,
                                    "Regulator Family": r.regulatorFamily,
                                    "Regulator Name": r.regulatorName
                                }
                            }),
                            (row) => {
                                viewWagonWheels($(row).data("Regulog ID"));
                            }
                        )
                    },
                    error: (e) => {
                        alert("Error retrieving RegPrecise Regulogs");
                    },
                    complete: () => {                    
                        isLoading(false);
                    }
                })
                break;
            case "rdb-genomes":
                populateDataTable(
                    ["Name"],
                    [{
                        source: "RegulonDB",
                        type: "Genome",
                        _id: 0,
                        "Name": "Escherichia coli K-12"
                    }]
                );
                break;
            default:
                break;
        }
    })

    $("#select-data a.item").tab();

    checkSourceStatus();
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

function populateDataTable(headers, rows, onclick) {
    $("#graph").hide();
    $("#graph #body").empty();
    let table = $("#select-data table");
    table.empty();
    table.hide();

    table.append($("<thead>").append(`<tr><th>${headers.join("</th><th>")}</th></tr>`));

    let tBody = $("<tbody>");
    for (let row of rows) {
        let tr = $("<tr>");

        for (let header of headers) {
            let val = row[header];
            tr.append(`<td data-sort-value="${val}">${val}</td>`)
                .data(header, val);
        }

        tr.click((e) => { onclick($(e.target).parent()) });

        tBody.append(tr);
    }

    table.append(tBody);
    table.show();
    table.tablesort();
}