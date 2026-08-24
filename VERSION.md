# TradeTrack AI v31 — Compact History Cards

- Screenshots can now be viewed inside the TradeTrack app in a full-screen modal.
- Works for local screenshots and private Google Drive screenshots.
- Private Drive images are retrieved through the Apps Script API using the existing API key.
- No public Drive sharing is required.
- View buttons work from History and the trade editor.
- Close button/backdrop returns to the trade without leaving the app.
- Local screenshot buttons appear immediately, even when Drive upload fails.
- Drive upload success and exact failure messages are shown after saving.
- Restoring from Google Sheets retains both screenshot URLs.
- Existing Drive URLs are protected from accidental blank overwrites.
- History shows one viewer button per screenshot, preferring the local image and using Drive as fallback.
- Screenshot buttons are compact and loss cards use a softer light-red design.
