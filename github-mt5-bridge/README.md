# GitHub + MT5 public demo sync

This method keeps the TradeTrack AI app on GitHub Pages and writes completed demo trades to the public repository.

## Upload these files

Upload the `.github` and `data` folders to the root of `siddharthachaurasiyastarair-max/Trade-Journal`.

## Create a token — do not share it

In GitHub: Profile photo → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token.

Set repository access to **Only select repositories** → `Trade-Journal`, and permission **Contents: Read and write**. Copy the token once and paste it only into the MT5 Expert Advisor input. Never paste it into GitHub files, the iPhone app, screenshots, or chat.

## Install the MT5 bridge

In MT5 desktop: MetaEditor → New → Expert Advisor → name it `TradeTrackGitHubSyncEA`. Replace code with `TradeTrackGitHubSyncEA.mq5`, compile, then attach it to a chart in the demo account.

In MT5: Tools → Options → Expert Advisors → add `https://api.github.com` to the allowed WebRequest list.

The repository dispatch event invokes the included GitHub Action, which updates the public `data/mt5-trades.json` file. GitHub Pages might take a short time to refresh after each trade.
