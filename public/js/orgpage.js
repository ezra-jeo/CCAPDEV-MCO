document.addEventListener("DOMContentLoaded", function () {
    setupReplyFeature();
    setupPagination();
});

function setupReplyFeature() {
    document.addEventListener("click", async function (event) {
        if (event.target.classList.contains("reply-btn")) {
            toggleReplyBox(event.target);
        }

        if (event.target.classList.contains("submit-reply-btn")) {
            await submitReply(event.target);
        }
    });
}

function toggleReplyBox(button) {
    let replyBox = button.closest(".reply-section").querySelector(".reply-box-container");
    replyBox.style.display = replyBox.style.display === "flex" ? "none" : "flex";
}

async function submitReply(button) {
    const reviewId = button.dataset.reviewId;
    const replyText = button.previousElementSibling.value.trim();

    if (!replyText) {
        alert("Reply cannot be empty.");
        return;
    }

    try {
        const response = await fetch("/reply-to-review", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reviewId, replyText }),
        });

        const data = await response.json();
        if (data.success) {
            alert("Reply submitted successfully!");
            location.reload();
        } else {
            alert("Error submitting reply.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Failed to send reply.");
    }
}

function setupPagination() {
    const curPageElement = document.getElementById("cur-page");
    const totalPagesElement = document.getElementById("page-numbers");

    if (!curPageElement || !totalPagesElement) {
        return; 
    }

    const currentPage = parseInt(curPageElement.textContent.trim(), 10) || 1;
    const totalPages = parseInt(totalPagesElement.textContent.split("of")[1].trim(), 10) || 1;

    if (currentPage === 1) {
        document.querySelector(".page-nav a:first-child")?.classList.add("disabled");
    }

    if (currentPage === totalPages) {
        document.querySelector(".page-nav a:last-child")?.classList.add("disabled");
    }
}

function searchReviews() {
    const searchTerm = document.getElementById("searchBar").value.toLowerCase();
    const reviews = document.querySelectorAll(".review");
    let hasMatches = false;

    reviews.forEach(review => {
        review.style.display = review.textContent.toLowerCase().includes(searchTerm) ? "block" : "none";
        if (review.style.display === "block") hasMatches = true;
    });

    toggleNoResultsMessage(hasMatches, "No review matched your search.");
}

function filterByRating(rating) {
    const reviews = document.querySelectorAll(".review");
    let hasMatches = false;

    reviews.forEach(review => {
        const stars = review.querySelectorAll(".rating-container .fa-star").length;
        review.style.display = (rating === "all" || stars == rating) ? "block" : "none";
        if (review.style.display === "block") hasMatches = true;
    });

    toggleNoResultsMessage(hasMatches, "No review matched your filter.");
}

function toggleNoResultsMessage(hasMatches, message) {
    let noResultsMessage = document.getElementById("no-results-message");

    if (!hasMatches) {
        if (!noResultsMessage) {
            noResultsMessage = document.createElement("p");
            noResultsMessage.id = "no-results-message";
            noResultsMessage.textContent = message;
            noResultsMessage.style.textAlign = "center";
            noResultsMessage.style.color = "#888";
            noResultsMessage.style.marginTop = "20px";
            document.querySelector(".recent-reviews-container").appendChild(noResultsMessage);
        }
    } else {
        noResultsMessage?.remove();
    }
}
