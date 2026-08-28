# TradeTrack AI v45 — Automatic Entry and Exit RSI Evidence

This build extends the existing TradeTrack AI PWA, Google Sheets bridge, and MT5 Expert Advisor. It automatically captures the RSI evidence that can be measured objectively and leaves the rest of the trading checklist manual.

## What is new

- Automatic RSI evidence for both entry and exit.
- Fixed RSI timeframe of M1, with a configurable RSI period.
- Stores the live event RSI when MT5 is running at the trade event.
- Stores the latest completed M1 RSI separately for stable analysis.
- Stores the completed-candle sequence, regression slope, directional moves, trend, candle time, capture time, and capture source.
- Entry RSI Trend is answered automatically.
- Entry RSI Level is answered automatically only after buy and sell ranges are configured.
- Exit Target RSI Level is answered automatically only after long and short exit thresholds are configured.
- All other checklist answers remain manual.
- Changing an automatic answer requires a reason. The override, reason, and time are retained locally, in Google Sheets journal backup, and in CSV exports.
- Checklist category totals are capped, so the overall score cannot exceed 100%.
- Existing dashboard, trade history, screenshots, cloud backup, filters, reports, and R:R behavior are retained.

## How trend is calculated

The default is five completed M1 RSI candles. The lookback can be set from 3 to 10.

1. The EA reads the completed RSI values in chronological order, oldest to newest.
2. It calculates a linear-regression slope in RSI points per M1 candle.
3. It counts how many consecutive moves rose and how many fell.
4. A trend is **Rising** when the slope is at least the configured positive threshold and at least 75% of the moves rose.
5. A trend is **Falling** when the slope is at or below the negative threshold and at least 75% of the moves fell.
6. Every other sequence is **Flat/Mixed**.

The default slope threshold is 0.5 RSI points per candle. For a Buy, Rising produces an automatic Yes for Entry RSI Trend. For a Sell, Falling produces an automatic Yes.

## Entry and exit level rules

Open **Dashboard → Broker Sync → Automatic RSI checklist**.

- Buy entry passes when RSI is inside the configured Buy minimum/maximum range.
- Sell entry passes when RSI is inside the configured Sell minimum/maximum range.
- Long exit passes when RSI is greater than or equal to the configured long-exit threshold.
- Short exit passes when RSI is less than or equal to the configured short-exit threshold.

Blank thresholds do not create an automatic Yes or No. This prevents the app from inventing strategy rules. Enter the values from your tested checklist.

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
7. Match the EA RSI period, lookback, and slope threshold with the app settings.

For the stable default, leave **UseLiveRsiForLevel = false**. The EA will still retain the live RSI as evidence when available, while checklist level decisions use the last completed M1 RSI.

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

1. Configure the same RSI period, lookback, and slope threshold in the app and EA.
2. Configure only the entry and exit level thresholds that belong to your tested strategy.
3. Close a small paper/demo trade while MT5 and the EA are running.
4. Open **Broker Sync** and run **Save settings & sync MT5**.
5. Open the imported trade and confirm Entry RSI and Exit RSI cards show values, trend, slope, completed M1 values, times, and `Live captured`.
6. Change an automatic answer and confirm the app requests an override reason.
7. Run a history rescan and confirm older trades show `Historical backfill`.

## Important evidence limitation

The exact live RSI is available only when the EA is running at the entry or exit event. If the PC or MT5 was off, history sync reconstructs the last completed M1 RSI and trend from broker history, but it cannot reconstruct the exact tick-by-tick live RSI that existed inside the unfinished candle.

## Career and risk note

TradeTrack AI is a discipline, evidence, and review tool—not a profit guarantee or a signal service. A three-month date alone should not decide whether to leave employment. Use verified live results, a sufficiently large trade sample, controlled drawdown, consistent checklist adherence, and a separate living-expense runway before making that decision.
