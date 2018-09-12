$(document).ready(() => {
    $("table tbody td").each(function() {
        $(this).attr("data-sort-value", $(this).html());
    })

    $("table").tablesort();
})