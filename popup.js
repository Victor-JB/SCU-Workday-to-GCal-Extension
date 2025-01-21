/*
  Description: JS for the popup.html main popup window of the extension; handles dragging
  / file upload behavior of the app, and passes valid files back to content.js
  Author: vjoulinbatejat@scu.edu
  Date: Winter 2025
*/

console.log("XLSX version:", XLSX.version);

// -------------------------------------------------------------------------- //
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("fileUpload").addEventListener("change", async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            // Convert the file to JSON
            const jsonData = await convertXlsxToJson(file);
            console.log("File converted to JSON:", jsonData);

            try {
                const formatted_ics = processCourses(jsonData);
            } catch (parseError) {
                console.error("Error parsing JSON:", parseError);
                return;
            }

            // Send JSON to background.js
            chrome.runtime.sendMessage({ action: "processJson", data: jsonData }, (response) => {
                if (response.success) {
                    alert("Calendar events uploaded successfully!");
                } else {
                    console.error("Error uploading events:", response.error);
                    alert("Failed to upload events.");
                }
            });

        } catch (error) {
            console.error("Error processing file:", error);
            alert("An error occurred while processing the file.");
        }
    });
});

// -------------------------------------------------------------------------- //
// Function to convert XLSX to JSON manually for protected sheets
async function convertXlsxToJson(file) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    console.log("Sheet name:", sheetName);
    console.log("Sheet range:", sheet['!ref']);
    console.log("Raw sheet content:", sheet);

    const rows = [];

    // Iterate through all keys in the sheet
    Object.keys(sheet).forEach((key) => {
        if (!key.startsWith('!')) { // Ignore metadata keys like !ref, !merges
            const cell = sheet[key];
            const match = key.match(/([A-Z]+)(\d+)/); // Extract column and row
            if (match) {
                const col = match[1];
                const row = parseInt(match[2], 10);

                if (!rows[row - 1]) rows[row - 1] = {}; // Create row if not exists
                rows[row - 1][col] = cell.v; // Add cell value to the appropriate column
            }
        }
    });

    console.log("Manually extracted rows:", rows);
    return rows.filter((row) => row); // Filter out empty rows
}

// -------------------------------------------------------------------------- //
// Helper function to format date into ICS-friendly format
function formatTime(dateString, timeString) {
    const [hour, minute] = timeString.split(':').map((t) => parseInt(t, 10));
    const date = new Date(dateString);
    date.setHours(hour, minute, 0, 0);
    return date.toISOString().replace(/[-:]/g, '').split('.')[0];
}

// Helper function to map day abbreviations for ICS recurrence rules
function mapDaysToICS(days) {
    const dayMap = { M: 'MO', T: 'TU', W: 'WE', R: 'TH', F: 'FR', S: 'SA', U: 'SU' };
    return days.split(' ').map((day) => dayMap[day]).join(',');
}

// Helper function to create ICS event format
function createICSEvent(course, timeLocation, startDate, endDate) {
    const [days, times, location] = timeLocation.split('|').map((part) => part.trim());
    const [startTime, endTime] = times.split('-').map((time) => time.trim());

    const dtStart = formatTime(startDate, startTime);
    const dtEnd = formatTime(startDate, endTime);
    const recurrenceRule = `RRULE:FREQ=WEEKLY;UNTIL=${endDate.replace(/-/g, '')}T235959Z;BYDAY=${mapDaysToICS(days)}`;

    return `
BEGIN:VEVENT
SUMMARY:${course}
DESCRIPTION:Meeting at ${location}
DTSTART;TZID=America/New_York:${dtStart}
DTEND;TZID=America/New_York:${dtEnd}
${recurrenceRule}
LOCATION:${location}
END:VEVENT
`.trim();
}

// -------------------------------------------------------------------------- //
// Main function to process the JSON and create ICS file
function processCourses(rows) {
    const events = [];

    rows.forEach((row) => {
        const course = row.col1; // Adjust column index based on your data
        const timeLocation = row.col7; // Adjust column index based on your data
        const startDate = row.col10; // Adjust column index based on your data
        const endDate = row.col11; // Adjust column index based on your data

        if (course && timeLocation && startDate && endDate) {
            const event = createICSEvent(course, timeLocation, startDate, endDate);
            events.push(event);
        }
    });

    const icsContent = `
BEGIN:VCALENDAR
VERSION:2.0
${events.join('\n')}
END:VCALENDAR
`.trim();

    console.log('ICS generated:', icsContent);
    return icsContent;
}
