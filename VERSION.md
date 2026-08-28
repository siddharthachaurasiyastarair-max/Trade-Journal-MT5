# TradeTrack AI v45 — RSI Entry/Exit Evidence

- Added automatic M1 RSI evidence at both entry and exit.
- Added live-event RSI and last-completed-candle RSI as separate values.
- Added configurable RSI period, 3–10 candle trend lookback, and slope threshold.
- Trend uses linear-regression slope plus at least 75% matching directional moves.
- Added configurable buy/sell entry ranges and long/short exit thresholds.
- Added automatic checklist answers for Entry RSI Trend, Entry RSI Level, and Target RSI Level.
- Added mandatory reasons for manual overrides of automatic RSI decisions.
- Added Google Sheets persistence for RSI evidence, automatic decisions, and overrides.
- Added historical RSI backfill for trades captured while MT5 was not running.
- Capped checklist category scores so strategy score cannot exceed 100%.
- Added RSI summaries to history cards and full evidence to trade details and CSV exports.
- Updated the PWA cache to `tradetrack-v45-rsi-entry-exit`.
- Updated the Expert Advisor to v2.30; compiled with 0 errors and 0 warnings.

## Retained from v44

- Risk/reward display and fallbacks on trade cards.
- Till-date MT5 visibility and full sync counts.
- Compact timestamps and responsive history cards.
- Market/instrument/time filters, INR/USD separation, reports, screenshots, cloud backup, and deletion controls.
