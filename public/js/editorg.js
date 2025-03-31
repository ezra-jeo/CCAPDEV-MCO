document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("edit-org-form");
    const descBox = document.getElementById("org-desc");
    const urlInput = document.getElementById("logo-url");
    const previewImage = document.getElementById("preview-image");

    // Update preview image when URL is typed
    urlInput.addEventListener("input", () => {
        previewImage.src = urlInput.value;
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        // Validate input
        if (!descBox.value.trim() || !urlInput.value.trim()) {
            alert("Both description and image URL are required.");
            return;
        }

        const formData = {
            orgDesc: descBox.value,
            orgPic: urlInput.value, 
        };

        try {
            const response = await fetch(window.location.pathname, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(formData),
            });

            const result = await response.json();
            if (response.ok) {
                alert("Organization updated successfully!");
                window.location.href = `/orgpage/${result.orgPage}`; // Redirect to org page
            } else {
                alert(result.error || "Failed to update organization.");
            }
        } catch (error) {
            console.error("Error updating organization:", error);
            alert("An error occurred while updating the organization.");
        }
    });

    document.getElementById("discardChanges").addEventListener("click", () => {
        window.history.back();
    });
});
