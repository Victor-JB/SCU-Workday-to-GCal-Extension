// Function to handle drag-over event
function handleDragOver(event) {
    event.preventDefault(); // Prevent default behavior
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy'; // Indicate that a copy operation is allowed
}

// Function to handle file drop
function handleFileDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    const dropArea = document.getElementById('drop-area');
    dropArea.classList.remove('highlight'); // Remove highlight class

    const files = event.dataTransfer.files; // Get the files dropped
    const validFiles = Array.from(files).filter(file => file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    if (validFiles.length === 0) {
        alert("Only .xlsx files are allowed!");
        return;
    }

    const progressBar = document.getElementById('progress-bar');
    const progressContainer = document.getElementById('progress-container');
    progressContainer.style.display = 'block'; // Show progress bar

    let processedCount = 0;
    validFiles.forEach(file => {
        console.log(`Processing file: ${file.name}`);

        const reader = new FileReader();
        reader.onload = (e) => {
            const events_xlsx = XLSX.read(e.target.result, { type: "binary" });
            console.log("Workbook parsed:", events_xlsx);

            // Send data to content.js
            chrome.runtime.sendMessage({ action: "fileUploaded", events_xlsx}, (response) => {
                console.log("Message sent to content.js, response:", response);
            });
        };

        reader.readAsBinaryString(file);

        // Simulate file processing for progress bar
        setTimeout(() => {
            processedCount++;
            const progressPercentage = Math.round((processedCount / validFiles.length) * 100);
            progressBar.style.width = `${progressPercentage}%`;
            progressBar.textContent = `${progressPercentage}%`;

            if (processedCount === validFiles.length) {
                setTimeout(() => {
                    progressContainer.style.display = 'none';
                    progressBar.style.width = '0%';
                    progressBar.textContent = '';
                }, 500);
            }
        }, 1000);
    });
}

// Add event listeners to the drop area
document.addEventListener('DOMContentLoaded', () => {
    const dropArea = document.getElementById('drop-area');
    if (dropArea) {
        dropArea.addEventListener('dragover', handleDragOver);
        dropArea.addEventListener('dragenter', () => dropArea.classList.add('highlight')); // Highlight on dragenter
        dropArea.addEventListener('dragleave', () => dropArea.classList.remove('highlight')); // Remove highlight on dragleave
        dropArea.addEventListener('drop', handleFileDrop);
    } else {
        console.error("Drop area not found!");
    }

    const fileInput = document.getElementById("fileInput");
    if (fileInput) {
        fileInput.addEventListener("change", (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const events_xlsx = XLSX.read(e.target.result, { type: "binary" });
                    console.log("Workbook parsed:", events_xlsx);

                    // Send data to content.js
                    chrome.runtime.sendMessage({ action: "fileUploaded", events_xlsx }, (response) => {
                        console.log("Message sent to content.js, response:", response);
                    });
                };
                reader.readAsBinaryString(file);
            }
        });
    } else {
        console.error("File input element not found!");
    }
});
