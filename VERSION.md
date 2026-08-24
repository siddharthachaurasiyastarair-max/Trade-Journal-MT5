# TradeTrack AI — Google Sheets MT5 Sync Build

Build date: 24 August 2026 — revision 22

Changes:
- MT5 Sync now reads directly from the TradeTrack AI Google Apps Script API / Google Sheet.
- Removed dependency on GitHub raw mt5-trades.json for app synchronization.
- Apps Script URL and API key are entered in the app and stored only in localStorage on that device.
- Closed trades from MT5_Data are imported into the app as Live trades.
- Existing imported MT5 tickets are updated rather than duplicated.
- Service-worker cache bumped so installed iPhone PWAs receive the new app version.
