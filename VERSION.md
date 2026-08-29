# TradeTrack AI v48 — Live MT5 P&L, Filters and Reports

- Open-position P&L now comes directly from MT5 `POSITION_PROFIT` snapshots instead of the app's closed-trade formula.
- Adds account snapshots with balance, equity, margin, free margin, margin level and current floating P&L.
- Adds custom From/To date filters to Dashboard, History, Analysis and MT5 Reports.
- Dashboard now displays every trade matching its filters instead of only five recent trades.
- Closed trades are stored and deduplicated by account login + deal ticket so switching demo accounts preserves both histories.
- Adds filtered MT5 report sections matching the supplied report: Summary, Profit & Loss, Long & Short, Symbols and Risks.
- Adds filtered open-position tables and multi-account selectors.
- EA v2.40 sends live account/open-position snapshots every 15 seconds and compiles with 0 errors and 0 warnings.
- Google Apps Script automatically creates `MT5_Accounts` and `MT5_Open_Positions` sheets.

## Retained behavior

- Shows only Entry RSI and Exit RSI values from MT5.
- Removed automatic RSI trend, level and exit decisions from the checklist.
- Every checklist answer is now manual.
- Existing manual RSI overrides are converted into ordinary manual answers.
- Existing duplicate local trades are merged using deal/ticket identity and an execution fingerprint.
- Future MT5 synchronization updates the matching trade instead of adding another copy when the account-aware identity changes.
- Manual checklist answers, screenshots and the available RSI values are preserved while duplicates are merged.
- CSV exports now contain only Entry RSI and Exit RSI for RSI evidence.
- Updated the PWA cache to `tradetrack-v48-live-mt5-reports`.

## Retained from v44

- Risk/reward display and fallbacks on trade cards.
- Till-date MT5 visibility and full sync counts.
- Compact timestamps and responsive history cards.
- Market/instrument/time filters, INR/USD separation, reports, screenshots, cloud backup, and deletion controls.
