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

        // Fetch auth token
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
            if (chrome.runtime.lastError || !token) {
                console.error("Error fetching auth token:", chrome.runtime.lastError);
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
                return;
            }

            console.log("Auth token received:", token);

            // Upload events to Google Calendar
            const uploadPromises = events.map((event) =>
                fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(event),
                })
                    .then((response) => {
                        if (!response.ok) {
                            throw new Error(`Failed to create event: ${response.statusText}`);
                        }
                        return response.json();
                    })
            );

            Promise.all(uploadPromises)
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
