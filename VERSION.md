# TradeTrack AI v49 — Unified Dashboard, RSI Configuration and Broker P&L

- Merges all MT5 Summary, Account, Profit & Loss, Long & Short, Symbols and Risk sections into the main Dashboard.
- Removes the separate Reports navigation action; Dashboard filters control both journal metrics and MT5 report sections.
- Adds per-account RSI timeframe and period controls in Settings.
- Supported RSI timeframes: M1, M5, M15, M30, H1, H4 and D1; period range: 2–200.
- EA v2.50 reads the saved RSI settings automatically every five minutes and includes the active configuration in account snapshots.
- Opening an imported MT5 trade now displays the broker's net P&L and cannot be overwritten by the manual price-difference calculator.
- Manual/backtest trades retain the entry/exit/quantity/lot-size calculator.
- Open positions continue to use broker-supplied floating P&L.
- PWA cache updated to `tradetrack-v49-unified-dashboard-rsi-config`.

## Retained from v48

- Open-position P&L now comes directly from MT5 `POSITION_PROFIT` snapshots instead of the app's closed-trade formula.
- Adds account snapshots with balance, equity, margin, free margin, margin level and current floating P&L.
- Adds custom From/To date filters to Dashboard, History, Analysis and MT5 Reports.
- Dashboard now displays every trade matching its filters instead of only five recent trades.
- Closed trades are stored and deduplicated by account login + deal ticket so switching demo accounts preserves both histories.
- Adds filtered MT5 report sections matching the supplied report: Summary, Profit & Loss, Long & Short, Symbols and Risks.
- Adds filtered open-position tables and multi-account selectors.
- Live account/open-position snapshots are sent every 15 seconds.
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

## Retained from v44

- Risk/reward display and fallbacks on trade cards.
- Till-date MT5 visibility and full sync counts.
- Compact timestamps and responsive history cards.
- Market/instrument/time filters, INR/USD separation, reports, screenshots, cloud backup, and deletion controls.
