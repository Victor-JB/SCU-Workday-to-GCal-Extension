
// -------------------------------------------------------------------------- //
// Function to handle drag-over event
function handleDragOver(event) {
    event.preventDefault(); // Prevent default behavior
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy'; // Indicate that a copy operation is allowed
}

// -------------------------------------------------------------------------- //
function validateXlsx(workbook) {
    if (!workbook.SheetNames.length) {
        throw new Error("Uploaded file has no sheets.");
    }

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    // const jsonData = XLSX.utils.sheet_to_json(sheet);

    alert("second instance in validate,", jsonData);
    console.log("here ye", jsonData)

    if (!jsonData || !jsonData.length) {
        throw new Error("Sheet is empty or not properly formatted.");
    }

    const requiredFields = ["Course Listing", "Meeting Patterns", "Instructor", "Start Date", "End Date"];
    const missingFields = requiredFields.filter(field => !Object.keys(jsonData[0]).includes(field));
    if (missingFields.length) {
        throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    }

    // return jsonData;
}

// -------------------------------------------------------------------------- //
// Function to validate and parse the uploaded workbook
function processXlsx(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const workbook = XLSX.read(e.target.result, { type: "binary" });
            alert("first instance in process, ", workbook);
            console.log("here ye", workbook)
            const jsonData = validateXlsx(workbook);

            // Send valid data to content.js
            chrome.runtime.sendMessage({ action: "fileUploaded", events: jsonData }, (response) => {
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

    const dropArea = document.getElementById('drop-area');
    dropArea.classList.remove('highlight');

    const files = event.dataTransfer.files;
    const validFiles = Array.from(files).filter(file => file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    if (validFiles.length === 0) {
        alert("Only .xlsx files are allowed!");
        return;
    }

    const progressBar = document.getElementById('progress-bar');
    const progressContainer = document.getElementById('progress-container');
    progressContainer.style.display = 'block'; // Show progress bar

    validFiles.forEach(file => {
        alert("going to process given file...");

        // Simulate file processing for progress bar
        setTimeout(() => {
            const progressPercentage = 100;
            progressBar.style.width = `${progressPercentage}%`;
            progressBar.textContent = `${progressPercentage}%`;

            setTimeout(() => {
                progressContainer.style.display = 'none';
                progressBar.style.width = '0%';
                progressBar.textContent = '';
            }, 500);
        }, 1000);

        processXlsx(file); // Use the shared function for processing

    });
}

// -------------------------------------------------------------------------- //
// Add event listeners to the DOM
document.addEventListener('DOMContentLoaded', () => {
    const dropArea = document.getElementById('drop-area');
    if (dropArea) {
        dropArea.addEventListener('dragover', handleDragOver);
        dropArea.addEventListener('dragenter', () => dropArea.classList.add('highlight'));
        dropArea.addEventListener('dragleave', () => dropArea.classList.remove('highlight'));
        dropArea.addEventListener('drop', handleFileDrop);
    } else {
        console.error("Drop area not found!");
    }

    const fileInput = document.getElementById("fileInput");
    alert("gonna do something with fileinput");
    if (fileInput) {
        fileInput.addEventListener("change", (event) => {
            const file = event.target.files[0];
            if (file) {
                alert("going to process given file...");
                processXlsx(file); // Use the shared function for processing
            }
        });
    } else {
        console.error("File input element not found!");
    }
});
