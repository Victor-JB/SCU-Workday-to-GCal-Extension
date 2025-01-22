/*
  Description: JS for the popup.html main popup window of the extension; handles dragging
  / file upload behavior of the app, and passes valid files back to content.js
  Author: vjoulinbatejat@scu.edu
  Date: Winter 2025
*/

console.log("XLSX version:", XLSX.version);
const cal = new ics(); // initializing ics package instance

// -------------------------------------------------------------------------- //
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("fileUpload").addEventListener("change", async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            // Convert the file to JSON
            const jsonData = await convertXlsxToJson(file);
            // console.log("File converted to JSON:", jsonData);

            try {
                // Generate ICS content as a string
                const formatted_events = parseJsonToIcsEvents(jsonData);
                console.log("Generated ICS!!!:", formatted_events);

                const icsContent = cal.build();

                // Use the ICS content for further processing
                console.log("Generated ICS Content:", icsContent);

                const link = document.createElement('a');
                link.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(icsContent);
                link.download = 'courses.ics';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);


            } catch (parseError) {
                console.error("Error parsing JSON:", parseError);
                return;
            }

            // Send JSON to background.js
            chrome.runtime.sendMessage({ action: "processJson", data: icsContent }, (response) => {
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

    // console.log("Sheet name:", sheetName);
    // console.log("Sheet range:", sheet['!ref']);
    // console.log("Raw sheet content:", sheet);

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
function parseJsonToIcsEvents(jsonData) {
    const enrolledSectionsIndex = jsonData.findIndex(row => row.E === "Enrolled Sections");
    const droppedSectionsIndex = jsonData.findIndex(row => row.E === "Dropped/Withdrawn Sections");

    const enrolledCourses = jsonData
        .slice(enrolledSectionsIndex + 1, droppedSectionsIndex)
        .filter(row => row.I === "Registered");

    return enrolledCourses.forEach(course => {
        const title = course.B;
        const meetingPattern = course.H.split('|').map(part => part.trim());
        const days = meetingPattern[0];
        const times = meetingPattern[1];
        const location = meetingPattern[2];
        const [startTime, endTime] = times.split('-').map(time => time.trim());
        const startDate = formatDateArray(course.K, startTime);
        const endDate = formatDateArray(course.K, endTime);

        const recurrenceRule = `FREQ=WEEKLY;UNTIL=${formatEndDate(course.L)};BYDAY=${mapDaysToIcs(days)}`;

        cal.addEvent(title, `Instructor: ${course.J}`, location, startDate, endDate, { rrule: recurrenceRule });
    });
}

// -------------------------------------------------------------------------- //
function formatDateArray(serialDate, time) {
    const epoch = new Date(1899, 11, 30).getTime(); // Excel epoch
    const date = new Date(epoch + serialDate * 24 * 60 * 60 * 1000);
    const [hour, minute] = time.split(':').map(Number);
    return [date.getFullYear(), date.getMonth() + 1, date.getDate(), hour, minute];
}

// -------------------------------------------------------------------------- //
function formatEndDate(serialDate) {
    const epoch = new Date(1899, 11, 30).getTime();
    const date = new Date(epoch + serialDate * 24 * 60 * 60 * 1000);
    return date.toISOString().replace(/-/g, '').split('T')[0] + 'T235959Z';
}

// -------------------------------------------------------------------------- //
function mapDaysToIcs(days) {
    const dayMap = { M: 'MO', T: 'TU', W: 'WE', R: 'TH', F: 'FR', S: 'SA', U: 'SU' };
    return days.split(' ').map(day => dayMap[day]).join(',');
}
