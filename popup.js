
/*
  Description: Js for the popup.html main popup window of the extension; handles dragging
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
    event.dataTransfer.dropEffect = 'copy'; // Indicate that a copy operation is allowed
}

// -------------------------------------------------------------------------- //
// Function to process the uploaded `.xlsx` file
function processXlsx(file) {
  

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
