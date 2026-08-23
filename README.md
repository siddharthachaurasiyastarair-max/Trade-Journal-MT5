# TradeTrack AI — GitHub Pages iPhone PWA

This is an offline-first iPhone-installable trade journal. It does **not** use Google Sheets or any external account. Trades, compressed chart screenshots and settings stay in browser storage on the device that created them.

## Replace the current app on GitHub Pages

1. Download and extract the ZIP.
2. Open your GitHub repository: `siddharthachaurasiyastarair-max/Trade-Journal-MT5`.
3. Upload the files **inside** this folder to the repository root, replacing the existing versions when GitHub asks. Keep the file names unchanged.
4. Commit the changes to the `main` branch.
5. Wait 1–3 minutes, then open `https://siddharthachaurasiyastarair-max.github.io/Trade-Journal-MT5/?v=12`.
6. If your phone still shows the old app, close it completely, open the link once in Safari, and refresh. The new version then becomes available offline.

## Install on iPhone

Open the address above in **Safari** → Share button → **Add to Home Screen** → Add.

## Safe daily use

- Start with **New trade**, choose Backtest, Paper or Live, complete the checklist and press **Save trade**. You can open and edit it later.
- Enter actual Entry, Exit, Lots/Quantity, Lot Size and Charges: manual P&L is calculated automatically as `(exit − entry) × lots × lot size − charges` for a Buy, and `(entry − exit) × lots × lot size − charges` for a Sell. MT5 imports retain the broker's P&L.
- Use either screenshot control to choose a chart image from the iPhone Photos gallery (or take a new photo).
- Use Dashboard for overall results and Analysis for checklist and score-band performance.
- Use the download icon or History → CSV for a spreadsheet-readable backup. CSV is for review/export.
- Use Dashboard → Backup for a full JSON backup that includes screenshots and can be restored from History → Restore.

## Storage note

Data lives in the iPhone's Safari/PWA website storage. Clearing website data can erase it, and data does not automatically move to another phone or computer. Keep periodic JSON backups, particularly if you attach chart screenshots.

## MT5 demo-account sync

The GitHub MT5 sync package includes a GitHub Action workflow and an MT5 Expert Advisor. Upload its `.github` and `data` folders to this repository, then use **Dashboard → MT5 Sync** in the app to enter the GitHub owner, repository and branch. The demo trade data is public; never put a GitHub token or MT5 password into the app or repository.

## Checklist scoring

The visible category totals are deliberately preserved from the original sheet:

| Category | Displayed total |
| --- | ---: |
| Pre-Entry | 9 |
| Entry | 2 |
| SL | 2 |
| Target | 2 |
| Overall denominator | 15 |

Every YES awards that item's displayed weight; NO awards zero. The app displays both the earned score and the fixed overall denominator of 15, exactly so the original scoring reference remains visible. Saved checklist answers remain editable.
