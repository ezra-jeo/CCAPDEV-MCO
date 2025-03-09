const templateString = "\
{{#each reviewList}} \
<div class=\"review\">  \
    <div class=\"review-proper-container\">  \
        <div class=\"review-container\">  \
            <div class=\"review-header\">  \
                <div class=\"profile-container\">  \
                    <img src=\"{{profileImage}}\" alt=\"Profile\">  \
                </div>  \
                <div class=\"post-info\">  \
                    <div class=\"user-info-container\">  \
                        <a href=\"/userpage/{{userPage}}\">  \
                            <div class=\"user-name\">{{userName}}</div>  \
                        </a>  \
                        <div class=\"time\">{{timeAgo timePosted}}</div>  \
                    </div>  \
                </div>  \
                <div class=\"rating-edit-container\">  \
                    <div class=\"rating-container {{#if (eq ../loggedIn.userName userName) }} gone{{/if}}\">  \
                        {{#times reviewRating}}  \
                            <i class=\"fa-solid fa-star\"></i>  \
                        {{/times}}  \
                    </div>  \
                    {{#if (eq ../loggedIn.userName userName) }}    \
                        <div class=\"edit-container\">  \
                            <a href=\"/reviewedit/{{_id}}\">  \
                                <i class=\"fa-solid fa-pencil\"></i>  \
                            </a>  \
                            <a href=\"/\">  \
                                <i class=\"fa-solid fa-trash\"></i>  \
                            </a>  \
                        </div>  \
                    {{/if}}  \
                </div>  \
            </div>  \
            <div class=\"review-body\">  \
                <a href=\"{{orgPage}}\">  \
                    <div class=\"review-body-header\">{{orgName}}</div>  \
                </a>  \
                <div class=\"review-text\">{{reviewText}}</div>  \
                {{#if reviewImage}}  \
                    <div class=\"image\">  \
                        <img src=\"{{reviewImage}}\" alt=\"Review Image\">  \
                    </div>  \
                {{/if}}  \
                {{#if responseMessage}}  \
                    <div class=\"response-container\">  \
                        {{#if (eq ../loggedIn.userName responseUser)}}  \
                            <div class=\"response-header\">You replied</div>  \
                        {{else}}  \
                            <div class=\"response-header\">{{orgName}} replied</div>  \
                        {{/if}}  \
                        <div class=\"response-message\">  \
                            {{responseMessage}}  \
                        </div>  \
                    </div>  \
                {{/if}}  \
            </div>  \
        </div>  \
    </div>  \
</div>  \
<div class=\"review-footer\">  \
    <div class=\"helpfulness-container\">  \
        <button class=\"helpfulness-item\" data-action=\"not\" data-review-id=\"{{_id}}\" {{#if ../loggedIn}} onclick=\"updateHelpfulness('not', '{{_id}}')\" {{/if}}>  \
            Not Helpful  \
        </button>  \
        <button class=\"helpfulness-item\" data-action=\"help\" data-review-id=\"{{_id}}\" {{#if ../loggedIn}} onclick=\"updateHelpfulness('help', '{{_id}}')\" {{/if}}>  \
            Helpful  \
        </button>  \
    </div>  \
</div> \
{{/each}}";


function retrieveData(data, status) {
    if(status=="success") {
        if (data.reviewList.length > 0) {
            const template = Handlebars.compile(source);
            const html = template(data);
            $("#review-list").html(html);
            console.log($("#review-list").html());
        }
        else {
            $("#review-list").html("No reviews present");
        }
    }
    else {
        console.log("Error retrieving data");
    }
}

function searchAndFilter() {
    let search = $("#search-bar-review").val().trim(); // Search
    console.log("Search " + search)

    let filterStars = [];  // Filters
    $(".rate-opts-review:checked").each(function() {
        console.log($(this).val());
        filterStars.push($(this).val());
    });
    console.log("Filter stars " + filterStars);

    let filterCollege = [];
    $(".college-opts-review:checked").each(function() {
        console.log($(this).val());
        filterCollege.push($(this).val().toUpperCase());
    });

    console.log("Filter college " + filterCollege);
    $.get(`/searchreview/searchfilter/search${search}/qry1${filterStars}/qry2${filterCollege}`, retrieveData);
}

function clear() {
    $(".rate-opts-review:checked").each(function() {
        $(this).prop("checked", false).trigger("change");
    });
    $(".college-opts-review:checked").each(function() {
        $(this).prop("checked", false).trigger("change");
    });
}

$(document).ready(() => {
    $("#search-button-review").click(searchAndFilter);
    $(".rate-opts-review").change(searchAndFilter);
    $(".college-opts-review").change(searchAndFilter);
    $("#clear-feature-review").click(clear);   
});