# TradeTrack AI v30

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
