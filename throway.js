function monitorDOMChanges() {
    const observeTarget = document.body;
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === "childList") {
                const buttonBar = findElementByAttribute("data-automation-id", "buttonBar");
                const customBar = injectBelowAppBar();

                if (buttonBar) {
                    const customButton = document.getElementById("wd-MultiParameterButton-56$newbutton");

                    if (customButton) {
                        // Hide the custom bar if the button is found
                        customBar.classList.remove("visible");
                        console.log("Button found, hiding custom bar.");
                    } else {
                        // Show the custom bar if the button is missing
                        customBar.classList.add("visible");
                        console.log("Button missing, showing custom bar.");
                        injectNewButton(buttonBar); // Reinject the button
                    }
                } else {
                    console.warn("Button bar not found.");
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
