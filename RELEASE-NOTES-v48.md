# TradeTrack AI v48 release notes

## Correct open-trade profit

- The EA sends current account values and every open position every 15 seconds.
- The app displays MT5's floating P&L value instead of estimating an open trade from entry/exit fields.
- The dashboard keeps closed net P&L separate from open floating P&L.

## Filters

- Dashboard, History, Analysis and Reports now include Account, Market, Instrument and Time Period filters.
- Choosing **Custom** shows inclusive From and To date fields.
- The dashboard lists all trades matching its filters; the former five-trade limit is removed.

## Multi-account records

- MT5 closed trades are keyed by account login plus deal ticket.
- Two accounts can have the same ticket number without being merged.
- Changing demo accounts does not clear prior closed-trade history.
- Latest account snapshots and open positions are retained per account.

## MT5 reports

- Summary
- Account snapshot
- Profit & Loss
- Long & Short
- Symbols
- Risks
- Open positions

Every report section follows the report page's account/date/market/instrument filter. MT5 reports exclude manual journal trades so INR and USD journal values are not silently mixed into broker reports.

## Calculation rules

- Closed net P&L: Profit + Commission + Swap + Fee.
- Open floating P&L: broker-supplied MT5 position/account value.
- Gross profit/loss: MT5 Profit before commissions, swaps and fees, matching the structure of the supplied MT5 report.
- Drawdown: filtered closed-trade equity sequence.
- Latest margin/deposit load: current account snapshot.

## Verification

- JavaScript syntax check passed.
- Google Apps Script syntax check passed.
- EA v2.40 compiled with 0 errors and 0 warnings.
- Desktop and mobile browser previews passed.
- Verified same ticket number remains separate across two MT5 accounts.
- Verified custom From/To filtering on Dashboard, History, Analysis and Reports.
