$(".btn-src").click((e) => {
    switch($(e.target).data("source")) {
        case "rpGenomes":
            $.ajax({
                method: "GET",
                url: "/regprecise/genomes",
                success: (data, status, req) => {
                    populateDataTable(data);
                },
                error: (e) => {
                    alert("Error retrieving RegPrecise Genomes");
                }
            })
            break;
        case "regulondb":
            $.ajax({
                method: "GET",
                url: "/regulondb",
                success: (data, status, req) => {
                    console.log(data);
                },
                error: (e) => {
                    alert("Error retrieving RegulonDB");
                }
            })
        default:
            break;
    }
})