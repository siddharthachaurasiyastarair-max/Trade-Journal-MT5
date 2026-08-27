# TradeTrack AI v43

After a successful MT5 sync, the dashboard opens with All markets, All instruments, and Till date selected. Till date includes all saved broker history, and the sync message reports the number of MT5 trades stored on the device.

Trade cards show a compact, high-contrast close timestamp such as `27 Aug · 14:35`.

Percentage details are displayed as whole values, such as 67% instead of 66.67%. Calculations still retain full precision internally.

Dashboard statistics are calculated from all trades matching Market, Instrument, and Time filters. Recent trades only displays the latest five from that same filtered set. The default Time period is Till date.

In Actual trade & execution, Market controls the default currency automatically: India → INR and Forex → USD.

NIFTY-family and other recognized Indian-market symbols are classified under Indian/INR even if an earlier MT5 import assigned Forex/USD. Run MT5 Sync once to persist the corrected market and currency values.

Dashboard Recent trades now use the same organised, responsive card design as Trade History. Swipe deletion remains available only in Trade History.

History cards no longer display Opened and Closed timestamps. Those values remain safely stored in each MT5 record and are available when the trade is opened.

## Compact History and deletion

History no longer shows selection controls by default. Swipe a card left and tap **Delete** for a single record. For multiple records, tap **Manage**, select the required trades, and tap **Delete**; tap **Done** to return to the normal compact view.

The card layout adapts to screen size: execution details use four columns on wider screens and two columns on phones, preventing ticket, price, and timestamp values from overlapping.

## New filters and multi-delete

Dashboard, Analysis, and History now use the same two-level filter: choose **All**, **Indian**, or **Forex**, then choose **All instruments** or a specific instrument available within that market. Indian views use INR metrics and Forex views use USD metrics; All keeps the currencies separate.

In History, select individual trades or use **Select all shown**, then press **Delete selected**. Only selected records are removed after confirmation. Deleted MT5 deal identities remain hidden during later syncs on that device.

## Important: desktop and iPhone storage

The desktop browser and iPhone Home Screen app have separate local storage. Google Sheets is the shared MT5 source. On each device, open **Dashboard → Broker Sync**, save the same Apps Script `/exec` URL and API key, then run **Save settings & sync MT5** once. After that, the app refreshes MT5 history from Sheets when opened (at most once every five minutes).

The sync result shows separate counts for **Fetched**, **New**, **Updated**, **Linked to journal**, **Skipped**, and **Errors**. Every valid closed MT5 deal is kept at deal level in History, including partial closes and MT5-only records.

## Deployment

Upload `index.html`, `app.js`, `styles.css`, `sw.js`, `manifest.json`, and the existing icon files to the GitHub Pages repository. This web-only correction does not require a new `Code.gs` if the current Apps Script already supports `getMT5`.

On iPhone, open the GitHub Pages URL in Safari and refresh it. Close and reopen the Home Screen app. If it still shows the old version, remove the Home Screen icon, clear Safari website data for the site, open the URL again, and use **Add to Home Screen**.

## FundedNext Demo MCP sync

Open **Dashboard → Broker Sync**. The app provides **Test FundedNext connection** and **Sync FundedNext trade history** with a selectable date range.

The public GitHub Pages app calls the existing private Google Apps Script backend. The backend uses the official FundedNext MCP Streamable HTTP connection and saves normalized trades in `MT5_Data`; the app then imports them into the local journal. FundedNext access is read-only and cannot place trades or move funds.

In Apps Script **Project Settings → Script Properties**, keep the private values under `FUNDEDNEXT_MCP_URL`, optional `FUNDEDNEXT_MCP_TOKEN`, and `FUNDEDNEXT_ACCOUNT_ID`. Never put the MCP link, token, TradeTrack API key, or EA credentials in GitHub.

The existing Google Sheets / MT5 bridge remains available on the same screen.

## Apps Script update required
Replace `Code.gs` with the included file. Select `authorizeAndTestDrive`, click **Run**, approve Drive access, and confirm the execution log says `Drive access OK`.

Then deploy a **new version of the existing web app** using **Deploy → Manage deployments → Edit → New version → Deploy**. Keep **Execute as: Me** and **Who has access: Anyone**.

Do not run setupApiKey again.

Do not change the existing API key or `/exec` URL. Do not upload `Code.gs` to GitHub.

The API returns the private Drive screenshot as a data URL after validating your existing TradeTrack API key.

## GitHub update
Replace the web app files in your GitHub Pages repository with the v30 files.

After deployment:
1. Open the site in Safari and refresh once.
2. Reopen the Home Screen app.
3. Save a trade with a setup or after-trade screenshot.
4. Confirm that the app reports the Drive upload result. If it fails, the exact error is displayed and the local screenshot remains viewable.
5. Open History and use either the local or Drive screenshot button.

Google Drive screenshot files remain private.
