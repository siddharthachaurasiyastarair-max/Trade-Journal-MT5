# TradeTrack AI v32 — Compact Blue History Cards

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
- Screenshot buttons are compact and loss cards use a blue design.
- Execution details now fall back to saved editor values when an MT5 field is blank.
- Manual trades show their available entry, exit, SL, TP, and quantity details too.
- Loss cards use a blue treatment and all History cards are more compact.
