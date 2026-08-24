# TradeTrack AI v29

## Apps Script update required
Replace Code.gs with the included Code.gs and deploy a NEW web-app version.

Do not run setupApiKey again.

This version adds:
`GET action=getScreenshot&fileId=...`

The API returns the private Drive screenshot as a data URL after validating your existing TradeTrack API key.

## GitHub update
Replace the web app files in your GitHub Pages repository with the v29 files.

After deployment:
1. Open the site in Safari and refresh once.
2. Reopen the Home Screen app.
3. Open History -> trade.
4. Tap View setup screenshot or View after screenshot.
5. The image opens inside TradeTrack rather than leaving the app.

Google Drive screenshot files remain private.
