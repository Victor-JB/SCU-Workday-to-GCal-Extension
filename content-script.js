
chrome.runtime.sendMessage({ action: "showPopup" });
console.log("should be here...");


// Function to handle button clicks
function buttonClicked() {
    console.log("Button clicked on the page!");
    // Perform actions or send messages here
}

const buttons = document.querySelectorAll('WCSK WBSK WKQK WNQK WLQK');
console.log("query selecting and stuff...");
console.log("here buttons: ", buttons);
buttons.forEach(button => {
    button.addEventListener('click', buttonClicked);
});

// Optional: Handle dynamically added buttons
document.body.addEventListener('click', (event) => {
    if (event.target.classList.contains('WCSK WBSK WKQK WNQK WLQK')) {
        buttonClicked();
    }
});
