$(document).ready(() => {
    $(".active.tab .dimmer").dimmer({
        closable: false
    })

    $(".select-data .btn-src").click((e) => {
        switch($(e.target).data("source")) {
            case "rpGenomes":
                isLoading(true);
                $.ajax({
                    method: "GET",
                    url: "/regprecise/genomes",
                    success: (data, status, req) => {
                        populateDataTable(data);
                    },
                    error: (e) => {
                        alert("Error retrieving RegPrecise Genomes");
                    },
                    complete: () => {                    
                        isLoading(false);
                    }
                })
                break;
            case "regulondb":
                isLoading(true);
                $.ajax({
                    method: "GET",
                    url: "/regulondb",
                    success: (data, status, req) => {
                        console.log(data);
                    },
                    error: (e) => {
                        alert("Error retrieving RegulonDB");
                    },
                    complete: () => {                    
                        isLoading(false);
                    }
                })
            default:
                break;
        }
    })
})

function isLoading(loading) {
    if (loading) {
        $(".active.tab .dimmer").dimmer("show");
    } else {
        $(".active.tab .dimmer").dimmer("hide");
    }
}