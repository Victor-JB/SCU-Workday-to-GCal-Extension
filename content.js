
/* Todos: how to error check / monitor health of app once deployed, pythonanywhere script
to check if app is still working?? or Sentry? make sure it doesn't break...

BIG TODO: Make the handleDownloadClick function a lot more resistant to site changes, just like
the other stuff; make it resistant, then if it still can't find button, give alert and show
download instructions for doing so
*/


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

    // Attempt to add the real button first
    if (!monitorDOMChanges()) {
        // If it fails, then inject backup bar
        if (!injectBackupBar()) {
            chrome.runtime.sendMessage({ action: "showPopup" });
        }
    }
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
    let buttonInjected = false;

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                const buttonBar = findElementByAttribute('data-automation-id', 'buttonBar');

                if (buttonBar) {
                    if (!document.getElementById("wd-MultiParameterButton-56$newbutton")) {
                        injectNewButton(buttonBar);
                        buttonInjected = true;
                    }
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

    return buttonInjected;
}

// -------------------------------------------------------------------------- //
// Function to dynamically inject a button into a button bar
function injectNewButton(buttonBar) {
    try {
        const existingButton = buttonBar.querySelector('button');
        if (!existingButton) throw new Error("No existing button found!");

        const newButton = existingButton.cloneNode(true);
        newButton.id = "wd-MultiParameterButton-56$newbutton";
        newButton.title = "Add to Google Calendar";
        newButton.querySelector('span:last-child').textContent = "Add to Google Calendar";
        newButton.addEventListener("click", handleDownloadClick);

        const newListItem = document.createElement("li");
        newListItem.className = existingButton.closest('li').className;
        newListItem.appendChild(newButton);
        buttonBar.appendChild(newListItem);

        console.log("New button successfully added!");
        return true;
    } catch (error) {
        console.error("Error injecting new button:", error);
        return false;
    }
}

// -------------------------------------------------------------------------- //
// Function to inject backup bar if needed
function injectBackupBar() {
    try {
        const appBarContainer = document.getElementById("app-chrome-container");
        if (!appBarContainer) {
            console.warn("App bar container not found.");
            return false;
        }

        let newBar = document.getElementById("custom-bar");
        if (!newBar) {
            newBar = document.createElement("div");
            newBar.id = "custom-bar";
            newBar.textContent = "Custom Bar - Button Missing";
            appBarContainer.parentNode.insertBefore(newBar, appBarContainer.nextSibling);
            console.log("Custom bar injected below the app bar.");
        }
        return true;
    } catch (error) {
        console.error("Error injecting the custom bar:", error);
        return false;
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
            visibility: hidden;
        }
        #custom-bar.visible {
            visibility: visible;
        }
    `;
    document.head.appendChild(style);
    console.log("Fallback CSS injected.");
}

// -------------------------------------------------------------------------- //
/*
  When added workday button is clicked, file needs to be downloaded
*/
// make more resistant to breaking site changes
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
