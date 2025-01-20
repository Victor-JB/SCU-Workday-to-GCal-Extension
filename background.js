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
    if (message.action === "processJson") {
        const { events } = message;
        console.log("Received events from popup.js:", events);


        sendResponse({ status: "success", message: "Events received and processed in content.js" });
    }
});

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
