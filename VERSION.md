# TradeTrack AI v44 — Risk/Reward on Trade Cards

- MT5 imports now use an R:R value supplied by Google Sheets when available.
- Otherwise R:R is calculated from entry, stop loss, and target.
- If the target is unavailable, the app calculates realized R:R from entry, stop loss, and exit.
- Negative realized R:R is preserved for losing trades.
- Updated the service-worker cache so installed iPhone apps receive the correction.

## Previous v43 changes

- `Till date` now includes every saved trade instead of hiding records whose broker-server date is ahead of the phone's local date.
- A completed MT5 sync resets Dashboard filters to All markets, All instruments, and Till date so the full imported set is visible immediately.
- The sync result now reports `MT5 trades on device` in addition to fetched/new/updated/skipped counts.
- Green and red trade cards show a high-contrast compact timestamp such as `27 Aug · 14:35`.
- Updated the service-worker cache so installed iPhone apps receive this build.

## Previous v42 changes

- Dashboard and Analysis percentages now display as rounded whole numbers.
- Calculations retain full internal precision; only the presentation is rounded.

## Previous v41 changes

- Dashboard metrics use every trade matching the selected filters, not only Recent trades.
- Added Till date, Today, Last 7 days, Last 30 days, This month, and This year.
- Till date is the default and excludes future-dated records.
- The selected period applies consistently to metrics, ratios, score bands, charts, calendar data, and Recent trades.

## Previous v40 changes

- Actual trade & execution now sets INR automatically for India.
- Actual trade & execution now sets USD automatically for Forex.
- Currency updates immediately when the Market selection changes.

## Previous v39 changes

- NIFTY and its common variants now appear under Indian instead of Forex.
- Added recognition for BANKNIFTY, FINNIFTY, MIDCPNIFTY, SENSEX, BANKEX, NSE-prefixed, BSE-prefixed, `.NS`, and `.BO` symbols.
- Recognized Indian symbols use INR even when an older MT5 import stored the Forex/USD defaults.
- The next MT5 sync also corrects the saved Market and Currency fields.

## Previous v38 changes

- Applied the same clean, compact card layout to Dashboard Recent trades.
- Recent trades retain the Open action without swipe-delete controls.

## Previous v37 changes

- Removed Opened and Closed timestamps from History cards.
- The timestamps remain stored and available inside the full trade record.

## Previous v36 changes

- Removed default selection checkboxes and the always-visible selection bar.
- Added swipe-left-to-delete on individual History cards.
- Kept multi-delete behind a clean Manage / Done mode.
- Reorganized cards into a readable header, score/checklist row, execution grid, and result summary.
- Prevented long prices, tickets, and timestamps from colliding or forcing narrow broken columns.
- Uses two execution columns on phones and four on wider screens.

## Previous v35 changes

- Added All / Indian / Forex filters to Dashboard, Analysis, and History.
- Added an instrument sub-filter with All instruments under every market view.
- Replaced the Dashboard currency selector with the requested market selector; Indian automatically uses INR and Forex uses USD.
- Added History multi-select, Select all shown, selected count, confirmation, and bulk deletion.
- Deleted MT5 identities remain hidden after later syncs on the same device.
- Kept trade-mode filtering in History alongside the new market and instrument filters.

## Previous v34 changes

- Fixed the desktop/iPhone mismatch: each device now pulls shared MT5 history from Google Sheets after cloud settings are configured.
- Added a fresh service-worker cache so the iPhone Home Screen app loads the corrected code.
- Uses account + closing deal ID as the MT5 identity; partial closes remain separate records.
- Falls back to a deterministic position/time/symbol/volume/exit identity when a deal ID is absent.
- Preserves local checklist answers, screenshots, Drive URLs, market, currency, and journal fields while updating execution data.
- Links at most one closing deal to each planned journal record; additional partial closes remain visible as MT5-only trades.
- MT5 Sync now reports Fetched, New, Updated, Linked to journal, Skipped, and Errors separately.
- Valid closed deals are always stored in History. Checklist analysis remains limited to verified trades that actually have checklist answers.

## Previous v33 changes

- Added an optional FundedNext Demo connection through the existing private Apps Script backend.
- Added connection testing, status display, date-range selection, and trade-history sync.
- Imports read-only FundedNext trade history from `MT5_Data` into the local journal and updates matching tickets.
- Keeps the existing Google Sheets / MT5 bridge and journal backup unchanged.
- MCP links and tokens remain in private Apps Script Properties and are never stored in GitHub.

## Previous v32 changes

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
