# TradeTrack AI v46 — RSI Values and Manual Checklist

- Shows only Entry RSI and Exit RSI values from MT5.
- Removed automatic RSI trend, level and exit decisions from the checklist.
- Every checklist answer is now manual.
- Existing manual RSI overrides are converted into ordinary manual answers.
- Existing duplicate local trades are merged using deal/ticket identity and an execution fingerprint.
- Future MT5 synchronization updates the matching trade instead of adding another copy when the account-aware identity changes.
- Manual checklist answers, screenshots and the available RSI values are preserved while duplicates are merged.
- CSV exports now contain only Entry RSI and Exit RSI for RSI evidence.
- Updated the PWA cache to `tradetrack-v46-rsi-values-manual`.

## Retained from v44

- Risk/reward display and fallbacks on trade cards.
- Till-date MT5 visibility and full sync counts.
- Compact timestamps and responsive history cards.
- Market/instrument/time filters, INR/USD separation, reports, screenshots, cloud backup, and deletion controls.
