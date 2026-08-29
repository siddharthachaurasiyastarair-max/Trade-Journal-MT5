# TradeTrack AI v46 — RSI Values and Manual Checklist

This build keeps RSI simple: MT5 supplies only the Entry RSI and Exit RSI values shown in the app. Every checklist answer remains under the trader's manual control.

## What is new

- Shows only Entry RSI and Exit RSI in trade details, history cards and CSV exports.
- Removes automatic RSI trend, level and exit decisions from the checklist.
- Converts previous manual RSI overrides into normal manual checklist answers.
- Merges existing duplicate local trades using the MT5 deal/ticket and an execution fingerprint.
- Prevents the same trade from being re-added when an older import used a default account identity and a newer import includes the broker account.
- Preserves manual checklist answers, screenshots and available RSI values when duplicate copies are merged.
- Retains the dashboard, reports, cloud backup, filters, screenshots and R:R calculations.

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

The script adds missing columns to `MT5_Data` and `Checklist` automatically. Existing rows and unrelated columns are preserved.

## Update MT5

The package includes both source and a successfully compiled Expert Advisor:

- `TradeTrackGoogleSheetsSync_v2_30_RSI.mq5`
- `TradeTrackGoogleSheetsSync_v2_30_RSI.ex5`

Installation:

1. In MT5, use **File → Open Data Folder**.
2. Open `MQL5\Experts` and copy the EA files there.
3. Refresh Expert Advisors in Navigator, or restart MT5.
4. Attach the EA to one chart only and enable Algo Trading.
5. Enter the existing Apps Script `/exec` URL and API key in the EA inputs.
6. In **Tools → Options → Expert Advisors**, allow WebRequest for the Apps Script origin, normally `https://script.google.com`.
7. Set the EA RSI period to match the RSI indicator used in your strategy. The app displays the value supplied by the EA and does not make a checklist decision from it.

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
3. Open **Broker Sync** and run **Save settings & sync MT5**.
4. Confirm the same trade appears only once.
5. Open it and confirm only Entry RSI and Exit RSI are shown in the RSI panel.
6. Confirm every checklist Yes/No answer can be chosen manually.

## Important evidence limitation

The exact live RSI is available only when the EA is running at the entry or exit event. If the PC or MT5 was off, history sync may provide the last completed M1 RSI when broker history is available, but it cannot reconstruct the exact tick-by-tick value inside an unfinished candle.

## Career and risk note

TradeTrack AI is a discipline, evidence, and review tool—not a profit guarantee or a signal service. A three-month date alone should not decide whether to leave employment. Use verified live results, a sufficiently large trade sample, controlled drawdown, consistent checklist adherence, and a separate living-expense runway before making that decision.
