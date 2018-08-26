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
            case "rpGenomes":
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
            case "regulondb":
                isLoading(true);
                $.ajax({
                    method: "GET",
                    url: "/regulondb",
                    success: (data) => {
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
}