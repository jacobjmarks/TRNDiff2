$(".btn-src").click((e) => {
    switch($(e.target).data("source")) {
        case "rpgenomes":
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
        default:
            break;
    }
})