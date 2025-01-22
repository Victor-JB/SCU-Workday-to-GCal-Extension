document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("fileUpload").addEventListener("change", async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const jsonData = await convertXlsxToJson(file);
            const events = parseJsonToGoogleEvents(jsonData);

            // Upload events to Google Calendar
            uploadToGoogleCalendar(events);
        } catch (error) {
            console.error("Error processing file:", error);
            alert("An error occurred while processing the file.");
        }
    });
});

function parseJsonToGoogleEvents(jsonData) {
    const enrolledSectionsIndex = jsonData.findIndex(row => row.E === "Enrolled Sections");
    const droppedSectionsIndex = jsonData.findIndex(row => row.E === "Dropped/Withdrawn Sections");

    const enrolledCourses = jsonData
        .slice(enrolledSectionsIndex + 1, droppedSectionsIndex)
        .filter(row => row.I === "Registered");

    return enrolledCourses.map(course => {
        const title = course.B;
        const meetingPattern = course.H.split('|').map(part => part.trim());
        const days = meetingPattern[0];
        const times = meetingPattern[1];
        const location = meetingPattern[2];
        const [startTime, endTime] = times.split('-').map(time => time.trim());
        const startDate = formatGoogleDate(course.K, startTime);
        const endDate = formatGoogleDate(course.K, endTime);

        return {
            summary: title,
            location,
            description: `Instructor: ${course.J}`,
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
    });
}

function formatGoogleDate(serialDate, time) {
    const epoch = new Date(1899, 11, 30).getTime(); // Excel epoch
    const date = new Date(epoch + serialDate * 24 * 60 * 60 * 1000);
    const [hour, minute] = time.split(':').map(Number);
    date.setHours(hour, minute, 0, 0);
    return date.toISOString();
}

function formatEndDate(serialDate) {
    const epoch = new Date(1899, 11, 30).getTime();
    const date = new Date(epoch + serialDate * 24 * 60 * 60 * 1000);
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function mapDaysToGoogle(days) {
    const dayMap = { M: 'MO', T: 'TU', W: 'WE', R: 'TH', F: 'FR', S: 'SA', U: 'SU' };
    return days.split(' ').map(day => dayMap[day]).join(',');
}

function uploadToGoogleCalendar(events) {
    gapi.load("client:auth2", () => {
        gapi.client
            .init({
                apiKey: "<YOUR_API_KEY>",
                clientId: "<YOUR_CLIENT_ID>",
                discoveryDocs: [
                    "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"
                ],
                scope: "https://www.googleapis.com/auth/calendar.events"
            })
            .then(() => gapi.auth2.getAuthInstance().signIn())
            .then(() => {
                events.forEach(event => {
                    gapi.client.calendar.events
                        .insert({
                            calendarId: "primary",
                            resource: event
                        })
                        .then(response => {
                            console.log("Event created:", response);
                        })
                        .catch(error => {
                            console.error("Error creating event:", error);
                        });
                });
            })
            .catch(error => {
                console.error("Google API Initialization Error:", error);
            });
    });
}

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
