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
            // console.log("File converted to JSON:", jsonData);

            try {
                const icsContent = generateICS(jsonData);
                console.log("Generated ICS!!!:", icsContent);
                // To save as a file in a browser (if using a web app):
                const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'courses.ics';
                link.click();

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
function filterEnrolledCourses(data) {
    const enrolledSectionsIndex = data.findIndex(row => row.E === "Enrolled Sections");
    const droppedSectionsIndex = data.findIndex(row => row.E === "Dropped/Withdrawn Sections");

    // Extract rows between "Enrolled Sections" and "Dropped/Withdrawn Sections"
    const enrolledCourses = data.slice(enrolledSectionsIndex + 1, droppedSectionsIndex);

    // Filter only "Registered" courses
    return enrolledCourses.filter(row => row.I === "Registered");
}

function formatDate(serialDate) {
    const epoch = new Date(1899, 11, 30).getTime(); // Excel epoch (adjusted)
    const date = new Date(epoch + serialDate * 24 * 60 * 60 * 1000);
    return date.toISOString().split("T")[0]; // YYYY-MM-DD format
}

function createICSEvent(course) {
    const courseName = course.B;
    const meetingPattern = course.H.split('|').map(part => part.trim());
    const days = meetingPattern[0];
    const times = meetingPattern[1];
    const location = meetingPattern[2];
    const startDate = formatDate(course.K);
    const endDate = formatDate(course.L);

    const [startTime, endTime] = times.split('-').map(time => time.trim());
    const recurrenceRule = `RRULE:FREQ=WEEKLY;UNTIL=${endDate.replace(/-/g, '')}T235959Z;BYDAY=${days
        .split(' ')
        .map(day => {
            const dayMap = { M: 'MO', T: 'TU', W: 'WE', R: 'TH', F: 'FR', S: 'SA', U: 'SU' };
            return dayMap[day] || '';
        })
        .join(',')}`;

    const dtStart = `${startDate.replace(/-/g, '')}T${startTime.replace(':', '').padEnd(6, '0')}`;
    const dtEnd = `${startDate.replace(/-/g, '')}T${endTime.replace(':', '').padEnd(6, '0')}`;

    return `
BEGIN:VEVENT
SUMMARY:${courseName}
DESCRIPTION:Meeting at ${location}
DTSTART;TZID=America/New_York:${dtStart}
DTEND;TZID=America/New_York:${dtEnd}
${recurrenceRule}
LOCATION:${location}
END:VEVENT
`.trim();
}

function generateICS(data) {
    const enrolledCourses = filterEnrolledCourses(data);

    const events = enrolledCourses.map(createICSEvent);

    return `
BEGIN:VCALENDAR
VERSION:2.0
${events.join('\n')}
END:VCALENDAR
`.trim();
}
