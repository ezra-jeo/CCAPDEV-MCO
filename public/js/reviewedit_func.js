document.addEventListener("DOMContentLoaded", () => {
    const stars = document.querySelectorAll(".star");
    const ratingInput = document.getElementById("rating");
    const reviewForm = document.getElementById("editReviewForm");
    const descriptionInput = document.getElementById("description");
    const originalText = descriptionInput.value.trim();
    let selectedRating = parseInt(ratingInput.value, 10); 
    const originalRating = selectedRating;

    // Pre-fill stars based on existing rating
    function updateStarSelection(rating) {
        stars.forEach((star) => {
            const value = parseInt(star.getAttribute("data-value"), 10);
            star.classList.toggle("selected", value <= rating);
        });
    }
    updateStarSelection(selectedRating);

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
        const updatedReviewText = descriptionInput.value.trim();
        const updatedRating = parseInt(ratingInput.value, 10);

        // Prevent submission if no changes
        if (updatedReviewText === originalText && updatedRating === originalRating) {
            alert("No changes detected. Please modify your review before submitting.");
            return;
        }

        if (!updatedReviewText) {
            alert("Please enter a review description before submitting.");
            return;
        }

        try {
            const response = await fetch(`/reviewedit/${reviewId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({reviewRating: updatedRating, reviewText: updatedReviewText}),
            });

            const result = await response.json();

            if (response.ok) {
                alert("Review updated successfully!");
                window.location.href = `/orgpage/${result.orgPage}`; // Redirect to org page
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
