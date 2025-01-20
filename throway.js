// Function to dynamically inject a button into a specified container
function injectNewButton(container) {
    try {
        // Create a new button (independent of cloning from existing buttons)
        const newButton = document.createElement("button");
        newButton.id = "wd-MultiParameterButton-56$newbutton";
        newButton.title = "Add to Google Calendar";
        newButton.textContent = "Add to Google Calendar"; // Button text
        newButton.style.margin = "10px"; // Add some margin for visual clarity

        // Add event listener
        newButton.addEventListener("click", handleDownloadClick);

        // Append the button directly to the container
        container.appendChild(newButton);

        console.log("Fallback button successfully added!");
    } catch (error) {
        console.error("Error injecting fallback button:", error);
    }
}

// Function to handle fallback when buttonBar is missing
function handleMissingButtonBar() {
    console.warn("buttonBar not found. Injecting fallback button...");

    // Create a fallback container at the top of the page if it doesn't exist
    let fallbackContainer = document.getElementById("fallback-container");
    if (!fallbackContainer) {
        fallbackContainer = document.createElement("div");
        fallbackContainer.id = "fallback-container";
        fallbackContainer.style.position = "fixed";
        fallbackContainer.style.top = "10px";
        fallbackContainer.style.left = "10px";
        fallbackContainer.style.zIndex = "1000";
        fallbackContainer.style.backgroundColor = "white";
        fallbackContainer.style.padding = "10px";
        fallbackContainer.style.border = "1px solid #ccc";
        fallbackContainer.style.borderRadius = "5px";
        fallbackContainer.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
        document.body.appendChild(fallbackContainer);
    }

    // Inject the fallback button into the container
    injectNewButton(fallbackContainer);
}

// Updated MutationObserver to handle missing buttonBar
function monitorDOMChanges() {
    const observeTarget = document.body;
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === "childList") {
                // Recheck for buttonBar
                const buttonBar = findElementByAttribute("data-automation-id", "buttonBar");

                if (buttonBar) {
                    console.log("Button bar found or re-rendered. Ensuring new button is present...");
                    if (!document.getElementById("wd-MultiParameterButton-56$newbutton")) {
                        injectNewButton(buttonBar);
                    }
                } else {
                    // Handle missing buttonBar by injecting a fallback button
                    handleMissingButtonBar();
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

// Function to inject fallback CSS
function injectFallbackCSS() {
    const style = document.createElement("style");
    style.textContent = `
        #wd-MultiParameterButton-56$newbutton {
            background-color: #0073e6;
            color: white;
            border: none;
            padding: 8px 16px;
            font-size: 14px;
            border-radius: 4px;
            cursor: pointer;
        }
        #wd-MultiParameterButton-56$newbutton:hover {
            background-color: #005bb5;
        }
        #fallback-container {
            max-width: 200px;
        }
    `;
    document.head.appendChild(style);
    console.log("Fallback CSS injected.");
}

// Initialization
function afterDOMLoaded() {
    console.log("DOM is fully loaded, ready to interact with page elements");

    // Inject fallback CSS
    injectFallbackCSS();

    // Monitor DOM changes
    monitorDOMChanges();

    // Initial injection attempt
    const buttonBar = findElementByAttribute("data-automation-id", "buttonBar");
    if (buttonBar) {
        injectNewButton(buttonBar);
    } else {
        handleMissingButtonBar();
    }
}

// Run initialization after DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", afterDOMLoaded);
} else {
    afterDOMLoaded();
}
