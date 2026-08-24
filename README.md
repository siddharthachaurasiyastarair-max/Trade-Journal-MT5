# TradeTrack AI v24

## Important: update the Apps Script first
This build adds journal restore from the `Checklist` tab, so replace your current Apps Script `Code.gs` with the included `Code.gs`, then deploy a **new version** of the existing Web App.

Keep the same API key. Do not run `setupApiKey()` again unless you intentionally want a new key.

## Then update GitHub Pages
Upload/replace the web-app files in the root of your current TradeTrack GitHub Pages repository.

Do **not** upload `Code.gs` to GitHub; it is provided only for your Google Apps Script project.

After GitHub deploys:
1. Open the GitHub Pages URL once in Safari and refresh.
2. Reopen the iPhone Home Screen app.
3. Dashboard -> MT5 Sync.
4. Save the `/exec` URL and API key.
5. Use MT5 sync, Upload journal, or Restore / merge journal.

## Data
- App records remain in iPhone localStorage for offline use.
- Structured journal/checklist records can now be backed up to Google Sheets.
- Screenshots stay local on the iPhone because storing Base64 images in Sheets would make the workbook large and slow.
