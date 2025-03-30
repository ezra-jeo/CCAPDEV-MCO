document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".delete-review").forEach(button => {
        button.replaceWith(button.cloneNode(true));
    });

    document.querySelectorAll(".delete-review").forEach(button => {
        button.addEventListener("click", async function (event) {
            event.preventDefault();

            const reviewId = this.getAttribute("data-id");

            if (!confirm("Are you sure you want to delete this review?")) {
                return;
            }

            try {
                const response = await fetch(`/review/delete/${reviewId}`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" }
                });

                const data = await response.json();

                if (data.success) {
                    alert("Review deleted successfully!");

                    const reviewItem = this.closest(".review-item");
                    if (reviewItem) {
                        reviewItem.remove(); 
                    } else {
                        location.reload(); 
                    }
                } else {
                    alert(data.message);
                }
            } catch (error) {
                console.error("Error deleting review:", error);
                alert("Failed to delete review.");
            }
        });
    });
});