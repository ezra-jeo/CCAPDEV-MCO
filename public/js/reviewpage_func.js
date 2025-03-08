document.addEventListener("DOMContentLoaded", () => {
    const stars = document.querySelectorAll(".star");
    const ratingInput = document.getElementById("rating");
    const reviewForm = document.getElementById("reviewForm");
    const descriptionInput = document.getElementById("description");
    const orgDropdown = document.getElementById("organization");

    // Get data from form attributes
    let orgName = reviewForm.dataset.orgname;
    let orgPage = reviewForm.dataset.orgpage;
    const userName = reviewForm.dataset.username || "Anonymous"; // Default to Anonymous if not logged in
    const userPage = reviewForm.dataset.userpage || ""; // Default to empty if not available
    const profileImage = reviewForm.dataset.userimage || "/images/default-icon-user.png";

    // Handle star rating selection
    stars.forEach((star) => {
        star.addEventListener("click", () => {
            const value = Number(star.getAttribute("data-value"));
            ratingInput.value = value;

            // Fix: Ensure correct star selection
            stars.forEach((s, index) => {
                s.classList.toggle("selected", index + 1 <= value);
            });
        });
    });

    // Form submission
    reviewForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // Prevent default form submission

        // If orgName is not set, get it from the dropdown
        if (!orgName && orgDropdown) {
            const selectedOption = orgDropdown.options[orgDropdown.selectedIndex];
            orgName = selectedOption.value;
            orgPage = selectedOption.value.toLowerCase();
        }

        const reviewData = {
            userName,
            userPage, 
            profileImage,
            reviewRating: ratingInput.value,
            reviewText: descriptionInput.value.trim(),
            orgName, 
            orgPage,
        };

        if (!reviewData.reviewRating || !reviewData.reviewText || !reviewData.orgName || !reviewData.orgPage) {
            alert("Please fill out all fields.");
            return;
        }

        try {
            const response = await fetch("/submit-review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(reviewData),
            });

            const result = await response.json();

            if (response.ok) {
                alert("Review submitted successfully!");
                window.location.href = `/${result.orgPage}`; // Redirect to org page
            } else {
                alert(result.error || "Failed to submit review.");
            }
        } catch (error) {
            console.error("Error submitting review:", error);
            alert("An error occurred while submitting the review.");
        }
    });

    // Discard changes and go back
    document.getElementById("discardChanges").addEventListener("click", () => {
        window.history.back();
    });
});
