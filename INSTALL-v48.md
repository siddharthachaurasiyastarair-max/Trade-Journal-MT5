# TradeTrack AI v48 replacement steps

## 1. Back up first

Open the current app and press **Backup**. Keep the downloaded JSON file until the upgrade is verified.

## 2. Update the public app

Replace these files in the GitHub Pages repository:

- `index.html`
- `app.js`
- `styles.css`
- `sw.js`
- `manifest.json`
- `icon.svg`

Do not upload API keys or EA input values to GitHub.

## 3. Update Google Apps Script

1. Open the existing Apps Script project.
2. Replace its main `Code.gs` with the included file.
3. Keep any separate private FundedNext helper files already in the project.
4. Use **Deploy → Manage deployments → Edit → New version → Deploy**.
5. Keep the same `/exec` URL and the existing API key. Do not run `setupApiKey` again.

The first MT5 snapshot automatically creates `MT5_Accounts` and `MT5_Open_Positions`. Existing history is not cleared.

## 4. Update the MT5 Expert Advisor

1. Remove the previous TradeTrack EA from its chart.
2. In MT5, use **File → Open Data Folder → MQL5 → Experts**.
3. Copy both `TradeTrackGoogleSheetsSync_v2_40_LiveReports.mq5` and `.ex5` into that folder.
4. Refresh the Navigator or restart MT5.
5. Attach v2.40 to one chart only and enable Algo Trading.
6. Enter the existing Apps Script URL and API key in the EA inputs.
7. Keep `SnapshotSeconds = 15` initially.
8. Allow WebRequest for `https://script.google.com` in **Tools → Options → Expert Advisors**.

## 5. Verify

1. Leave a demo trade open and compare its MT5 floating P&L with the dashboard after pressing **Refresh MT5**.
2. Confirm Dashboard, History and Analysis each show a **Custom** date option with From/To fields.
3. Confirm the dashboard shows every trade in the selected period.
4. Change to another demo account, let the EA sync it, then use the account filter to view both account histories.
5. Open **Reports** and check Summary, Profit & Loss, Long & Short, Symbols, Risks and Open Positions.

Open P&L is broker supplied. Closed net P&L is calculated as Profit + Commission + Swap + Fee.
