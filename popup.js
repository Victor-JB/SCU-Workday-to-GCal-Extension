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
            const jsonData = await convertXlsxToJson(file);

            const events = parseJsonToGoogleEvents(jsonData);
            console.log("The parsed events", events);

            // Send formatted events to background.js
            chrome.runtime.sendMessage(
                { action: "uploadEventsToGoogleCalendar", events },
                (response) => {
                    if (response.success) {
                        alert("Events uploaded successfully!");
                    } else {
                        console.error("Error uploading events:", response.error);
                        alert("Failed to upload events.");
                    }
                }
            );
        } catch (error) {
            console.error("Error processing file:", error);
            alert("An error occurred while processing the file.");
        }
    });
});

// -------------------------------------------------------------------------- //
// Takes protected xlsx file and still converts it to useable json format
async function convertXlsxToJson(file) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rows = [];
    Object.keys(sheet).forEach(key => {
        if (!key.startsWith("!")) {
            const cell = sheet[key];
            const match = key.match(/([A-Z]+)(\d+)/);
            if (match) {
                const col = match[1];
                const row = parseInt(match[2], 10);

                if (!rows[row - 1]) rows[row - 1] = {};
                rows[row - 1][col] = cell.v;
            }
        }
    });
    return rows.filter(row => row);
}

// -------------------------------------------------------------------------- //
function parseJsonToGoogleEvents(jsonData) {
    const enrolledSectionsIndex = jsonData.findIndex(row => row.E === "Enrolled Sections");
    const droppedSectionsIndex = jsonData.findIndex(row => row.E === "Dropped/Withdrawn Sections");

    const enrolledCourses = jsonData
        .slice(enrolledSectionsIndex + 1, droppedSectionsIndex)
        .filter(row => row.I === "Registered");

    return enrolledCourses.map(course => {
        try {
            const title = course.B || "Untitled Course";
            const meetingPattern = (course.H || "").split('|').map(part => part.trim());
            const days = meetingPattern[0] || "";
            const times = meetingPattern[1] || "";
            const location = meetingPattern[2] || "Location TBD";
            const [startTime, endTime] = times.split('-').map(time => time.trim());
            const startDate = formatGoogleDate(course.K, startTime);
            const endDate = formatGoogleDate(course.K, endTime);

            return {
                summary: title,
                location,
                description: `Instructor: ${course.J || "Unknown"}`,
                start: {
                    dateTime: startDate,
                    timeZone: "America/New_York"
                },
                end: {
                    dateTime: endDate,
                    timeZone: "America/New_York"
                },
                recurrence: [
                    `RRULE:FREQ=WEEKLY;UNTIL=${formatEndDate(course.L)};BYDAY=${mapDaysToGoogle(days)}`
                ]
            };
        } catch (error) {
            console.error(`Error parsing course: ${course.B}`, error);
            return null; // Skip invalid courses
        }
    }).filter(event => event !== null); // Remove invalid events
}


// -------------------------------------------------------------------------- //
function formatGoogleDate(serialDate, time) {
    console.log("serialDate:", serialDate, "time:", time);

    const epoch = new Date(1899, 11, 30).getTime(); // Excel epoch
    const date = new Date(epoch + serialDate * 24 * 60 * 60 * 1000);

    if (isNaN(date.getTime())) {
        throw new Error(`Invalid date derived from serialDate: ${serialDate}`);
    }

    const [hour, minute] = time.split(':').map(Number);
    if (isNaN(hour) || isNaN(minute)) {
        throw new Error(`Invalid time format: ${time}`);
    }

    date.setHours(hour, minute, 0, 0);

    return date.toISOString();
}

// -------------------------------------------------------------------------- //
function formatEndDate(serialDate) {
    const epoch = new Date(1899, 11, 30).getTime();
    const date = new Date(epoch + serialDate * 24 * 60 * 60 * 1000);
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

// -------------------------------------------------------------------------- //
function mapDaysToGoogle(days) {
    const dayMap = { M: 'MO', T: 'TU', W: 'WE', R: 'TH', F: 'FR', S: 'SA', U: 'SU' };
    return days.split(' ').map(day => dayMap[day]).join(',');
}
