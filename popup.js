/*
  Description: JS for the popup.html main popup window of the extension; handles dragging
  / file upload behavior of the app, and passes valid files back to content.js
  Author: vjoulinbatejat@scu.edu
  Date: Winter 2025
*/

console.log("XLSX version:", XLSX.version);

// -------------------------------------------------------------------------- //
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("fileUpload").addEventListener("change", async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      try {
          // Convert the file to JSON
          const jsonData = await convertXlsxToJson(file);
          console.log("File converted to JSON:", jsonData);

          // Validate JSON
          if (!validateJson(jsonData)) {
              alert("Invalid file contents.");
              return;
          }

          // Send JSON to background.js
          chrome.runtime.sendMessage({ action: "processJson", data: jsonData }, (response) => {
              if (response.success) {
                  alert("Calendar events uploaded successfully!");
              } else {
                  console.error("Error uploading events:", response.error);
                  alert("Failed to upload events.");
              }
          });

      } catch (error) {
          console.error("Error processing file:", error);
          alert("An error occurred while processing the file.");
      }
  });
});

// -------------------------------------------------------------------------- //
async function convertXlsxToJson(file) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
}

// -------------------------------------------------------------------------- //
function validateJson(jsonData) {
    // Add your validation logic here
    return Array.isArray(jsonData) && jsonData.length > 0;
}
