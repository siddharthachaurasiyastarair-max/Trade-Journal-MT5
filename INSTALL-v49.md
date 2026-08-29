# TradeTrack AI v49 installation

## Back up first

Open the current app and press **Backup**. Keep the downloaded JSON file until the new version has been verified.

## Update the GitHub Pages app

Replace `index.html`, `app.js`, `styles.css`, `sw.js`, `manifest.json`, `icon.svg` and the PNG icons with the included files.

Do not upload `Code.gs`, API keys or EA input values to the public repository.

## Update Google Apps Script

1. Replace the existing main `Code.gs` with the included v49 file.
2. Keep any separate FundedNext helper files already in the project.
3. Use **Deploy → Manage deployments → Edit → New version → Deploy**.
4. Keep the same `/exec` URL and API key. Do not run `setupApiKey` again.

The script preserves existing data and automatically creates/updates `MT5_Accounts`, `MT5_Open_Positions` and `MT5_Config`.

## Update MT5

1. Remove the previous TradeTrack EA from its chart.
2. Open **File → Open Data Folder → MQL5 → Experts**.
3. Copy `TradeTrackGoogleSheetsSync_v2_50_UnifiedDashboard.mq5` and `.ex5` into the folder.
4. Refresh Navigator or restart MT5.
5. Attach v2.50 to one chart only and enable Algo Trading.
6. Enter the existing Apps Script URL and API key.
7. Keep `SnapshotSeconds = 15` and `ConfigRefreshMinutes = 5` initially.
8. Allow WebRequest for `https://script.google.com`.

## Choose RSI settings

1. Let the EA send its first snapshot, then press **Refresh MT5** in the app.
2. Open **Settings → RSI timeframe and period**.
3. Choose the MT5 account, timeframe and RSI period.
4. Press **Save RSI settings for this account**.
5. The EA applies the selection within `ConfigRefreshMinutes`, or immediately after it is reattached/restarted.

Available timeframes are M1, M5, M15, M30, H1, H4 and D1. The period can be 2–200. Entry and Exit RSI values are recorded; checklist decisions remain manual.

## Verify P&L and dashboard

1. Compare an open position's floating P&L against MT5.
2. Open an imported MT5 trade and confirm the field says **MT5 broker net P&L**.
3. Change entry/exit fields temporarily and confirm the broker P&L does not change.
4. Confirm Summary, Account Snapshot, Profit & Loss, Long & Short, Symbols and Risks appear in the main Dashboard.
5. Change the Dashboard account/date filters and confirm every MT5 section follows them.

Closed net P&L is Profit + Commission + Swap + Fee. Open floating P&L is supplied directly by MT5.
