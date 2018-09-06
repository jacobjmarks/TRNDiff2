$(document).ready(() => {    
    $(".dimmer").dimmer({
        closable: false
    })
})

function isLoading(loading) {
    if (loading) {
        $("#page-dimmer").dimmer("show");
    } else {
        $("#page-dimmer").dimmer("hide");
    }
}