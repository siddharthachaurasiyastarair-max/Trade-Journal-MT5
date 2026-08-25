# TradeTrack AI v33

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
