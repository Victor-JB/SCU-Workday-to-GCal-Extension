
/*
  Description: Js for the popup.html main popup window of the extension; handles dragging
  / file upload behavior of the app, and passes valid files back to content.js
  Author: vjoulinbatejat@scu.edu
  Date: Winter 2025
*/

// -------------------------------------------------------------------------- //
// Function to handle drag-over event
function handleDragOver(event) {
    event.preventDefault(); // Prevent default behavior
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy'; // Indicate that a copy operation is allowed
}

// -------------------------------------------------------------------------- //
// Function to convert and validate the uploaded `.xlsx` file
function validateXlsx(fileContent) {
    try {
        // Read the workbook from the binary string
        const workbook = XLSX.read(fileContent, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]]; // Assuming validation is for the first sheet
        const csvData = XLSX.utils.sheet_to_csv(sheet, { raw: false, defval: null });

        // Validate required headers
        const requiredHeaders = ["Course Listing", "Units", "Grading Basis", "Section", "Instructional Format", "Delivery Mode", "Meeting Patterns", "Registration Status", "Instructor", "Start Date", "End Date"];
        const firstRow = csvData.split("\n")[0]; // Get the header row
        const missingHeaders = requiredHeaders.filter(header => !firstRow.includes(header));
        if (missingHeaders.length > 0) {
            throw new Error(`Missing required fields: ${missingHeaders.join(", ")}`);
        }

        console.log("Validation successful, converting to JSON...");
        // Convert sheet data to JSON for further processing
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        return jsonData;
    } catch (error) {
        console.error("Error during validation:", error);
        throw error;
    }
}

// -------------------------------------------------------------------------- //
// Function to process the uploaded `.xlsx` file
function processXlsx(file) {
    const reader = new FileReader();
    // TODO: PROGRESS BAR / SOME SORT OF USER INDICATION
    reader.onload = (e) => {
        try {
            const fileContent = e.target.result;

            // Validate and convert the `.xlsx` file
            const validatedData = validateXlsx(fileContent);
            console.log("Validated Data:", validatedData);

            // Convert to ICS and send to content.js if validation succeeds
            chrome.runtime.sendMessage({ action: "fileUploaded", events: validatedData }, (response) => {
                console.log("Message sent to content.js, response:", response);
            });
        } catch (error) {
            alert(`Error processing file: ${error.message}`);
        }
    };
    reader.readAsBinaryString(file);
}

// -------------------------------------------------------------------------- //
// Function to handle file drop
function handleFileDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    const dropArea = document.getElementById("drop-area");
    dropArea.classList.remove("highlight");

    const files = event.dataTransfer.files;
    const validFiles = Array.from(files).filter(file => file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    if (validFiles.length === 0) {
        alert("Only .xlsx files are allowed!");
        return;
    }

    validFiles.forEach(file => {
        processXlsx(file);
    });
}

// -------------------------------------------------------------------------- //
// Add event listeners to the DOM
document.addEventListener("DOMContentLoaded", () => {
    const dropArea = document.getElementById("drop-area");
    if (dropArea) {
        dropArea.addEventListener("dragover", handleDragOver);
        dropArea.addEventListener("dragenter", () => dropArea.classList.add("highlight"));
        dropArea.addEventListener("dragleave", () => dropArea.classList.remove("highlight"));
        dropArea.addEventListener("drop", handleFileDrop);
    } else {
        console.error("Drop area not found!");
    }

    const fileInput = document.getElementById("fileInput");
    if (fileInput) {
        fileInput.addEventListener("change", (event) => {
            const file = event.target.files[0];
            if (file) {
                processXlsx(file);
            }
        });
    } else {
        console.error("File input element not found!");
    }
});
