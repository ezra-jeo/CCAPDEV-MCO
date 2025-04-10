const source = '\
                {{#each orgList}}\
                <div class="org-section">\
                    <img class="org-profile-pic" src="{{this.orgPic}}"/>\
                    <div class="org-info">\
                        <a href = /orgpage/{{this.orgPage}}>\
                            <div class="org-name">\
                                {{this.orgName}}\
                            </div>\
                        </a>\
                        <div class="org-rating">\
                            <span class="org-stars">\
                                {{#times this.orgRating}}\
                                <i class="fa-solid fa-star"></i>\
                                {{/times}}\
                                <span class="rating-text">\
                                    {{this.orgRating}} ({{this.orgReviews}} reviews)\
                                </span>\
                            </span>\
                        </div>\
                        <div class="review-desc">\
                            {{this.orgDesc}}\
                        </div>\
                        <div class="org-college">\
                            {{this.orgCollege}}\
                        </div>\
                    </div>\
                </div>\
                {{/each}}';

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

function searchAndFilter() {
    let search = $("#search-bar-org").val().trim(); // Search

    let filterStars = [];  // Filters
    $(".rate-opts-org:checked").each(function() {
        filterStars.push($(this).val());
    });

    let filterCollege = [];
    $(".college-opts-org:checked").each(function() {
        filterCollege.push($(this).val().toUpperCase());
    });

    $.get(`/searchorg/searchfilter?org=${search}&qry1=${filterStars}&qry2=${filterCollege}`, retrieveData);
}

function clear() {
    $(".rate-opts-org:checked").each(function() {
        $(this).prop("checked", false).trigger("change");
    });
    $(".college-opts-org:checked").each(function() {
        $(this).prop("checked", false).trigger("change");
    });
}

function sortAscName() {
    let search = $("#search-bar-org").val().trim(); // Search

    let filterStars = [];  // Filters
    $(".rate-opts-org:checked").each(function() {
        filterStars.push($(this).val());
    });

    let filterCollege = [];
    $(".college-opts-org:checked").each(function() {
        filterCollege.push($(this).val().toUpperCase());
    });

    $.get(`/searchorg/sort?org=${search}&qry1=${filterStars}&qry2=${filterCollege}&method=name&order=1`, retrieveData);
}
function sortDescName() {
    let search = $("#search-bar-org").val().trim(); // Search

    let filterStars = [];  // Filters
    $(".rate-opts-org:checked").each(function() {
        filterStars.push($(this).val());
    });

    let filterCollege = [];
    $(".college-opts-org:checked").each(function() {
        filterCollege.push($(this).val().toUpperCase());
    });
    
    $.get(`/searchorg/sort?org=${search}&qry1=${filterStars}&qry2=${filterCollege}&method=name&order=-1`, retrieveData);
}
function sortAscRating() {
    let search = $("#search-bar-org").val().trim(); // Search

    let filterStars = [];  // Filters
    $(".rate-opts-org:checked").each(function() {
        filterStars.push($(this).val());
    });

    let filterCollege = [];
    $(".college-opts-org:checked").each(function() {
        filterCollege.push($(this).val().toUpperCase());
    });
    
    $.get(`/searchorg/sort?org=${search}&qry1=${filterStars}&qry2=${filterCollege}&method=rating&order=1`, retrieveData);
}
function sortDescRating() {
    let search = $("#search-bar-org").val().trim(); // Search

    let filterStars = [];  // Filters
    $(".rate-opts-org:checked").each(function() {
        filterStars.push($(this).val());
    });

    let filterCollege = [];
    $(".college-opts-org:checked").each(function() {
        filterCollege.push($(this).val().toUpperCase());
    });
    
    $.get(`/searchorg/sort?org=${search}&qry1=${filterStars}&qry2=${filterCollege}&method=rating&order=-1`, retrieveData);
}

$(document).ready(() => {
    $("#search-button-org").click(searchAndFilter);
    $(".rate-opts-org").change(searchAndFilter);
    $(".college-opts-org").change(searchAndFilter);
    $("#clear-feature-org").click(clear);   
    $("#name-asc-btn").click(sortAscName);
    $("#rating-asc-btn").click(sortAscRating);
    $("#name-desc-btn").click(sortDescName);
    $("#rating-desc-btn").click(sortDescRating);

    // For queries from the homepage
    const urlParams = new URLSearchParams(window.location.search);
    const triggerButtonId = urlParams.get("trigger");
    const searchQuery = urlParams.get("homepage-org")

    if (searchQuery) {
        console.log("From homepage... Searching for: " + searchQuery);
        $("#search-bar-org").val(searchQuery);
        $("#search-button-org").click();
    }

    if (triggerButtonId) {
        console.log("Triggering button:", triggerButtonId);
        
        // Simulate button click
        $(`#${triggerButtonId}`).prop("checked", true).trigger("change");
    }


});