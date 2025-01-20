
/* Todos: how to error check / monitor health of app once deployed, pythonanywhere script
to check if app is still working?? or Sentry? make sure it doesn't break...*/

console.log("Script loaded and running...");

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', afterDOMLoaded);
} else {
    afterDOMLoaded();
}

// -------------------------------------------------------------------------- //
// making sure button stays loaded on page regardless of any action
function afterDOMLoaded() {
    console.log("DOM is fully loaded, ready to interact with page elements");

    const observeTarget = document.body;

    const observer = new MutationObserver((mutations) => {
        const buttonBar = document.querySelector('ul[data-automation-id="buttonBar"]');
        if (buttonBar && !document.getElementById("wd-MultiParameterButton-56$newbutton")) {
            console.log("Button bar detected or re-rendered. Re-adding new button...");
            injectNewButton(buttonBar);
        }
    });

    try {
        observer.observe(observeTarget, {
            childList: true,
            subtree: true,
        });
        console.log("MutationObserver started.");
    } catch (error) {
        console.error("Failed to start the MutationObserver:", error);
    }
}

// -------------------------------------------------------------------------- //
function injectNewButton(buttonBar) {
    try {
        const newListItem = document.createElement("li");
        newListItem.className = "WBMM";

        const newButton = document.createElement("button");
        newButton.className = "WKTM WOTM WEAO WF5 WGSM";
        newButton.id = "wd-MultiParameterButton-56$newbutton"; // Unique ID
        newButton.setAttribute("data-automation-activebutton", "true");
        newButton.setAttribute("data-automation-id", "wd-MultiParameterButton");
        newButton.setAttribute("data-metadata-id", "56$newbutton");
        newButton.setAttribute("data-automation-button-type", "AUXILIARY");
        newButton.setAttribute("title", "Add to Google Calendar");
        newButton.setAttribute("type", "button");

        const span1 = document.createElement("span");
        span1.className = "WAUM WLTM";

        const span2 = document.createElement("span");
        span2.className = "WMTM";
        span2.setAttribute("title", "Add to Google Calendar");
        span2.textContent = "Add to Google Calendar"; // Button text

        newButton.appendChild(span1);
        newButton.appendChild(span2);

        newButton.addEventListener("click", handleDownloadClick);

        newListItem.appendChild(newButton);
        buttonBar.appendChild(newListItem);

        console.log("New download button successfully added!");
    } catch (error) {
        console.error("An error occurred while injecting the new button:", error);
    }
}

// -------------------------------------------------------------------------- //
/*
  When added workday button is clicked, file needs to be downloaded
*/
function handleDownloadClick() {
    console.log("Custom download button clicked. Searching for Excel button...");

    const excelButton = document.querySelector('div[data-automation-id="excelIconButton"]');

    if (excelButton) {
        console.log("Excel button found. Clicking to open popup...");
        excelButton.click();

        const popupObserver = new MutationObserver((mutations) => {
            const downloadButton = document.querySelector(
                'button[data-automation-id="uic_downloadButton"]'
            );

            if (downloadButton) {
                console.log("Download button found in popup. Clicking to download file...");
                popupObserver.disconnect(); // Stop observing once the button is found
                downloadButton.click(); // Simulate click to trigger the download

                // NEED TO CHECK WHEN DOWNLOAD IS FINISHED SO AS TO KNOW WHEN TO OPEN POPUP
                chrome.runtime.sendMessage({ action: "showPopup" });
            }
        });

        try {
            popupObserver.observe(document.body, {
                childList: true,
                subtree: true,
            });
            console.log("Popup observer started.");
        } catch (error) {
            console.error("Failed to start the popup observer:", error);
        }
    } else {
        console.error("Excel button not found. Ensure the correct page is loaded.");
    }
}

// -------------------------------------------------------------------------- //
/*
  To handle file upload message & file transfer in popup.js
*/
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "fileUploaded") {
        const { events } = message;
        console.log("Received events from popup.js:", events);

        // Process the events as needed or manipulate the DOM
        processEvents(events);

        sendResponse({ status: "success", message: "Events received and processed in content.js" });
    }
});

// -------------------------------------------------------------------------- //
function processEvents(events) {
    if (!events || !Array.isArray(events)) {
        console.error("Invalid events data received.");
        return;
    }

    const calendarEvents = events.map(event => {
        if (!event.summary || !event.start || !event.end) {
            console.error("Missing required fields in event:", event);
            return null;
        }

        return {
            summary: event.summary,
            location: event.location || "N/A",
            description: event.description || "No description provided.",
            start: { dateTime: new Date(event.start).toISOString(), timeZone: 'America/New_York' },
            end: { dateTime: new Date(event.end).toISOString(), timeZone: 'America/New_York' },
            // make sure is in student's valid timezone
        };
    }).filter(Boolean);

    if (calendarEvents.length === 0) {
        console.error("No valid events to process.");
        return;
    }

    sendToGoogleCalendar(calendarEvents);
}

// -------------------------------------------------------------------------- //
function parseExcelData(events_xlsx) {
    const sheetName = workbook.SheetNames[0]; // Assuming the first sheet contains the data
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet);

    // Convert data to Google Calendar-compatible ICS format
    return jsonData.map(row => ({
        summary: row["Course Title"], // Example column names
        location: row["Location"],
        description: row["Instructor"],
        start: new Date(row["Start Date"]),
        end: new Date(row["End Date"]),
    }));
}

// -------------------------------------------------------------------------- //
function sendToGoogleCalendar(events) {
    gapi.load('client:auth2', () => {
        gapi.client.init({
            apiKey: '<YOUR_API_KEY>',
            clientId: '<YOUR_CLIENT_ID>',
            discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
            scope: "https://www.googleapis.com/auth/calendar.events"
        }).then(() => {
            return gapi.auth2.getAuthInstance().signIn();
        }).then(() => {
            events.forEach(event => {
                gapi.client.calendar.events.insert({
                    calendarId: 'primary',
                    resource: event,
                }).then(response => {
                    console.log("Event created:", response);
                }).catch(err => {
                    console.error("Error creating event:", err.message);
                    alert(`Error creating event: ${event.summary}`);
                });
            });
        }).catch(err => {
            console.error("Google API Initialization Error:", err.message);
            alert("Failed to connect to Google Calendar. Please try again.");
        });
    });
}
