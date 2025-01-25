chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "showPopup") {
    chrome.action.openPopup();
  }
});

// -------------------------------------------------------------------------- //
/*
  To handle file upload message & file transfer in popup.js
*/
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "uploadEventsToGoogleCalendar") {
        const { events } = message;

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
                    const promises = events.map(event =>
                        gapi.client.calendar.events.insert({
                            calendarId: "primary",
                            resource: event
                        })
                    );

                    return Promise.all(promises);
                })
                .then(() => {
                    console.log("All events uploaded successfully.");
                    sendResponse({ success: true });
                })
                .catch(error => {
                    if (error.status === 401) {
                        console.error("Token expired. Please reauthenticate.");
                        sendResponse({ success: false, error: "Authentication required. Please sign in again." });
                    } else if (error.status === 400) {
                        console.error("Invalid event data:", error.result.error.message);
                        sendResponse({ success: false, error: `Invalid event data: ${error.result.error.message}` });
                    } else {
                        console.error("Failed to upload events:", error);
                        sendResponse({ success: false, error: "Failed to upload events. Please try again." });
                    }
                });
        });

        // Keep the message channel open for async response
        return true;
    }
});
