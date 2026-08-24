# TradeTrack AI v24 — Reviewed & Improved

Corrections:
- Fixed monthly P&L calendar off-by-one day (day 1 now starts correctly and the last day is shown).
- Normalizes MT5 dates like `YYYY.MM.DD HH:MM:SS`.
- MT5-only imports no longer distort strategy-score averages/score bands by appearing as 0% checklist trades.
- MT5-only trade cards show `—` for checklist scores rather than a misleading 0%.
- Attempts to link an incoming MT5 trade to the closest unlinked planned trade with the same symbol and direction within 24 hours.
- Imported trade ordering now uses the trade close time rather than the moment the sync button was pressed.
- More reliable iPhone Home Screen icons via PNG.

Improvements:
- New local-journal -> Google Sheets backup.
- New Google Sheets -> iPhone journal restore/merge.
- Saving/editing a journal trade automatically attempts a cloud backup when sync is configured.
- MT5 sync screen shows last successful sync.
- Screenshots intentionally remain local; the structured trade/checklist data is backed up to Google Sheets.
