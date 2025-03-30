document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("edit-org-form");
    const descBox = document.getElementById("org-desc");
    const fileInput = document.getElementById("logo-upload");
    const previewImage = document.getElementById("preview-image");

    // Preview the uploaded image
    fileInput.addEventListener("change", () => {
        if (fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
            const maxSize = 5 * 1024 * 1024; // 5MB

            // Check file type
            if (!allowedTypes.includes(file.type)) {
                alert("Invalid image type. Only JPG, PNG, GIF, and WEBP are allowed.");
                fileInput.value = ""; // Reset input
                return;
            }

            // Check file size
            if (file.size > maxSize) {
                alert("Image size exceeds 5MB limit.");
                fileInput.value = ""; // Reset input
                return;
            }

            // Display preview
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImage.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!descBox.value.trim()) {
            alert("Please enter an organization description.");
            return;
        }

        const formData = new FormData();
        formData.append("description", descBox.value);

        if (fileInput.files.length > 0) {
            formData.append("orgPic", fileInput.files[0]); // Append the file
        }

        try {
            const response = await fetch(window.location.pathname, {
                method: "POST",
                body: formData, 
            });

            const result = await response.json();
            if (response.ok) {
                alert("Organization updated successfully!");
                window.location.href = `/${result.orgPage}`;
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
