function initTab(index) {
    let tab = $(`.active.tab[data-tab="${index}"`);

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
                    ["E Coli"]
                );
                // isLoading(true);
                // $.ajax({
                //     method: "GET",
                //     url: "/regulondb",
                //     success: (data) => {
                //         console.log(data);
                //     },
                //     error: (e) => {
                //         alert("Error retrieving RegulonDB");
                //     },
                //     complete: () => {                    
                //         isLoading(false);
                //     }
                // })
            default:
                break;
        }
    })

    tab.find(".select-data .tabular.menu .item").tab({
        context: tab
    });
}

function populateDataTable(tab, headers, rows) {
    let table = tab.find(".select-data table");
    table.empty();

    table.append($("<thead>").append(`<tr><th>${headers.join("</th><th>")}</th></tr>`));
    table.append($("<tbody>").append(`<tr><td>${rows.join("</td><td>")}</td></tr>`));
}