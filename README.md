# TradeTrack AI v27

A Google Drive folder has already been created for screenshots:
TradeTrack AI Screenshots
Folder ID: 1Hl6yBTRRlTd4fl1qqLU2qIhWSxoCWA0A

## Update Apps Script
1. Replace your existing Code.gs with the Code.gs in this ZIP.
2. Do NOT run setupApiKey again.
3. Deploy -> Manage deployments -> Edit -> New version -> Deploy.

The backend automatically adds missing Trade columns:
- Market
- Currency
- Before Screenshot URL
- After Screenshot URL

## Update GitHub
Upload all web files from this ZIP to your GitHub Pages repository, replacing the old build.
Do not upload Code.gs to GitHub.

## Screenshot workflow
When you choose a Setup Screenshot or After-Trade Screenshot and save the trade:
- The app keeps the compressed image locally for offline use.
- If Google sync is configured, it uploads the image to Google Drive.
- The Drive URL is saved against that trade in Google Sheets.
- History displays a button to open the saved screenshot.

The Drive files remain private to your Google account unless you separately change their sharing settings.
