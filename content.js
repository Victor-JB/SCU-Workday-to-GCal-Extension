
/* Todos: how to error check / monitor health of app once deployed, pythonanywhere script
to check if app is still working?? or Sentry? make sure it doesn't break...*/

console.log("Script loaded and running...");

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', afterDOMLoaded);
} else {
    afterDOMLoaded();
}

// -------------------------------------------------------------------------- //
// Initialization
function afterDOMLoaded() {
    console.log("DOM is fully loaded, ready to interact with page elements");

    // Inject fallback CSS
    injectFallbackCSS();

    const bar = injectBackupBar();
    if (!bar) {
      chrome.runtime.sendMessage({ action: "showPopup" });
    }

    // Monitor DOM changes
    monitorDOMChanges();
}

// -------------------------------------------------------------------------- //
// Function to find an element by attribute and value
function findElementByAttribute(attribute, value, root = document) {
    return root.querySelector(`[${attribute}="${value}"]`);
}

// -------------------------------------------------------------------------- //
// Function to add a MutationObserver for dynamic DOM updates
function monitorDOMChanges() {
  const observeTarget = document.body;
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        // Recheck and inject the button if necessary
        const buttonBar = findElementByAttribute('data-automation-id', 'buttonBar');
        const customBar = document.getElementById("custom-bar");

        if (buttonBar) {
          if (customBar) {
              // Hide the custom bar if the button is found
              customBar.remove();
              console.log("Button found, hiding custom bar.");
          }

            console.log("Button bar found or re-rendered. Ensuring new button is present...");
            if (!document.getElementById("wd-MultiParameterButton-56$newbutton")) {
                injectNewButton(buttonBar);
            }
        } else if (customBar) {
            // Handle missing buttonBar by injecting a fallback button
            console.warn("buttonBar not found. Displaying fallback button if possible...");
            customBar.classList.add("visible");
        } else {
          console.error("Neither button bar nor custom bar was found...");
        }
      }
    });
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
// Function to dynamically inject a button into a button bar
function injectNewButton(buttonBar) {
    try {
        // Clone an existing button to ensure style and structure match
        const existingButton = buttonBar.querySelector('button');
        if (!existingButton) throw new Error("No existing button found!");

        // Clone the existing button
        const newButton = existingButton.cloneNode(true);

        // Update the cloned button's attributes
        newButton.id = "wd-MultiParameterButton-56$newbutton";
        newButton.title = "Add to Google Calendar";
        newButton.querySelector('span:last-child').textContent = "Add to Google Calendar";

        // Add a click event listener to the new button
        newButton.addEventListener("click", handleDownloadClick);

        // Create a new list item to wrap the button
        const newListItem = document.createElement("li");
        newListItem.className = existingButton.closest('li').className;
        newListItem.appendChild(newButton);

        // Append the new list item to the button bar
        buttonBar.appendChild(newListItem);

        console.log("New button successfully added!");
    } catch (error) {
        console.error("Error injecting new button:", error);
    }
}

// -------------------------------------------------------------------------- //
function injectBackupBar() {
    try {
        // Locate the app bar container
        const appBarContainer = document.getElementById("app-chrome-container");
        if (!appBarContainer) {
            console.warn("App bar container not found.");
            return;
        }

        // Check if the bar already exists
        let newBar = document.getElementById("custom-bar");
        if (!newBar) {
            // Create the bar if it doesn't exist
            newBar = document.createElement("div");
            newBar.id = "custom-bar";
            newBar.textContent = "Custom Bar - Button Missing"; // Placeholder text
            appBarContainer.parentNode.insertBefore(newBar, appBarContainer.nextSibling);
            console.log("Custom bar injected below the app bar.");
        }

        return newBar;
    } catch (error) {
        console.error("Error injecting the custom bar:", error);
    }
}

// -------------------------------------------------------------------------- //
// Function to inject fallback CSS
function injectFallbackCSS() {
    const style = document.createElement("style");
    style.textContent = `
        #custom-bar {
            position: relative;
            width: 100%;
            height: 50px;
            background-color: #f8f9fa;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999;
            color: #333;
            font-size: 16px;
            visibility: hidden; /* Initially hidden */
        }
        #custom-bar.visible {
            visibility: visible; /* Make the bar visible when needed */
        }
    `;
    document.head.appendChild(style);
    console.log("Fallback CSS injected.");
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
