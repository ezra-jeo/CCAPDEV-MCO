
function retrieveData(data, status) {
    if(status=="success") {
        if (data.orgList.length > 0) {
            const template = Handlebars.compile(source);
            const html = template(data);
            $("#org-list").html(html);
            console.log($("#org-list").html());
        }
        else {
            $("#org-list").html("No organizations present");
        }
    }
    else {
        console.log("Error retrieving data");
    }
}

function getSearch(qry, method="stars") {
    return function() {
        if (method == "stars") {
            console.log("Clicked!");
            let newHref = `/searchorg?trigger=${qry}-stars`;

            // Redirect to the new page (in the same tab)
            $(`#search-${qry}-stars`).attr("href", newHref);
        }
        else if (method == "college") {
            console.log("Clicked!");
            let newHref = `/searchorg?trigger=${qry}`;

            // Redirect to the new page (in the same tab)
            $(`#search-${qry}`).attr("href", newHref);
        }
    }
}

$(document).ready(() => {
    $("#search-5-stars").click(getSearch(5));
    $("#search-4-stars").click(getSearch(4));
    $("#search-3-stars").click(getSearch(3));
    $("#search-2-stars").click(getSearch(2));
    $("#search-1-stars").click(getSearch(1));

    $("#search-ccs").click(getSearch("ccs", "college"));
    $("#search-cla").click(getSearch("rvcob", "college"));
    $("#search-cos").click(getSearch("cos", "college"));
    $("#search-cla").click(getSearch("cla", "college"));
    $("#search-gcoe").click(getSearch("gcoe", "college"));
    $("#search-other").click(getSearch("other", "college"));

});