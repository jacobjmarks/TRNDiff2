function initTab(index) {
    let tab = $(`.active.tab[data-tab="${index}"]`);

    let dimmer = tab.find(".dimmer").dimmer({
        closable: false
    })

    let isLoading = (loading) => {
        if (loading) {
            dimmer.dimmer("show");
        } else {
            dimmer.dimmer("hide");
        }
    }

    tab.find(".select-data .btn-src").click((e) => {
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
                populateDataTable(tab,
                    ["Name"],
                    [["Escherichia coli K-12"]]
                );
                break;
            default:
                break;
        }
    })

    tab.find("button.btn-add-data").click((e) => {
        let table = $(".select-data table");
        selectData(table.find(".active").data("query"));
    });

    tab.find(".select-data .tabular.menu .item").tab({
        context: tab
    });
}

function populateDataTable(tab, headers, rows) {
    let table = tab.find(".select-data table");
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

function selectData(data) {
    let page = getPage();
    page.data("selectedData").push(data);

    populateSelectedData();

    page.find(".select-data").hide();
    page.find(".selected-data").show();
}

function populateSelectedData() {
    let page = getPage();
    let tableBody = page.find(".selected-data table > tbody");
    tableBody.empty();

    page.data("selectedData").forEach((d) => {
        tableBody.append(
            $("<tr>")
                .append($("<td>").text(d.source))
                .append($("<td>").text(d.type))
                .append($("<td>").text(d.name))
        );
    });
}