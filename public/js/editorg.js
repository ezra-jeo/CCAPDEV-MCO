document.addEventListener("DOMContentLoaded", () => {
    // Select form and description box elements
    const form = document.getElementById("edit-org-form");
    const descBox = document.getElementById("org-desc");

    // Event listener for form submission
    form.addEventListener("submit", async (event) => {
        event.preventDefault(); // Prevent default form submission behavior

        const formData = new FormData();
        formData.append("description", descBox.value); // Only send description

        try {
            // Send the form data using a POST request to the current page 
            const response = await fetch(window.location.pathname, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ description: descBox.value }), // Send JSON instead of FormData
            });

            const result = await response.json(); // Parse response as JSON

            if (response.ok) {
                alert("Organization updated successfully!");
                window.location.href = `/${result.orgPage}`; // Redirect to the organization's profile page
            } else {
                alert(result.error || "Failed to update organization.");
            }
        } catch (error) {
            console.error("Error updating organization:", error);
            alert("An error occurred while updating the organization.");
        }
    });
});
