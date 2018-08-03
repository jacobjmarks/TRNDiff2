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
})

function fetch_RegPrecise() {
    $.ajax({
        method: "GET",
        url: "/regprecise/genomes",
        success: (data) => {
            console.log(data);
            let genomes = data;

            for (let genome of genomes) {
                let row = $("<div>").addClass("row").append(
                        $("<div>").addClass("card")
                            .addClass("w-100")
                            .append(
                                $("<div>").addClass("card-body")
                                    .addClass("py-1")
                                    .addClass("px-2")
                                    .text(genome.name)
                                    .click(() => {
                                        fetch_RegPreciseRegulatoryNetwork(genome.genomeId, $(row).find(".card-footer"));
                                    })
                            )
                            .append($("<div>").addClass("card-footer").hide())
                )

                $("#div-sidebar-body").append(row);
            }
        },
        error: () => {
            console.error("Error response from server.");
        }
    })
}

function fetch_RegPreciseRegulatoryNetwork(genomeId, div) {
    $.ajax({
        method: "GET",
        url: `/regprecise/regulatorynetwork/${genomeId}`,
        success: (data) => {
            let regulators = data.regulators;
            console.log(regulators);

            for (let regulator of regulators) {
                let row = $("<div>").addClass("row").append(
                    $("<div>").addClass("card")
                        .addClass("w-100")
                        .append(
                            $("<div>").addClass("card-body")
                                .addClass("py-1")
                                .addClass("px-2")
                                .text(regulator.name)
                        )
                        .append($("<div>").addClass("card-footer").hide())
                )

                $(div).append(row);
            }

            $(div).show();
        },
        error: () => {
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