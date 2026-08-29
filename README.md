# TradeTrack AI v48 — Live MT5 P&L, Filters and Reports

This build keeps the checklist manual while adding broker-accurate open P&L, multi-account history, custom date filters and in-app MT5 reports.

## What is new

- Reads open-position floating P&L and current market price directly from MT5.
- Preserves closed trades from every demo/live account and prevents cross-account ticket collisions.
- Adds account, market, instrument, preset-period and custom From/To filters to Dashboard, History, Analysis and Reports.
- Shows all dashboard trades matching the selected filter.
- Adds Summary, Profit & Loss, Long & Short, Symbols, Risks, account snapshot and open-position report sections.
- Shows only Entry RSI and Exit RSI from MT5; all checklist answers remain manual.

## Checklist behavior

All checklist items—including RSI Trend, entry RSI Level and target RSI Level—are manual Yes/No choices. Imported RSI values are reference information only and never change a checklist response.

## Upgrade safely

1. In the current app, create a full JSON backup before replacing anything.
2. Keep a copy of the current Apps Script project and MT5 EA inputs.
3. Do not publish an Apps Script URL, API key, broker credential, or FundedNext token in GitHub.

## Update Google Apps Script

1. Open the existing TradeTrack Apps Script project.
2. Replace its main `Code.gs` with the included `Code.gs`.
3. If the deployed project contains separate FundedNext helper files, keep those files. The RSI update changes the MT5 and checklist storage paths; it does not require changing private FundedNext credentials.
4. Deploy a new version of the existing web app: **Deploy → Manage deployments → Edit → New version → Deploy**.
5. Keep **Execute as: Me** and the same access setting already used by the app.
6. Keep the existing `/exec` URL and API key. Do not run `setupApiKey` again during an upgrade.

The script adds missing columns automatically and creates `MT5_Accounts` and `MT5_Open_Positions` when first used. Existing `MT5_Data`, trade, checklist and screenshot records are preserved.

## Update MT5

The package includes both source and a successfully compiled Expert Advisor:

- `TradeTrackGoogleSheetsSync_v2_40_LiveReports.mq5`
- `TradeTrackGoogleSheetsSync_v2_40_LiveReports.ex5`

Installation:

1. In MT5, use **File → Open Data Folder**.
2. Remove the previous TradeTrack EA from its chart, then open `MQL5\Experts` and copy the v2.40 EA files there.
3. Refresh Expert Advisors in Navigator, or restart MT5.
4. Attach the EA to one chart only and enable Algo Trading.
5. Enter the existing Apps Script `/exec` URL and API key in the EA inputs.
6. In **Tools → Options → Expert Advisors**, allow WebRequest for the Apps Script origin, normally `https://script.google.com`.
7. Keep `SnapshotSeconds` at 15 for frequent open-position updates, or choose 5–300 seconds.
8. Set the EA RSI period to match the RSI indicator used in your strategy. The app displays the value supplied by the EA and does not make a checklist decision from it.

## Update GitHub Pages

Upload these public web files to the existing GitHub Pages repository:

- `index.html`
- `app.js`
- `styles.css`
- `sw.js`
- `manifest.json`
- `icon.svg`

Do not upload `Code.gs`, the EA input values, or files containing private keys.

After GitHub Pages updates, refresh the site in Safari. For an installed iPhone Home Screen app, close and reopen it. If the old cached version remains, remove the Home Screen icon, clear the website data for the site, reopen the URL, and add it to the Home Screen again.

## First verification

1. Set the RSI period in the EA to match your MT5 RSI indicator.
2. Close a small paper/demo trade while MT5 and the EA are running.
3. Use **Refresh MT5** on the dashboard.
4. Confirm open positions show the same floating P&L as MT5.
5. Switch the Dashboard account filter and confirm each account keeps its own closed trades.
6. Choose **Custom** and verify From/To dates on Dashboard, History, Analysis and Reports.
7. Open **Reports** and confirm Summary, Profit & Loss, Long & Short, Symbols and Risks are present.
8. Open a closed trade and confirm only Entry RSI and Exit RSI are shown; checklist answers remain manual.

## Important evidence limitation

The exact live RSI is available only when the EA is running at the entry or exit event. If the PC or MT5 was off, history sync may provide the last completed M1 RSI when broker history is available, but it cannot reconstruct the exact tick-by-tick value inside an unfinished candle.

## Career and risk note

TradeTrack AI is a discipline, evidence, and review tool—not a profit guarantee or a signal service. A three-month date alone should not decide whether to leave employment. Use verified live results, a sufficiently large trade sample, controlled drawdown, consistent checklist adherence, and a separate living-expense runway before making that decision.
