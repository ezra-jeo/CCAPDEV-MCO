document.addEventListener("DOMContentLoaded", () => {
    const stars = document.querySelectorAll(".star");
    const ratingInput = document.getElementById("rating");
    const reviewForm = document.getElementById("editReviewForm");
    const descriptionInput = document.getElementById("description");
    let selectedRating = parseInt(ratingInput.value, 10); // Get existing rating

    // Pre-fill stars based on existing rating
    function updateStarSelection(rating) {
        stars.forEach((star) => {
            const value = parseInt(star.getAttribute("data-value"), 10);
            star.classList.toggle("selected", value <= rating);
        });
    }
    updateStarSelection(selectedRating); // Pre-fill on page load

    // Handle star click to update rating
    stars.forEach((star) => {
        star.addEventListener("click", () => {
            selectedRating = parseInt(star.getAttribute("data-value"), 10);
            ratingInput.value = selectedRating;
            updateStarSelection(selectedRating);
        });
    });

    // Handle form submission
    reviewForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const reviewId = reviewForm.dataset.reviewId;
        const updatedReview = {
            reviewRating: ratingInput.value,
            reviewText: descriptionInput.value.trim(),
        };

        try {
            const response = await fetch(`/reviewedit/${reviewId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedReview),
            });

            const result = await response.json();

            if (response.ok) {
                alert("Review updated successfully!");
                window.location.href = `/${result.orgPage}`; // Redirect to org page
            } else {
                alert(result.error || "Failed to update review.");
            }
        } catch (error) {
            console.error("Error updating review:", error);
            alert("An error occurred while updating the review.");
        }
    });

    // Discard changes and go back
    document.getElementById("discardChanges").addEventListener("click", () => {
        window.history.back();
    });
});
