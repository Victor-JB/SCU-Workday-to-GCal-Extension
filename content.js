chrome.runtime.sendMessage({ action: "showPopup" });
console.log("Script loaded and running...");

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', afterDOMLoaded);
} else {
    afterDOMLoaded();
}

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
