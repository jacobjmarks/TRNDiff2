$(document).ready(() => {    
    $(".dimmer").dimmer({
        closable: false
    })
})

function isLoading(loading) {
    if (loading) {
        $(".dimmer").dimmer("show");
    } else {
        $(".dimmer").dimmer("hide");
    }
}