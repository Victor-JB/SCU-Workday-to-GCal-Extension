
chrome.runtime.sendMessage({ action: "showPopup" });

// if (window.location.href.includes("specific-criteria")) {
//  console.log("We're on the page??");
// }

// Function to handle button clicks
function buttonClicked() {
    console.log("Button clicked on the page!");
    // Perform actions or send messages here
}

// Add a listener for buttons with a specific class
document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.WCSK WBSK WKQK WNQK WLQK');
    buttons.forEach(button => {
        button.addEventListener('click', buttonClicked);
    });
});

// Optional: Handle dynamically added buttons
document.body.addEventListener('click', (event) => {
    if (event.target.classList.contains('WCSK WBSK WKQK WNQK WLQK')) {
        buttonClicked();
    }
});
