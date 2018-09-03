$(document).ready(() => {
    isLoading(true);
    $.ajax({
        url: `/${query.source}/${query.type}/${query.id}`,
        success: (data) => {
            console.log(data);
        },
        error: () => {
            alert("Error drawing graph.");
        },
        complete: () => {            
            isLoading(false);
        }
    })
})