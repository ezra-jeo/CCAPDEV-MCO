document.addEventListener("DOMContentLoaded", function () {
    // Toggle reply box
    document.addEventListener("click", function (event) {
        if (event.target.classList.contains("reply-btn")) {
            let replyBox = event.target.closest(".reply-section").querySelector(".reply-box-container");
            replyBox.style.display = replyBox.style.display === "flex" ? "none" : "flex";
        }
    });
    
    document.addEventListener("click", async function (event) {
        if (event.target.classList.contains("submit-reply-btn")) {
            const reviewId = event.target.getAttribute("data-review-id");
            const replyText = event.target.previousElementSibling.value.trim();
    
            if (!replyText) {
                alert("Reply cannot be empty.");
                return;
            }
    
            try {
                const response = await fetch("/reply-to-review", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reviewId, replyText })
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
    });       

    const curPageElement = document.getElementById("cur-page");
    const totalPagesElement = document.getElementById("page-numbers");

    if (!curPageElement || !totalPagesElement) {
        console.error("Page elements not found.");
        return;
    }

    const currentPage = parseInt(curPageElement.textContent.trim(), 10) || 1;
    const totalPages = parseInt(totalPagesElement.textContent.split("of")[1].trim(), 10) || 1;

    // Disable 'Prev' if on first page
    if (currentPage === 1) {
        document.querySelector(".page-nav a:first-child").classList.add("disabled");
    }

    // Disable 'Next' if on last page
    if (currentPage === totalPages) {
        document.querySelector(".page-nav a:last-child").classList.add("disabled");
    }
});

function searchReviews() {
    const searchTerm = document.getElementById('searchBar').value.toLowerCase();
    const reviews = document.querySelectorAll('.review');
    const noResultsMessage = document.getElementById('no-results-message');
    let hasMatches = false;

    reviews.forEach(review => {
        const text = review.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            review.style.display = 'block'; // Show matching reviews
            hasMatches = true;
        } else {
            review.style.display = 'none'; // Hide non-matching reviews
        }
    });

    // Display "No review matched your search" if no matches are found
    if (!hasMatches) {
        if (!noResultsMessage) {
            const noResults = document.createElement('p');
            noResults.id = 'no-results-message';
            noResults.textContent = 'No review matched your search.';
            noResults.style.textAlign = 'center';
            noResults.style.color = '#888';
            noResults.style.marginTop = '20px';
            document.querySelector('.recent-reviews-container').appendChild(noResults);
        }
    } else {
        if (noResultsMessage) {
            noResultsMessage.remove();
        }
    }
}

function filterByRating(rating) {
    const reviews = document.querySelectorAll('.review');
    const noResultsMessage = document.getElementById('no-results-message');
    let hasMatches = false;

    reviews.forEach(review => {
        const stars = review.querySelectorAll('.rating-container .fa-star').length; // Count the number of stars
        if (rating === 'all' || stars == rating) {
            review.style.display = 'block'; // Show matching reviews
            hasMatches = true;
        } else {
            review.style.display = 'none'; // Hide non-matching reviews
        }
    });

    // Display "No review matched your filter" if no matches are found
    if (!hasMatches) {
        if (!noResultsMessage) {
            const noResults = document.createElement('p');
            noResults.id = 'no-results-message';
            noResults.textContent = 'No review matched your filter.';
            noResults.style.textAlign = 'center';
            noResults.style.color = '#888';
            noResults.style.marginTop = '20px';
            document.querySelector('.recent-reviews-container').appendChild(noResults);
        }
    } else {
        // Remove the "No results" message if it exists and matches are found
        if (noResultsMessage) {
            noResultsMessage.remove();
        }
    }
}