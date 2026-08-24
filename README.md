# TradeTrack AI — Google Sheets Sync

Upload these files to the root of your existing GitHub Pages repository, replacing the old files.

After GitHub Pages redeploys:
1. Open the app on iPhone.
2. If the Home Screen app still shows the old version, open the GitHub Pages URL in Safari once and refresh.
3. In TradeTrack AI tap **MT5 Sync**.
4. Enter the Apps Script `/exec` URL.
5. Enter your TradeTrack API key.
6. Tap **Save & sync MT5**.

The app reads MT5 trades from the `MT5_Data` tab through the Apps Script API and stores the imported copy locally on the iPhone for offline use.

Do not put your API key directly in public GitHub source files.
