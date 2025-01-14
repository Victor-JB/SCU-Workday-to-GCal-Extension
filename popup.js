
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

        // Select the sheet by name or fallback to the first sheet
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) throw new Error(`Sheet "${sheetName}" not found in the workbook.`);

        // Validate sheet range
        const range = XLSX.utils.decode_range(sheet["!ref"]);
        if (!range) throw new Error("Sheet is empty or has no valid range.");

        console.log("Sheet Range:", range);

        // Define required headers
        const requiredHeaders = [
            "Course Listing", "Units", "Grading Basis", "Section", "Instructional Format",
            "Delivery Mode", "Meeting Patterns", "Registration Status", "Instructor",
            "Start Date", "End Date"
        ];

        // Row where the headers are expected to start (adjust for your sheet structure)
        const headerStartRow = 5; // 0-based index, so row 6 is index 5

        // Extract and validate headers from the specified row
        const extractedHeaders = [];
        for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: headerStartRow, c: col });
            const cell = sheet[cellAddress];
            extractedHeaders.push(cell ? String(cell.v).trim() : null);
        }

        console.log("Extracted Headers:", extractedHeaders);

        // Validate headers
        const missingHeaders = requiredHeaders.filter(
            header => !extractedHeaders.map(h => h && h.toLowerCase()).includes(header.toLowerCase())
        );
        if (missingHeaders.length > 0) {
            throw new Error(`Missing required headers: ${missingHeaders.join(", ")}`);
        }

        console.log("All required headers found!");

        // Extract data rows starting from the next row after headers
        const jsonData = [];
        for (let row = headerStartRow + 1; row <= range.e.r; row++) {
            const rowData = {};
            let isEmptyRow = true;

            requiredHeaders.forEach((header, index) => {
                const col = extractedHeaders.findIndex(h => h && h.toLowerCase() === header.toLowerCase());
                if (col !== -1) {
                    const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                    const cell = sheet[cellAddress];
                    const cellValue = cell ? String(cell.v).trim() : null;
                    rowData[header] = cellValue;
                    if (cellValue) isEmptyRow = false;
                }
            });

            if (!isEmptyRow) jsonData.push(rowData);
        }

        console.log("Extracted JSON Data:", jsonData);

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

            console.log("just basic file content, first step: ", fileContent);

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
