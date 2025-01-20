/*
  Description: JS for the popup.html main popup window of the extension; handles dragging
  / file upload behavior of the app, and passes valid files back to content.js
  Author: vjoulinbatejat@scu.edu
  Date: Winter 2025
*/

console.log("XLSX version:", XLSX.version);

// -------------------------------------------------------------------------- //
// Function to handle drag-over event
function handleDragOver(event) {
    event.preventDefault(); // Prevent default behavior
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy"; // Indicate that a copy operation is allowed
}

// -------------------------------------------------------------------------- //
// Function to process the uploaded `.xlsx` file and convert it to JSON
async function processXlsx(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });

            // Assuming the first sheet contains the data
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Convert the sheet to JSON
            const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            // Display the JSON or pass it to the next process
            console.log("Converted JSON:", json);
            alert("File processed successfully!");

            // Optional: You can also pass this JSON to content.js or handle it further
        } catch (error) {
            console.error("Error processing the file:", error);
            alert("An error occurred while processing the file. Please try again.");
        }
    };

    reader.onerror = () => {
        console.error("Error reading the file.");
        alert("Could not read the file. Please try again.");
    };

    reader.readAsArrayBuffer(file); // Read the file as ArrayBuffer
}

// -------------------------------------------------------------------------- //
// Function to handle file drop
function handleFileDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    const dropArea = document.getElementById("drop-area");
    dropArea.classList.remove("highlight");

    const files = event.dataTransfer.files;
    const validFiles = Array.from(files).filter(
        (file) =>
            file.type ===
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    if (validFiles.length === 0) {
        alert("Only .xlsx files are allowed!");
        return;
    }

    validFiles.forEach((file) => {
        processXlsx(file);
    });
}

// -------------------------------------------------------------------------- //
// Add event listeners to the DOM
document.addEventListener("DOMContentLoaded", () => {
    const dropArea = document.getElementById("drop-area");
    if (dropArea) {
        dropArea.addEventListener("dragover", handleDragOver);
        dropArea.addEventListener("dragenter", () =>
            dropArea.classList.add("highlight")
        );
        dropArea.addEventListener("dragleave", () =>
            dropArea.classList.remove("highlight")
        );
        dropArea.addEventListener("drop", handleFileDrop);
    } else {
        console.error("Drop area not found!");
    }

    const fileInput = document.getElementById("fileInput");
    if (file
