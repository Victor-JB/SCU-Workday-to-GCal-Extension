# **Workday to Google Calendar Chrome Extension**

![Logo](logo-icon-128.png)  
_A Chrome Extension to export your courses from Workday to Google Calendar._

---

## **Overview**

This Chrome Extension simplifies the process of syncing your enrolled courses from Workday to Google Calendar. By parsing XLSX files and leveraging the Google Calendar API, the extension automates event creation for your enrolled sections, ensuring your calendar stays organized and up-to-date.

---

## **Features**

- 📥 **Parse XLSX Files**: Upload Workday course export files directly in the extension.
- 🔍 **Automated Parsing**: Extract course names, schedules, and locations seamlessly.
- 📅 **Google Calendar Integration**: Automatically create recurring events for your enrolled sections in Google Calendar.
- ❌ **Exclude Dropped/Withdrawn Courses**: Only export events for registered courses.
- 🌐 **Chrome Extension UI**: Simple and intuitive interface.
- 🔒 **Secure Authentication**: Uses the Google OAuth2 API for authentication.

---

## **How It Works**

1. **Upload XLSX File**  
   Drag and drop or upload your Workday-exported XLSX file in the extension popup.

2. **Parse Data**  
   The extension parses the file, extracts your enrolled courses, and converts them into calendar events.

3. **Google Calendar Sync**  
   Authenticate with your Google account, and the extension automatically adds the courses to your Google Calendar.

---

## **Installation**

### **For Developers**
1. Clone the repository:
   ```bash
   git clone https://github.com/Victor-JB/SCU-workday-google-calendar-integration
   cd workday-to-google-calendar
   ```

2. Install dependencies (if using a build tool like Webpack):
   ```bash
   npm install
   ```

3. Build the project (if applicable):
   ```bash
   npm run build
   ```

4. Load the extension:
   - Go to `chrome://extensions/`.
   - Enable **Developer Mode**.
   - Click **Load unpacked** and select the project folder (or the `dist/` folder if using a build tool).

---

## **Usage**

1. Open the Chrome Extension popup.
2. Upload your Workday-exported XLSX file.
3. Review the parsed course information (displayed in the extension).
4. Click **Sync to Google Calendar** and sign in with your Google account.
5. 🎉 Your courses are now in Google Calendar!

---

## **Configuration**

### **Environment Variables**
To securely store sensitive information like the Google API `client_id`, use environment variables or a `config.json` file.

**Example `.env` File**:
```env
CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
API_KEY=your-google-api-key
```

---

## **Technologies Used**

- **JavaScript**: Core programming language for the extension.
- **Google Calendar API**: Integration for calendar events.
- **XLSX.js**: Library for parsing Workday-exported XLSX files.
- **Chrome Extensions API**: Core framework for building the extension.
- **OAuth2**: Secure authentication for Google services.

---

## **File Structure**

```plaintext
.
├── src/
│   ├── popup.html       # Main extension UI
│   ├── popup.js         # Handles XLSX parsing and communication with background.js
│   ├── background.js    # Handles Google Calendar API interactions
│   ├── manifest.json    # Chrome Extension configuration
│   ├── assets/          # Icons and other static assets
│   └── styles.css       # Styling for the popup
├── dist/                # Built/optimized extension files (if using Webpack)
├── .env                 # Environment variables (excluded from GitHub)
├── README.md            # Project documentation
└── package.json         # Dependency and script definitions
```

---

## **API Reference**

### **Google Calendar API**
This project uses the Google Calendar API to create events. Key API actions:
- `calendar.events.insert`: Adds events to the primary calendar.
- Authentication uses OAuth2 with the following scopes:
  - `https://www.googleapis.com/auth/calendar.events`.

Refer to the [Google Calendar API Documentation](https://developers.google.com/calendar/api) for more details.

---

## **Roadmap**

- [ ] Add support for custom time zones.
- [ ] Improve UI for displaying parsed courses.
- [ ] Allow manual editing of events before syncing.
- [ ] Add support for additional calendar services (e.g., Outlook).

---

## **Known Issues**

- **Protected XLSX Files**: If the XLSX file is protected, parsing may fail.
- **Token Expiry**: Google OAuth tokens may need to be refreshed manually.

---

## **Contributing**

Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a new branch (`feature/new-feature`).
3. Commit your changes.
4. Push to the branch and open a Pull Request.

---

## **License**

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

## **Contact**

For questions or feedback, please contact:
- **Name**: Victor Joulin-Batejat
- **Email**: victorjb2015@gmail.comn
- **GitHub**: [Victor-JB](https://github.com/Victor-JB)

---

## **Screenshots**

_Add screenshots or GIFs of your extension in action here!_
