const source = '{{#each reviewList}}\
<div class="review">\
    <div class="review-proper-container">\
        <div class="review-container">\
            <div class="review-header">\
                <div class="profile-container">\
                    <img src="{{profileImage}}" alt="Profile">\
                </div>\
                <div class="post-info">\
                    <div class="user-info-container">\
                        <a href="{{userPage}}">\
                            <div class="user-name">{{userName}}</div>\
                        </a>\
                        <div class="time">{{timeAgo timePosted}}</div>\
                    </div>\
                </div>\
                <div class="rating-container">\
                    {{#times reviewRating}}\
                        <i class="fa-solid fa-star"></i>\
                    {{/times}}\
                </div>\
            </div>\
            <div class="review-body">\
                <a href = "{{orgPage}}">\
                    <div class = "review-body-header">{{orgName}}\
                        {{#if orgpage}}\
                            <a href="/reviewedit">Edit Review</a>\
                        {{/if}}\
                    </div>\
                </a>\
                <div class="review-text">{{reviewText}}</div>\
                {{#if reviewImage}}\
                    <div class="image">\
                        <img src="{{reviewImage}}" alt="Review Image">\
                    </div>\
                {{/if}}\
                {{#if responseMessage}}\
                <div class="response-container">\
                    <div class="response-header">{{orgName}} replied</div>\
                    <div class="response-message">\
                        <div>{{responseMessage}}</div>\
                    </div>\
                </div>\
                {{/if}} \
                {{#if orgpage}}\
                <div class="reply-section">\
                    <button class="reply-btn">Reply to this Review</button>\
                    <div class="reply-box-container">\
                        <textarea class="reply-textbox" placeholder="Write a reply..."></textarea>\
                        <button class="submit-reply-btn">Submit</button>\
                    </div>\
                </div>\
                {{/if}}\
            </div>\
        </div>\
    </div>\
    <div class="review-footer">\
        <div class="helpfulness-container">\
            <div class="helpfulness-item">Mark as Helpful</div>\
            <div class="helpfulness-item">Mark as Unhelpful</div>\
        </div>\
        <div class="likes-container">\
            <div class="likes-container-content">{{dislikesCount}}</div>\
            <div class="likes-container-content"><i class="fa-regular fa-thumbs-down"></i></div>\
            <div class="likes-container-content">{{likesCount}}</div>\
            <div class="likes-container-content"><i class="fa-regular fa-thumbs-up"></i></div>\
        </div>\
    </div>\
</div>\
{{/each}}\
';
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
    $.get(`/reviews/searchfilter/search${search}/qry1${filterStars}/qry2${filterCollege}`, retrieveData);
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