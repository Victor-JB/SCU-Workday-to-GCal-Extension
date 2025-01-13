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
        // Create a new <li> element
        const newListItem = document.createElement("li");
        newListItem.className = "WBMM";

        // Create the new <button> element
        const newButton = document.createElement("button");
        newButton.className = "WKTM WOTM WEAO WF5 WGSM";
        newButton.id = "wd-MultiParameterButton-56$newbutton"; // Unique ID
        newButton.setAttribute("data-automation-activebutton", "true");
        newButton.setAttribute("data-automation-id", "wd-MultiParameterButton");
        newButton.setAttribute("data-metadata-id", "56$newbutton");
        newButton.setAttribute("data-automation-button-type", "AUXILIARY");
        newButton.setAttribute("title", "Add to Google Calendar");
        newButton.setAttribute("type", "button");

        // Create the two <span> elements for the button
        const span1 = document.createElement("span");
        span1.className = "WAUM WLTM";

        const span2 = document.createElement("span");
        span2.className = "WMTM";
        span2.setAttribute("title", "New Button");
        span2.textContent = "Add to Google Calendar"; // Button text

        // Append the spans to the button
        newButton.appendChild(span1);
        newButton.appendChild(span2);

        // Append the button to the new <li> element
        newListItem.appendChild(newButton);

        // Append the <li> to the button bar
        buttonBar.appendChild(newListItem);

        console.log("New button successfully added!");
    } catch (error) {
        console.error("An error occurred while injecting the new button:", error);
    }
}
