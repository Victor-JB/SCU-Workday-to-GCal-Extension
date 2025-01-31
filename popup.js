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

            if (!isValidXlsx(jsonData)) {
                throw new Error("Invalid file format. Please upload a valid course schedule XLSX file.");
            }

            // Validate events before sending to background.js
            const events = parseJsonToGoogleEvents(jsonData).filter((event) => {
                try {
                    return validateEvent(event);
                } catch (error) {
                    console.error(`Error validating event: ${error.message}`, event);
                    return false; // Skip invalid events
                }
            });
            console.log(typeof event, "events:", events);

            // Send formatted events to background.js
            chrome.runtime.sendMessage(
                { action: "uploadEventsToGoogleCalendar", events },
                (response) => {
                    if (response.success) {
                        alert("Events uploaded successfully!");
                    } else {
                        console.error("Error uploading events:", response.error);
                        alert(`Failed to upload events: ${response.error}`);
                    }
                }
            );

        } catch (error) {
            console.error("Error processing file:", error);
            alert(error.message || "An error occurred while processing the file.");
        }
    });
});

// -------------------------------------------------------------------------- //
function validateEvent(event) {
    if (!event.summary || !event.start || !event.end) {
        throw new Error(`Invalid event format: Missing required fields (summary, start, end)`);
    }
    if (!event.start.dateTime || !event.start.timeZone) {
        throw new Error(`Invalid event start: ${JSON.stringify(event.start)}`);
    }
    if (!event.end.dateTime || !event.end.timeZone) {
        throw new Error(`Invalid event end: ${JSON.stringify(event.end)}`);
    }
    return true;
}


// -------------------------------------------------------------------------- //
// Validate if the JSON has the required structure
function isValidXlsx(jsonData) {
    const requiredHeaders = ["Course Listing", "Units", "Grading Basis", "Meeting Patterns"];
    return jsonData.some(row =>
        Object.values(row).some(value => requiredHeaders.includes(value))
    );
}

// -------------------------------------------------------------------------- //
// Takes protected xlsx file and still converts it to useable json format
async function convertXlsxToJson(file) {
    try {
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
    } catch (error) {
        alert("Error parsing the XLSX file. Please ensure it's in the correct format.")
        throw new Error("Error parsing the XLSX file. Please ensure it's in the correct format.");
    }
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

    // Parse time string (e.g., "9:15 AM" or "1:00 PM")
    const timeMatch = time.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
    if (!timeMatch) {
        throw new Error(`Invalid time format: ${time}`);
    }

    let [_, hour, minute, period] = timeMatch;
    hour = parseInt(hour, 10);
    minute = parseInt(minute, 10);

    // Convert to 24-hour format
    if (period.toUpperCase() === "PM" && hour !== 12) {
        hour += 12;
    } else if (period.toUpperCase() === "AM" && hour === 12) {
        hour = 0;
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
