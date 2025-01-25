document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("fileUpload").addEventListener("change", async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const jsonData = await convertXlsxToJson(file);

            if (!isValidXlsx(jsonData)) {
                throw new Error("Invalid file format. Please upload a valid course schedule XLSX file.");
            }

            const events = parseJsonToGoogleEvents(jsonData);

            chrome.runtime.sendMessage(
                { action: "uploadEventsToGoogleCalendar", events },
                (response) => {
                    if (response.success) {
                        alert("Events uploaded successfully!");
                    } else {
                        console.error("Error uploading events:", response.error);
                        alert(`Failed to upload events: ${response.error}`);
                    }
                }
            );
        } catch (error) {
            console.error("Error processing file:", error);
            alert(error.message || "An error occurred while processing the file.");
        }
    });
});

// Validate if the JSON has the required structure
function isValidXlsx(jsonData) {
    const requiredHeaders = ["Course Listing", "Units", "Grading Basis", "Meeting Patterns"];
    return jsonData.some(row =>
        Object.values(row).some(value => requiredHeaders.includes(value))
    );
}

async function convertXlsxToJson(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const rows = [];
        Object.keys(sheet).forEach(key => {
            if (!key.startsWith("!")) {
                const cell = sheet[key];
                const match = key.match(/([A-Z]+)(\d+)/);
                if (match) {
                    const col = match[1];
                    const row = parseInt(match[2], 10);

                    if (!rows[row - 1]) rows[row - 1] = {};
                    rows[row - 1][col] = cell.v;
                }
            }
        });
        return rows.filter(row => row);
    } catch (error) {
        throw new Error("Error parsing the XLSX file. Please ensure it's in the correct format.");
    }
}
