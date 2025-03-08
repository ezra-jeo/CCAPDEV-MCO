document.addEventListener("DOMContentLoaded", () => {
    // Select form and input elements
    const form = document.getElementById("edit-org-form");
    const logoInput = document.getElementById("logo-upload");
    const orgProfilePic = document.querySelector(".org-profile-pic");
    const descBox = document.getElementById("org-desc");

    // Event listener for logo file input change
    logoInput.addEventListener("change", (event) => {
        const file = event.target.files[0]; // Get selected file
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                orgProfilePic.src = e.target.result; // Set image preview source to the uploaded file
            };
            reader.readAsDataURL(file); 
        }
    });

    // Event listener for form submission
    form.addEventListener("submit", async (event) => {
        event.preventDefault(); // Prevent default form submission behavior
    
        const formData = new FormData(form); // Create a FormData object to send form data
        formData.append("description", descBox.value); // Ensure description is included in FormData
    
        try {
            // Send the form data using a POST request to the current page 
            const response = await fetch(window.location.pathname, {
                method: "POST",
                body: formData,
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