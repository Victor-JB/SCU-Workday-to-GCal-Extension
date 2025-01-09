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

        // Simulate file processing with a timeout
        setTimeout(() => {
            processedCount++;
            const progressPercentage = Math.round((processedCount / validFiles.length) * 100);
            progressBar.style.width = `${progressPercentage}%`;
            progressBar.textContent = `${progressPercentage}%`;

            // Hide progress bar when done
            if (processedCount === validFiles.length) {
                setTimeout(() => {
                    progressContainer.style.display = 'none';
                    progressBar.style.width = '0%';
                    progressBar.textContent = '';
                }, 500);
            }
        }, 1000); // Simulate 1 second per file
    });

    processXlsxFile(validFiles[0]);
}

// Function to process the .xlsx file and convert it to .ics
async function processXlsxFile(file) {
    const reader = new FileReader();

    reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        // Assuming the first sheet contains the data
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert sheet to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (jsonData.length === 0) {
            alert("The file is empty or incorrectly formatted.");
            return;
        }

        // Extract relevant headers
        const headers = jsonData[0];
        const dataRows = jsonData.slice(1);

        // Find column indices
        const colIndex = (header) => headers.indexOf(header);
        const courseIndex = colIndex("Course");
        const patternIndex = colIndex("Meeting Pattern");
        const startDateIndex = colIndex("Start Date");
        const endDateIndex = colIndex("End Date");

        if (
            courseIndex === -1 ||
            patternIndex === -1 ||
            startDateIndex === -1 ||
            endDateIndex === -1
        ) {
            alert("Required columns not found in the file.");
            return;
        }

        // Process rows
        const events = dataRows.map((row) => {
            const course = row[courseIndex];
            const meetingPattern = row[patternIndex];
            const startDate = new Date(row[startDateIndex]);
            const endDate = new Date(row[endDateIndex]);

            const [days, timeWindow, location] = meetingPattern.split("|").map((s) => s.trim());

            const startTime = timeWindow.split("-")[0];
            const endTime = timeWindow.split("-")[1];

            return {
                summary: course,
                days,
                location,
                startDate,
                endDate,
                startTime,
                endTime,
            };
        });

        // Generate iCalendar file
        const icsContent = generateIcs(events);
        downloadIcsFile(icsContent, "courses.ics");
    };

    reader.readAsArrayBuffer(file);
}

// Function to generate .ics content
function generateIcs(events) {
    const daysMap = {
        M: "MO",
        T: "TU",
        W: "WE",
        R: "TH",
        F: "FR",
        S: "SA",
        U: "SU",
    };

    const padZero = (num) => (num < 10 ? "0" + num : num);

    const formatDateTime = (date, time) => {
        const year = date.getFullYear();
        const month = padZero(date.getMonth() + 1);
        const day = padZero(date.getDate());
        const [hours, minutes] = time.split(":").map((n) => padZero(n));
        return `${year}${month}${day}T${hours}${minutes}00`;
    };

    let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nCALSCALE:GREGORIAN\n";

    events.forEach((event) => {
        const { summary, days, location, startDate, endDate, startTime, endTime } = event;

        const rrule = `RRULE:FREQ=WEEKLY;BYDAY=${[...days].map((d) => daysMap[d]).join(",")};UNTIL=${formatDateTime(
            endDate,
            "23:59"
        )}`;

        ics += `BEGIN:VEVENT\nSUMMARY:${summary}\nLOCATION:${location}\nDTSTART:${formatDateTime(
            startDate,
            startTime
        )}\nDTEND:${formatDateTime(startDate, endTime)}\n${rrule}\nEND:VEVENT\n`;
    });

    ics += "END:VCALENDAR";
    return ics;
}

// Function to trigger download of the .ics file
function downloadIcsFile(content, filename) {
    const blob = new Blob([content], { type: "text/calendar" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
});
