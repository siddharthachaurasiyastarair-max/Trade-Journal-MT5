# TradeTrack AI v49 release notes

## Unified dashboard

The MT5 report is now part of the main Dashboard. Summary, Account Snapshot, Profit & Loss, Long & Short, Symbols and Risks follow the Dashboard's Account, Market, Instrument and Date filters.

## RSI configuration

Settings now provide per-account RSI timeframe and period controls. The selection is stored in `MT5_Config`; EA v2.50 checks it automatically and reports the active configuration back to the app.

Supported timeframes: M1, M5, M15, M30, H1, H4 and D1. Supported periods: 2–200.

## P&L correction

- Open positions: MT5 floating P&L.
- Imported/closed MT5 trade details: MT5 net P&L.
- Manual and backtest trades: app calculator using entry, exit, quantity, lot size and charges.

Changing manual price fields on an MT5 record no longer changes its displayed or stored broker P&L.

## Verification

- JavaScript and Apps Script syntax checks passed.
- EA v2.50 compiled with 0 errors and 0 warnings.
- Unified dashboard passed desktop and mobile rendering checks.
- Dashboard filters were verified against embedded MT5 totals.
- MT5 broker P&L remained unchanged after modifying manual calculation inputs.
