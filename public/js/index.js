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
                $("#div-sidebar-body").append(
                    $("<div>").addClass("row").append(
                            $("<div>").addClass("card")
                                .addClass("w-100")
                                .append(
                                    $("<div>").addClass("card-body")
                                        .addClass("py-1")
                                        .addClass("px-2")
                                        .text(genome.name)
                                        .click(() => {
                                            console.log(genome.genomeId);
                                        })
                                )
                                .append(
                                    $("<div>").addClass("card-footer")
                                        .hide()
                                )
                        )
                );
            }
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