
document.addEventListener("click", async function (event) {
    const deleteButton = event.target.closest(".delete-review");

    if (!deleteButton) return;
    event.stopImmediatePropagation();
    event.preventDefault();

    const reviewId = event.target.closest(".delete-review").dataset.id;

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

            const reviewItem = event.target.closest(".review-item");
            if (reviewItem) {
                reviewItem.remove(); 
            } else {
                location.reload(); 
            }
        } else {
            alert(data.message);
        }    
    } 
    catch (error) {
        console.error("Error deleting review:", error);
        alert("Failed to delete review.");
    }
    
});