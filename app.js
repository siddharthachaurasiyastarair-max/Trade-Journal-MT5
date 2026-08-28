/* TradeTrack AI: all data stays on this device in localStorage. */
const KEY='tradetrack_ai_v2_records';
const MT5_SYNC_KEY='tradetrack_mt5_sync_settings';
const DELETED_KEY='tradetrack_deleted_trade_ids';
const AUTO_RSI_KEYS=new Set(['Pre-Entry|RSI Trend','Pre-Entry|RSI Level','Target|RSI Level']);
const groups=[
 {name:'Pre-Entry',total:9,items:[['RSI Trend',2],['RSI Level',2],['Liquidity (SL Hunt)',2],['Engulfing Candle',2],['Divergent',1]]},
 {name:'Entry',total:2,items:[['OB Entry (On retracement)',2],['Candle Close Entry',1]]},
 {name:'SL',total:2,items:[['Engulfing Candle',2],['Nearest Swing',1],['Others',1]]},
 {name:'Target',total:2,items:[['RSI Level',2],['Opposite Engulfing Candle',2],['Liquidity (SL Hunt)',2],['Others',1]]}
];
const $=s=>document.querySelector(s), app=$('#app');
let route='dashboard', historyFilter='All', editingId=null, draft=null, dashboardStock='All', dashboardMarket='All', dashboardTime='Till date', historyMarket='All', historyStock='All', analysisMarket='All', analysisStock='All', selectedHistoryIds=new Set(), historyManage=false, calendarMonth=localNow().slice(0,7);
const getTrades=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}};
const putTrades=x=>localStorage.setItem(KEY,JSON.stringify(x));
const getDeletedIds=()=>{try{return new Set(JSON.parse(localStorage.getItem(DELETED_KEY)||'[]'))}catch{return new Set()}};
const putDeletedIds=x=>{let all=getTrades();for(const id of [...x]){let t=all.find(v=>String(v.id)===String(id)),identity=existingMt5Identity(t);if(identity)x.add('mt5:'+identity)}localStorage.setItem(DELETED_KEY,JSON.stringify([...x]))};
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const fmt=n=>Number(n||0).toLocaleString(undefined,{maximumFractionDigits:2});
const resultClass=r=>r==='Win'?'':r==='Loss'?'loss':r==='Breakeven'?'breakeven':'pending';
const answerValue=(t,key)=>t?.rsiOverrides?.[key]?.value||t?.autoAnswers?.[key]||t?.answers?.[key]||'';
const rawCategoryScore=(t,g)=>g.items.reduce((a,[name,w])=>a+(answerValue(t,g.name+'|'+name)==='Yes'?w:0),0);
const categoryScore=(t,g)=>Math.min(g.total,rawCategoryScore(t,g));
const scoreOf=t=>groups.reduce((n,g)=>n+categoryScore(t,g),0);
const percentOf=t=>scoreOf(t)/15*100;
const categoryPercent=(t,g)=>g.total?categoryScore(t,g)/g.total*100:0;
const hasChecklist=t=>[...Object.values(t?.answers||{}),...Object.values(t?.autoAnswers||{}),...Object.values(t?.rsiOverrides||{}).map(x=>x?.value)].some(v=>v==='Yes'||v==='No');
const wholePercent=n=>`${Math.round(Number(n)||0)}%`;
const finiteOrBlank=v=>{let n=Number(v);return v===''||v===null||v===undefined||!Number.isFinite(n)?'':n};
function riskReward(v,direction){if(v?.actualEntry===''||v?.actualEntry==null||v?.actualSL===''||v?.actualSL==null)return '';let rewardValue=v?.actualTarget!==''&&v?.actualTarget!=null?v.actualTarget:v?.actualExit;if(rewardValue===''||rewardValue==null)return '';let entry=Number(v.actualEntry),sl=Number(v.actualSL),rewardPrice=Number(rewardValue);if(!Number.isFinite(entry)||!Number.isFinite(sl)||!Number.isFinite(rewardPrice)||entry===sl)return '';let risk=Math.abs(entry-sl),reward=direction==='Sell'?entry-rewardPrice:rewardPrice-entry;return Number.isFinite(reward)?reward/risk:''}
function calculatedPnl(v,direction){if(v?.actualEntry===''||v?.actualEntry==null||v?.actualExit===''||v?.actualExit==null||v?.quantity===''||Number(v?.quantity)<=0||v?.lotSize===''||Number(v?.lotSize||1)<=0)return '';let entry=Number(v.actualEntry),exit=Number(v.actualExit),quantity=Number(v.quantity),lotSize=Number(v.lotSize||1),charges=Number(v.charges||0);if(!Number.isFinite(entry)||!Number.isFinite(exit)||!Number.isFinite(quantity)||!Number.isFinite(lotSize)||!Number.isFinite(charges))return '';return (direction==='Sell'?entry-exit:exit-entry)*quantity*lotSize-charges}
function monthLabel(month){return new Date(month+'-01T12:00:00').toLocaleDateString(undefined,{month:'long',year:'numeric'})}
function qualification(p){return p>=80?'A+ Setup':p>=70?'A Setup':p>=60?'B Setup':'Avoid'}
function localNow(){let d=new Date(),z=d.getTimezoneOffset()*60000;return new Date(d-z).toISOString()}
function emptyTrade(){let now=localNow();return {id:uid(),mode:'Paper',market:'India',currency:'INR',date:now.slice(0,10),timestamp:now.slice(0,16),script:'',direction:'Buy',plannedEntry:'',plannedSL:'',plannedTarget:'',answers:{},autoAnswers:{},rsiOverrides:{},rsiEvidence:{entry:null,exit:null},beforeImage:'',beforeImageUrl:'',lockedAt:null,verification:{actualEntry:'',actualExit:'',quantity:'1',lotSize:'1',charges:'',result:'',pnl:'',rr:'',followed:'',movedSL:'',exitedEarly:'',notes:'',afterImage:'',afterImageUrl:''}}}
function isIndianSymbol(value){let s=String(value||'').trim().toUpperCase().replace(/[\s_-]/g,'');return /^(NIFTY|NIFTY50|BANKNIFTY|NIFTYBANK|FINNIFTY|MIDCPNIFTY|NIFTYMIDCAP|SENSEX|BANKEX)/.test(s)||/\.(NS|BO)$/.test(String(value||'').trim().toUpperCase())||/^(NSE|BSE):/.test(String(value||'').trim().toUpperCase())}
function tradeCurrency(t){if(isIndianSymbol(t?.script||t?.mt5?.symbol))return 'INR';let market=String(t?.market||'').toLowerCase();if(market==='india')return 'INR';if(market==='forex')return 'USD';return String(t?.currency||((t?.source==='MT5'||t?.mt5?.ticket)?'USD':'INR')).toUpperCase()==='USD'?'USD':'INR'}
function tradeMarket(t){if(isIndianSymbol(t?.script||t?.mt5?.symbol))return 'India';let m=String(t?.market||'').toLowerCase();if(m==='india')return 'India';if(m==='forex')return 'Forex';return tradeCurrency(t)==='USD'?'Forex':'India'}
function filterTrades(all,market,stock){let byMarket=market==='All'?all:all.filter(t=>tradeMarket(t)===market);return stock==='All'?byMarket:byMarket.filter(t=>t.script===stock)}
function filterTradesByTime(all,period){if(period==='Till date')return all;let now=new Date(),today=localNow().slice(0,10),start='';if(period==='Today')start=today;else if(period==='Last 7 days'){let d=new Date(now);d.setDate(d.getDate()-6);start=localIsoFromDate(d).slice(0,10)}else if(period==='Last 30 days'){let d=new Date(now);d.setDate(d.getDate()-29);start=localIsoFromDate(d).slice(0,10)}else if(period==='This month')start=today.slice(0,7)+'-01';else if(period==='This year')start=today.slice(0,4)+'-01-01';return all.filter(t=>{let date=normalizeSheetDate(t.date||t.timestamp||'').slice(0,10);if(!date||date>today)return false;return !start||date>=start})}
function shortCardDateTime(t){let value=normalizeSheetDate(t?.timestamp||t?.mt5?.closeTime||t?.date||''),match=String(value).match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);if(!match)return String(t?.date||'No date');let months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],label=`${Number(match[3])} ${months[Number(match[2])-1]||''}`;return match[4]&&match[5]?`${label} · ${match[4]}:${match[5]}`:label}
function marketFilters(all,market,stock,prefix){let marketTrades=market==='All'?all:all.filter(t=>tradeMarket(t)===market),stocks=[...new Set(marketTrades.map(t=>t.script).filter(Boolean))].sort();return `<div class="card dashboard-filter"><label>Market<select id="${prefix}Market"><option value="All" ${market==='All'?'selected':''}>All</option><option value="India" ${market==='India'?'selected':''}>Indian</option><option value="Forex" ${market==='Forex'?'selected':''}>Forex</option></select></label><label>Instrument<select id="${prefix}Stock"><option value="All">All instruments</option>${stocks.map(s=>`<option value="${esc(s)}" ${s===stock?'selected':''}>${esc(s)}</option>`).join('')}</select></label></div>`}
function moneyFmt(n,c){let x=Number(n||0);return (c==='USD'?'$':'₹')+Math.abs(x).toLocaleString(undefined,{maximumFractionDigits:2,minimumFractionDigits:2})}
function signedMoney(n,c){let x=Number(n||0);return (x<0?'-':x>0?'+':'')+moneyFmt(x,c)}
function migrateLegacy(){if(localStorage.getItem(KEY)!==null)return;try{let legacy=JSON.parse(localStorage.getItem('tradetrack_records')||'[]');if(!Array.isArray(legacy)||!legacy.length)return;putTrades(legacy.map(x=>{let t=emptyTrade();t.id=x.id||uid();t.date=x.date||t.date;t.timestamp=x.timestamp||x.dateTime||t.timestamp;t.script=x.script||x.stock||x.symbol||'';t.direction=x.direction||x.side||t.direction;t.mode=x.mode||t.mode;t.market=x.market||((x.source==='MT5'||x.mt5?.ticket)?'Forex':'India');t.currency=x.currency||((x.source==='MT5'||x.mt5?.ticket)?'USD':'INR');t.answers=x.answers||x.responses||{};t.plannedEntry=x.plannedEntry||x.entry||'';t.plannedSL=x.plannedSL||x.stopLoss||'';t.plannedTarget=x.plannedTarget||x.target||'';t.lockedAt=x.lockedAt||x.createdAt||Date.now();t.verification={...t.verification,result:x.result||x.outcome||'',pnl:x.pnl||''};return t}))}catch{ /* The previous app data is left untouched if it cannot be read. */ }}
function nav(){document.querySelectorAll('[data-route]').forEach(b=>b.classList.toggle('active',b.dataset.route===route));}
function heading(title,sub,actions=''){return `<div class="page-heading"><div><h1>${title}</h1><p>${sub||''}</p></div>${actions}</div>`}
function render(){nav(); if(route==='new')renderTrade(); else if(route==='history')renderHistory(); else if(route==='analysis')renderAnalysis(); else if(route==='reports')renderReports(); else if(route==='settings')renderSyncSettings(); else renderDashboard();}
function verified(t){return ['Win','Loss','Breakeven'].includes(t.verification?.result)}
function renderDashboard(){
 const all=getTrades(),
 ts=filterTradesByTime(filterTrades(all,dashboardMarket,dashboardStock),dashboardTime),
 dashboardCurrency=dashboardMarket==='India'?'INR':dashboardMarket==='Forex'?'USD':'All',
 done=ts.filter(verified),wins=done.filter(t=>t.verification.result==='Win'),
 losses=done.filter(t=>t.verification.result==='Loss'),be=done.filter(t=>t.verification.result==='Breakeven'),
 pnlOf=t=>Number(t.verification?.pnl||0),
 pnlCur=c=>done.filter(t=>tradeCurrency(t)===c).reduce((a,t)=>a+pnlOf(t),0),
 gpCur=c=>wins.filter(t=>tradeCurrency(t)===c).reduce((a,t)=>a+Math.max(0,pnlOf(t)),0),
 glCur=c=>losses.filter(t=>tradeCurrency(t)===c).reduce((a,t)=>a+Math.abs(Math.min(0,pnlOf(t))),0),
 grossProfit=dashboardCurrency==='All'?0:wins.reduce((a,t)=>a+Math.max(0,pnlOf(t)),0),
 grossLoss=dashboardCurrency==='All'?0:losses.reduce((a,t)=>a+Math.abs(Math.min(0,pnlOf(t))),0),
 pnl=dashboardCurrency==='All'?0:done.reduce((a,t)=>a+pnlOf(t),0),
 wr=done.length?wins.length/done.length*100:0,
 strategyTs=ts.filter(hasChecklist),strategyWins=wins.filter(hasChecklist),strategyLosses=losses.filter(hasChecklist),
 avg=strategyTs.length?strategyTs.reduce((a,t)=>a+percentOf(t),0)/strategyTs.length:0,
 aw=strategyWins.length?strategyWins.reduce((a,t)=>a+percentOf(t),0)/strategyWins.length:0,
 al=strategyLosses.length?strategyLosses.reduce((a,t)=>a+percentOf(t),0)/strategyLosses.length:0,
 pf=dashboardCurrency==='All'?'—':(grossLoss?grossProfit/grossLoss:'—'),
 avgWin=dashboardCurrency==='All'?0:(wins.length?grossProfit/wins.length:0),
 avgLoss=dashboardCurrency==='All'?0:(losses.length?grossLoss/losses.length:0),
 payoff=dashboardCurrency==='All'?'—':(avgLoss?avgWin/avgLoss:'—'),
 expectancy=dashboardCurrency==='All'?0:(done.length?pnl/done.length:0),
 rrs=done.map(t=>Number(t.verification?.rr)).filter(Number.isFinite),
 avgR=rrs.length?rrs.reduce((a,n)=>a+n,0)/rrs.length:0,
 followed=done.filter(t=>t.verification?.followed==='Yes').length,
 cur=dashboardCurrency==='USD'?'USD':'INR';

 const moneyMetrics=dashboardCurrency==='All'
 ? `<div class="metric"><span>INR Net P&amp;L</span><b>${signedMoney(pnlCur('INR'),'INR')}</b></div>
    <div class="metric"><span>USD Net P&amp;L</span><b>${signedMoney(pnlCur('USD'),'USD')}</b></div>
    <div class="metric"><span>INR Gross P / L</span><b>${moneyFmt(gpCur('INR'),'INR')} / ${moneyFmt(glCur('INR'),'INR')}</b></div>
    <div class="metric"><span>USD Gross P / L</span><b>${moneyFmt(gpCur('USD'),'USD')} / ${moneyFmt(glCur('USD'),'USD')}</b></div>`
 : `<div class="metric positive"><span>Total profit</span><b>${moneyFmt(grossProfit,cur)}</b></div>
    <div class="metric negative"><span>Total loss</span><b>-${moneyFmt(grossLoss,cur)}</b></div>
    <div class="metric ${pnl>=0?'positive':'negative'}"><span>Net P&amp;L</span><b>${signedMoney(pnl,cur)}</b></div>`;

 app.innerHTML=heading('Dashboard',(dashboardMarket==='All'?'All markets':dashboardMarket==='India'?'Indian':'Forex')+' · '+(dashboardStock==='All'?'All instruments':dashboardStock),
 `<div class="top-actions"><button class="secondary" id="reportsBtn">Reports</button><button class="secondary" id="syncMt5Btn">Broker Sync</button><button class="secondary" id="backupBtn">Backup</button></div>`)+
 marketFilters(all,dashboardMarket,dashboardStock,'dashboard')+
 `<div class="card dashboard-time-filter"><label>Time period<select id="dashboardTime"><option ${dashboardTime==='Till date'?'selected':''}>Till date</option><option ${dashboardTime==='Today'?'selected':''}>Today</option><option ${dashboardTime==='Last 7 days'?'selected':''}>Last 7 days</option><option ${dashboardTime==='Last 30 days'?'selected':''}>Last 30 days</option><option ${dashboardTime==='This month'?'selected':''}>This month</option><option ${dashboardTime==='This year'?'selected':''}>This year</option></select></label></div>`+
 `<div class="metric-grid"><div class="metric"><span>Total trades</span><b>${ts.length}</b></div><div class="metric positive"><span>Wins</span><b>${wins.length}</b></div><div class="metric negative"><span>Losses</span><b>${losses.length}</b></div><div class="metric"><span>Breakeven</span><b>${be.length}</b></div><div class="metric positive"><span>Win rate</span><b>${wholePercent(wr)}</b></div><div class="metric"><span>Avg score</span><b>${wholePercent(avg)}</b></div><div class="metric positive"><span>Avg win score</span><b>${wholePercent(aw)}</b></div><div class="metric negative"><span>Avg loss score</span><b>${wholePercent(al)}</b></div>${moneyMetrics}</div>`+
 (dashboardCurrency==='All'?`<div class="notice">INR and USD are never added together. Select one currency for profit factor, expectancy and equity curve.</div>`:
 `<div class="section-label">Trading ratios (${dashboardCurrency})</div><div class="metric-grid"><div class="metric"><span>Profit factor</span><b>${typeof pf==='number'?fmt(pf):pf}</b></div><div class="metric"><span>Payoff ratio</span><b>${typeof payoff==='number'?fmt(payoff):payoff}</b></div><div class="metric"><span>Expectancy / trade</span><b>${signedMoney(expectancy,cur)}</b></div><div class="metric"><span>Average R:R</span><b>${fmt(avgR)}</b></div><div class="metric"><span>Plan followed</span><b>${done.length?wholePercent(followed/done.length*100):'—'}</b></div></div><div class="section-label">Equity curve</div><div class="card">${equityChart(done,cur)}</div>`)+
 `<div class="section-label">Score-band performance</div><div class="card table-responsive"><table class="table"><thead><tr><th>Score</th><th>Trades</th><th>Wins</th><th>Losses</th><th>Win rate</th></tr></thead><tbody>${bands(done.filter(hasChecklist)).map(x=>{let xl=x.all.filter(t=>t.verification.result==='Loss');return `<tr><td>${x.label}</td><td>${x.all.length}</td><td>${x.wins}</td><td>${xl.length}</td><td>${x.all.length?wholePercent(x.wins/x.all.length*100):'—'}</td></tr>`}).join('')}</tbody></table></div>`+
 `<div class="section-label">Monthly P&amp;L calendar</div><div class="card"><div class="calendar-controls"><button id="previousMonth">‹</button><strong>${monthLabel(calendarMonth)}</strong><button id="nextMonth">›</button></div>${calendarGrid(done,calendarMonth,dashboardCurrency)}</div>
 <div class="section-label">Recent trades</div><div class="recent-trades-list">${ts.length?ts.slice().sort((a,b)=>(b.timestamp||b.date||'').localeCompare(a.timestamp||a.date||'')).slice(0,5).map(tradeRow).join(''):`<div class="card empty">No trades saved for this view.</div>`}</div>`;
 $('#backupBtn')?.addEventListener('click',backupJSON);$('#reportsBtn')?.addEventListener('click',()=>{route='reports';render()});$('#syncMt5Btn')?.addEventListener('click',()=>{route='settings';render()});
 document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>{editingId=b.dataset.open;draft=null;route='new';render()});
 bindScreenshotButtons();
 $('#dashboardMarket')?.addEventListener('change',e=>{dashboardMarket=e.target.value;dashboardStock='All';renderDashboard()});
 $('#dashboardStock')?.addEventListener('change',e=>{dashboardStock=e.target.value;renderDashboard()});
 $('#dashboardTime')?.addEventListener('change',e=>{dashboardTime=e.target.value;renderDashboard()});
 $('#previousMonth')?.addEventListener('click',()=>{let d=new Date(calendarMonth+'-01T12:00:00');d.setMonth(d.getMonth()-1);calendarMonth=d.toISOString().slice(0,7);renderDashboard()});
 $('#nextMonth')?.addEventListener('click',()=>{let d=new Date(calendarMonth+'-01T12:00:00');d.setMonth(d.getMonth()+1);calendarMonth=d.toISOString().slice(0,7);renderDashboard()});
}
function getMt5Settings(){try{return JSON.parse(localStorage.getItem(MT5_SYNC_KEY)||'{}')}catch{return{}}}
function saveMt5Settings(s){localStorage.setItem(MT5_SYNC_KEY,JSON.stringify(s))}
function normalizedRsiSettings(s=getMt5Settings()){
 let slope=finiteOrBlank(s.rsiSlopeThreshold);
 return {
   period:Math.max(2,Number(s.rsiPeriod)||14),lookback:Math.max(3,Math.min(10,Number(s.rsiLookback)||5)),
   slopeThreshold:slope===''?0.5:Math.max(0,slope),buyMin:finiteOrBlank(s.buyRsiMin),buyMax:finiteOrBlank(s.buyRsiMax),
   sellMin:finiteOrBlank(s.sellRsiMin),sellMax:finiteOrBlank(s.sellRsiMax),longExit:finiteOrBlank(s.longExitRsi),shortExit:finiteOrBlank(s.shortExitRsi)
 };
}
function calculateRsiTrend(values,threshold=.5){
 let a=(values||[]).map(Number).filter(Number.isFinite),n=a.length;if(n<3)return {slope:'',upMoves:0,downMoves:0,trend:'Unavailable'};
 let sx=0,sy=0,sxy=0,sxx=0;for(let i=0;i<n;i++){sx+=i;sy+=a[i];sxy+=i*a[i];sxx+=i*i}
 let den=n*sxx-sx*sx,slope=den?(n*sxy-sx*sy)/den:0,upMoves=0,downMoves=0;for(let i=1;i<n;i++){if(a[i]>a[i-1])upMoves++;else if(a[i]<a[i-1])downMoves++}
 let required=Math.ceil((n-1)*.75),trend=slope>=threshold&&upMoves>=required?'Rising':slope<=-threshold&&downMoves>=required?'Falling':'Flat/Mixed';
 return {slope,upMoves,downMoves,trend};
}
function rsiValuesFromCell(v){return String(v||'').split(/[|,;]+/).map(x=>Number(x.trim())).filter(Number.isFinite)}
function rsiSnapshotFromMt5Row(x,label){
 let prefix=label==='entry'?'Entry':'Exit',used=finiteOrBlank(mt5Value(x,[prefix+' RSI'])),closed=finiteOrBlank(mt5Value(x,[prefix+' RSI Closed'])),live=finiteOrBlank(mt5Value(x,[prefix+' RSI Live'])),values=rsiValuesFromCell(mt5Value(x,[prefix+' RSI Values']));
 if(used===''&&closed===''&&live===''&&!values.length)return null;
 let threshold=finiteOrBlank(mt5Value(x,['RSI Slope Threshold']));if(threshold==='')threshold=.5;
 let calculated=calculateRsiTrend(values,Number(threshold)),slope=finiteOrBlank(mt5Value(x,[prefix+' RSI Slope']));
 return {label,used:used!==''?used:(closed!==''?closed:live),closed,live,values,slope:slope!==''?slope:calculated.slope,
   trend:String(mt5Value(x,[prefix+' RSI Trend'])||calculated.trend||'Unavailable'),upMoves:Number(mt5Value(x,[prefix+' RSI Up Moves']))||calculated.upMoves,
   downMoves:Number(mt5Value(x,[prefix+' RSI Down Moves']))||calculated.downMoves,candleTime:normalizeSheetDate(mt5Value(x,[prefix+' RSI Candle Time'])),
   capturedAt:normalizeSheetDate(mt5Value(x,[prefix+' RSI Captured At',prefix==='Entry'?'Open Time':'Close Time'])),captureMode:String(mt5Value(x,[prefix+' RSI Capture'])||'Historical backfill'),
   timeframe:String(mt5Value(x,['RSI Timeframe'])||'M1'),period:Number(mt5Value(x,['RSI Period']))||14,lookback:Number(mt5Value(x,['RSI Lookback']))||values.length||5,threshold:Number(threshold)};
}
function rangeDecision(value,min,max){let n=Number(value);if(!Number.isFinite(n)||(min===''&&max===''))return null;return (min===''||n>=Number(min))&&(max===''||n<=Number(max))}
function setAutoRsiAnswer(t,key,value){let manual=t.answers?.[key];if((manual==='Yes'||manual==='No')&&manual!==value&&!t.rsiOverrides?.[key])t.rsiOverrides[key]={value:manual,reason:'Entered manually before automatic RSI evidence was available',at:new Date().toISOString()};if(manual===value)delete t.answers[key];t.autoAnswers[key]=value}
function refreshAutoRsiAnswers(t,s=getMt5Settings()){
 t.autoAnswers=t.autoAnswers||{};t.rsiOverrides=t.rsiOverrides||{};let cfg=normalizedRsiSettings(s),entry=t.rsiEvidence?.entry,exit=t.rsiEvidence?.exit;
 if(entry){setAutoRsiAnswer(t,'Pre-Entry|RSI Trend',entry.trend===(t.direction==='Sell'?'Falling':'Rising')?'Yes':'No');let pass=rangeDecision(entry.used,t.direction==='Sell'?cfg.sellMin:cfg.buyMin,t.direction==='Sell'?cfg.sellMax:cfg.buyMax);if(pass===null)delete t.autoAnswers['Pre-Entry|RSI Level'];else setAutoRsiAnswer(t,'Pre-Entry|RSI Level',pass?'Yes':'No')}
 if(exit){let threshold=t.direction==='Sell'?cfg.shortExit:cfg.longExit,pass=threshold===''?null:(t.direction==='Sell'?Number(exit.used)<=Number(threshold):Number(exit.used)>=Number(threshold));if(pass===null)delete t.autoAnswers['Target|RSI Level'];else setAutoRsiAnswer(t,'Target|RSI Level',pass?'Yes':'No')}
 return t;
}
function renderSyncSettings(){
 let s=getMt5Settings(),rsi=normalizedRsiSettings(s),last=s.lastSync?new Date(s.lastSync).toLocaleString():'Never',today=localNow().slice(0,10),from=new Date(Date.now()-30*86400000).toISOString().slice(0,10);
 app.innerHTML=heading('Broker & cloud sync','Import broker trades and back up your TradeTrack journal')+
 `<div class="card"><h2>FundedNext Demo · MCP</h2>
 <p id="fundedNextStatus" class="hint">Checking the private FundedNext connection…</p>
 <form id="fundedNextSync"><div class="form-grid">
 <label>From date<input name="fromDate" type="date" value="${from}"></label>
 <label>To date<input name="toDate" type="date" value="${today}"></label>
 </div>
 <button class="secondary" id="testFundedNext" type="button">Test FundedNext connection</button>
 <button class="primary" type="submit">Sync FundedNext trade history</button>
 </form>
 <p class="hint">FundedNext is accessed securely through your private Google Apps Script settings. No MCP link or token is stored in this public app.</p>
 </div>
 <div class="card"><h2>Google Sheets / MT5 bridge</h2><form id="mt5Settings">
 <label>Apps Script URL<input name="url" value="${esc(s.url||'')}" placeholder="https://script.google.com/macros/s/.../exec"></label>
 <label>API Key<input name="apiKey" type="password" value="${esc(s.apiKey||'')}" placeholder="TradeTrack API key" autocomplete="off"></label>
 <div class="rsi-settings"><h3>Automatic RSI checklist · M1</h3><div class="form-grid">
 <label>RSI period<input name="rsiPeriod" type="number" min="2" max="100" value="${rsi.period}"></label>
 <label>Trend candles<input name="rsiLookback" type="number" min="3" max="10" value="${rsi.lookback}"></label>
 <label>Minimum slope<input name="rsiSlopeThreshold" type="number" min="0" step="0.1" value="${rsi.slopeThreshold}"></label>
 <label>Buy RSI minimum<input name="buyRsiMin" type="number" min="0" max="100" step="0.1" value="${rsi.buyMin}"></label>
 <label>Buy RSI maximum<input name="buyRsiMax" type="number" min="0" max="100" step="0.1" value="${rsi.buyMax}"></label>
 <label>Sell RSI minimum<input name="sellRsiMin" type="number" min="0" max="100" step="0.1" value="${rsi.sellMin}"></label>
 <label>Sell RSI maximum<input name="sellRsiMax" type="number" min="0" max="100" step="0.1" value="${rsi.sellMax}"></label>
 <label>Long exit RSI ≥<input name="longExitRsi" type="number" min="0" max="100" step="0.1" value="${rsi.longExit}"></label>
 <label>Short exit RSI ≤<input name="shortExitRsi" type="number" min="0" max="100" step="0.1" value="${rsi.shortExit}"></label>
 </div><p class="hint">Trend uses the latest completed M1 candles. Level answers remain manual until you configure the applicable entry or exit thresholds. Use the same period, lookback and slope threshold in the MT5 EA.</p></div>
 <button class="primary">Save settings &amp; sync MT5</button>
 </form>
 <p class="hint">Last successful sync: ${esc(last)}. The API key stays only in local storage on this device and is not written to your public GitHub repository.</p>
 </div>
 <div class="card"><h2>Journal cloud backup</h2>
 <button class="primary" id="pushJournal">Upload local journal to Google Sheets</button>
 <button class="secondary" id="pullJournal">Restore / merge journal from Google Sheets</button>
 <p class="hint">Trade details and checklist answers are backed up to Sheets. New screenshots are uploaded to your private TradeTrack AI Screenshots folder in Google Drive.</p></div>
 <button class="secondary" id="backDashboard">Back to dashboard</button>`;
 $('#testFundedNext').onclick=async()=>{
   if(!s.url||!s.apiKey){alert('Save the Apps Script URL and API key first.');return}
   try{let data=await apiPost({action:'testFundedNext'},s),names=(data.tools||[]).map(x=>x.name).filter(Boolean);alert(`FundedNext MCP connected.${names.length?' Available tools: '+names.join(', '):''}`);await loadFundedNextStatus(s)}catch(err){console.error(err);alert(`FundedNext connection test failed: ${err.message}`)}
 };
 $('#fundedNextSync').onsubmit=async e=>{
   e.preventDefault();if(!s.url||!s.apiKey){alert('Save the Apps Script URL and API key first.');return}
   let button=e.target.querySelector('[type="submit"]'),f=new FormData(e.target);button.disabled=true;
   try{let result=await apiPost({action:'syncFundedNext',fromDate:String(f.get('fromDate')||''),toDate:String(f.get('toDate')||'')},s);$('#fundedNextStatus').textContent=`FundedNext history saved: ${result.added||0} new, ${result.updated||0} updated. Importing into this device…`;await syncGoogleSheets(s)}catch(err){console.error(err);alert(`FundedNext sync failed: ${err.message}`);button.disabled=false}
 };
 $('#mt5Settings').onsubmit=async e=>{
   e.preventDefault();
   let f=new FormData(e.target),next={...s,url:String(f.get('url')||'').trim(),apiKey:String(f.get('apiKey')||'').trim(),rsiPeriod:String(f.get('rsiPeriod')||'14'),rsiLookback:String(f.get('rsiLookback')||'5'),rsiSlopeThreshold:String(f.get('rsiSlopeThreshold')||'0.5'),buyRsiMin:String(f.get('buyRsiMin')||''),buyRsiMax:String(f.get('buyRsiMax')||''),sellRsiMin:String(f.get('sellRsiMin')||''),sellRsiMax:String(f.get('sellRsiMax')||''),longExitRsi:String(f.get('longExitRsi')||''),shortExitRsi:String(f.get('shortExitRsi')||'')};
   let cfg=normalizedRsiSettings(next);if((cfg.buyMin!==''&&cfg.buyMax!==''&&cfg.buyMin>cfg.buyMax)||(cfg.sellMin!==''&&cfg.sellMax!==''&&cfg.sellMin>cfg.sellMax)){alert('An RSI minimum cannot be greater than its maximum.');return}
   saveMt5Settings(next);
   putTrades(getTrades().map(t=>refreshAutoRsiAnswers(t,next)));
   await syncGoogleSheets(next);
 };
 $('#pushJournal').onclick=async()=>{await pushAllJournalToCloud()};
 $('#pullJournal').onclick=async()=>{await pullJournalFromCloud()};
 $('#backDashboard').onclick=()=>{route='dashboard';render()}
 loadFundedNextStatus(s);
}
async function loadFundedNextStatus(s=getMt5Settings()){
 let target=$('#fundedNextStatus');if(!target)return;
 if(!s.url||!s.apiKey){target.textContent='Save the Apps Script URL and API key below to check FundedNext.';return}
 try{let data=await apiGet('fundedNextStatus',s);target.textContent=data.configured?`Configured${data.accountId?' · Account '+data.accountId:''} · History tool: ${data.historyTool||'Auto-detect'} · Last sync: ${data.lastSync?new Date(data.lastSync).toLocaleString():'Never'}`:'Not configured. Add the private FundedNext MCP link in Apps Script Script Properties.'}catch(err){target.textContent='Unable to read FundedNext status: '+err.message}
}
function normalizeSheetDate(v){
 if(v===null||v===undefined||v==='')return '';
 let s=String(v).trim();
 // MT5 commonly sends YYYY.MM.DD HH:MM:SS.
 let m=s.match(/^(\d{4})[.\-/](\d{2})[.\-/](\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
 if(m){
   let out=`${m[1]}-${m[2]}-${m[3]}`;
   if(m[4])out+=`T${m[4]}:${m[5]}${m[6]?':'+m[6]:''}`;
   return out;
 }
 let d=new Date(s);
 if(!isNaN(d.getTime()))return localIsoFromDate(d);
 return s.replace(' ','T');
}
function localIsoFromDate(d){
 let z=d.getTimezoneOffset()*60000;
 return new Date(d-z).toISOString().replace(/Z$/,'');
}
function parseLocalTime(v){
 let s=normalizeSheetDate(v);
 let d=new Date(s);
 return isNaN(d.getTime())?NaN:d.getTime();
}
function findPlannedMatch(all,x,direction,closed){
 let symbol=String(x['Symbol']||'').trim().toLowerCase(),closeMs=parseLocalTime(closed);
 let candidates=all.filter(t=>{
   if(t.source==='MT5'||t.mt5?.ticket)return false;
   if(String(t.script||'').trim().toLowerCase()!==symbol)return false;
   if(String(t.direction||'').toLowerCase()!==direction.toLowerCase())return false;
   let tm=parseLocalTime(t.timestamp||t.date);
   if(Number.isFinite(closeMs)&&Number.isFinite(tm))return Math.abs(closeMs-tm)<=24*60*60*1000;
   return normalizeSheetDate(t.date).slice(0,10)===normalizeSheetDate(closed).slice(0,10);
 });
 if(!candidates.length)return null;
 candidates.sort((a,b)=>{
   let aa=Math.abs(closeMs-parseLocalTime(a.timestamp||a.date)),bb=Math.abs(closeMs-parseLocalTime(b.timestamp||b.date));
   return (Number.isFinite(aa)?aa:1e18)-(Number.isFinite(bb)?bb:1e18);
 });
 return candidates[0];
}
async function apiGet(action,s=getMt5Settings(),rawAction=false){
 if(!s.url||!s.apiKey)throw new Error('Enter the Apps Script URL and API key first.');
 let sep=s.url.includes('?')?'&':'?';
 let actionPart=rawAction?action:`action=${encodeURIComponent(action)}`;
 let url=`${s.url}${sep}${actionPart}&apiKey=${encodeURIComponent(s.apiKey)}&_=${Date.now()}`;
 let response=await fetch(url,{cache:'no-store'});
 if(!response.ok)throw new Error(`HTTP ${response.status}`);
 let data=await response.json();
 if(!data.ok)throw new Error(data.error||'API returned an error');
 return data;
}
async function apiPost(payload,s=getMt5Settings()){
 if(!s.url||!s.apiKey)throw new Error('Cloud sync is not configured.');
 let response=await fetch(s.url,{
   method:'POST',
   headers:{'Content-Type':'text/plain;charset=utf-8'},
   body:JSON.stringify({...payload,apiKey:s.apiKey}),
   redirect:'follow'
 });
 if(!response.ok)throw new Error(`Apps Script returned HTTP ${response.status}`);
 let text=await response.text(),data;
 try{data=JSON.parse(text)}catch{throw new Error('Apps Script did not return JSON. Confirm the /exec URL and deploy the latest Code.gs as a web app executed by you.')}
 if(!data.ok)throw new Error(data.error||'API returned an error');
 return data;
}
function tradeCloudPayload(t){
 let v=t.verification||{};
 return {
   action:'saveTrade',tradeId:t.id,date:t.date||'',time:(t.timestamp||'').slice(11,16),
   mode:t.mode||'',market:t.market||'',currency:tradeCurrency(t),script:t.script||'',direction:t.direction||'',
   plannedEntry:t.plannedEntry||'',plannedSL:t.plannedSL||'',plannedTarget:t.plannedTarget||'',
   preEntryPercent:categoryPercent(t,groups[0]),entryPercent:categoryPercent(t,groups[1]),
   slPercent:categoryPercent(t,groups[2]),targetPercent:categoryPercent(t,groups[3]),
   overallPercent:percentOf(t),strategyGrade:qualification(percentOf(t)),
   locked:!!t.lockedAt,mt5Ticket:t.mt5?.ticket||'',
   actualEntry:v.actualEntry??'',actualExit:v.actualExit??'',result:v.result||'',
   pnl:v.pnl??'',rr:v.rr??'',followedSetup:v.followed||'',movedSL:v.movedSL||'',
   exitedEarly:v.exitedEarly||'',reviewNotes:v.notes||'',beforeScreenshotUrl:t.beforeImageUrl||'',afterScreenshotUrl:v.afterImageUrl||''
 };
}
function checklistCloudPayload(t){
 let a=key=>answerValue(t,key);
 return {
   action:'saveChecklist',tradeId:t.id,date:t.date||'',script:t.script||'',mode:t.mode||'',
   rsiTrend:a('Pre-Entry|RSI Trend'),rsiLevel:a('Pre-Entry|RSI Level'),
   liquidityPre:a('Pre-Entry|Liquidity (SL Hunt)'),engulfingPre:a('Pre-Entry|Engulfing Candle'),
   divergent:a('Pre-Entry|Divergent'),obEntry:a('Entry|OB Entry (On retracement)'),
   candleCloseEntry:a('Entry|Candle Close Entry'),engulfingSL:a('SL|Engulfing Candle'),
   nearestSwing:a('SL|Nearest Swing'),othersSL:a('SL|Others'),
   rsiTarget:a('Target|RSI Level'),oppositeEngulfing:a('Target|Opposite Engulfing Candle'),
   liquidityTarget:a('Target|Liquidity (SL Hunt)'),othersTarget:a('Target|Others'),
   preEntryScore:categoryScore(t,groups[0]),entryScore:categoryScore(t,groups[1]),
   slScore:categoryScore(t,groups[2]),targetScore:categoryScore(t,groups[3]),
   overallScore:scoreOf(t),lockedAt:t.lockedAt?new Date(t.lockedAt).toISOString():'',
   autoRsiAnswers:JSON.stringify(t.autoAnswers||{}),rsiOverrides:JSON.stringify(t.rsiOverrides||{}),
   entryRsiEvidence:JSON.stringify(t.rsiEvidence?.entry||null),exitRsiEvidence:JSON.stringify(t.rsiEvidence?.exit||null)
 };
}
async function uploadScreenshotToDrive(t,kind,s=getMt5Settings()){
 let dataUrl=kind==='before'?t.beforeImage:t.verification?.afterImage;
 if(!dataUrl||!String(dataUrl).startsWith('data:image/'))return '';
 let existing=kind==='before'?t.beforeImageUrl:t.verification?.afterImageUrl;
 if(existing)return existing;
 let res=await apiPost({action:'uploadScreenshot',tradeId:t.id,kind,dataUrl,script:t.script||'',date:t.date||''},s);
 if(kind==='before')t.beforeImageUrl=res.url||'';else{t.verification=t.verification||{};t.verification.afterImageUrl=res.url||''}
 let all=getTrades(),i=all.findIndex(x=>x.id===t.id);if(i>=0){all[i]=t;putTrades(all)}
 return res.url||'';
}
async function pushTradeToCloud(t,s=getMt5Settings()){
 if(!s.url||!s.apiKey)return {skipped:true,message:'Trade saved on this device. Google Drive upload was skipped because cloud sync is not configured.'};
 let uploaded=[],failures=[];
 for(const kind of ['before','after']){
   const hasLocal=kind==='before'?!!t.beforeImage:!!t.verification?.afterImage;
   const hasDrive=kind==='before'?!!t.beforeImageUrl:!!t.verification?.afterImageUrl;
   if(hasLocal&&!hasDrive){
     try{await uploadScreenshotToDrive(t,kind,s);uploaded.push(kind==='before'?'setup':'after-trade')}
     catch(e){failures.push(`${kind==='before'?'Setup':'After-trade'} screenshot: ${e.message}`)}
   }
 }
 await apiPost(tradeCloudPayload(t),s);
 if(hasChecklist(t))await apiPost(checklistCloudPayload(t),s);
 let all=getTrades(),i=all.findIndex(x=>x.id===t.id);if(i>=0){all[i]=t;putTrades(all)}
 if(failures.length)throw new Error(`Trade saved locally and backed up to Google Sheets, but Drive upload failed. ${failures.join(' | ')}`);
 return {ok:true,uploaded,message:uploaded.length?`Trade saved. ${uploaded.join(' and ')} screenshot${uploaded.length>1?'s were':' was'} uploaded to Google Drive.`:'Trade saved and backed up to Google Sheets.'};
}
async function pushAllJournalToCloud(){
 let s=getMt5Settings();
 if(!s.url||!s.apiKey){alert('Save your Apps Script URL and API key first.');return}
 let all=getTrades(),ok=0,failed=0;
 for(const t of all){
   try{await pushTradeToCloud(t,s);ok++}catch(e){console.error(e);failed++}
 }
 alert(`Journal upload complete: ${ok} uploaded${failed?`, ${failed} failed`:''}.`);
}
function checklistFromCloudRow(c){
 let a={};
 const map=[
  ['Pre-Entry|RSI Trend','RSI Trend'],['Pre-Entry|RSI Level','RSI Level'],
  ['Pre-Entry|Liquidity (SL Hunt)','Liquidity (SL Hunt)'],['Pre-Entry|Engulfing Candle','Engulfing Candle - Pre'],
  ['Pre-Entry|Divergent','Divergent'],['Entry|OB Entry (On retracement)','OB Entry (On retracement)'],
  ['Entry|Candle Close Entry','Candle Close Entry'],['SL|Engulfing Candle','Engulfing Candle - SL'],
  ['SL|Nearest Swing','Nearest Swing'],['SL|Others','Others - SL'],['Target|RSI Level','RSI Level - Target'],
  ['Target|Opposite Engulfing Candle','Opposite Engulfing Candle'],['Target|Liquidity (SL Hunt)','Liquidity (SL Hunt) - Target'],
  ['Target|Others','Others - Target']
 ];
 map.forEach(([k,h])=>{let v=String(c?.[h]??'');if(v==='Yes'||v==='No')a[k]=v});
 return a;
}
function cloudJson(v,fallback){try{let parsed=JSON.parse(String(v||''));return parsed&&typeof parsed==='object'?parsed:fallback}catch{return fallback}}
async function pullJournalFromCloud(){
 let s=getMt5Settings();
 try{
   let [tr,cl]=await Promise.all([apiGet('getTrades',s),apiGet('getChecklist',s)]);
   let checklistById={};(cl.checklist||[]).forEach(c=>checklistById[String(c['Trade ID']||'')]=c);
   let all=getTrades(),added=0,updated=0;
   for(const r of (tr.trades||[])){
     let id=String(r['Trade ID']||'').trim();if(!id)continue;
     if(getDeletedIds().has(id))continue;
     let i=all.findIndex(t=>String(t.id)===id),old=i>=0?all[i]:null,c=checklistById[id];
     let date=normalizeSheetDate(r['Date']||c?.['Date']||'').slice(0,10);
     let tm=String(r['Time']||'').trim(),timestamp=date+(tm?`T${tm}`:'T00:00');
     let answers=c?checklistFromCloudRow(c):(old?.answers||{});
     let autoAnswers=c?cloudJson(c['Auto RSI Answers JSON'],old?.autoAnswers||{}):(old?.autoAnswers||{}),rsiOverrides=c?cloudJson(c['RSI Overrides JSON'],old?.rsiOverrides||{}):(old?.rsiOverrides||{});
     let rsiEvidence={entry:c?cloudJson(c['Entry RSI Evidence JSON'],old?.rsiEvidence?.entry||null):(old?.rsiEvidence?.entry||null),exit:c?cloudJson(c['Exit RSI Evidence JSON'],old?.rsiEvidence?.exit||null):(old?.rsiEvidence?.exit||null)};
     let t={
       id,date,timestamp,mode:String(r['Mode']||c?.['Mode']||old?.mode||'Paper'),market:String(r['Market']||old?.market||'India'),currency:String(r['Currency']||old?.currency||'INR'),
       script:String(r['Script']||c?.['Script']||old?.script||''),direction:String(r['Direction']||old?.direction||'Buy'),
       plannedEntry:r['Planned Entry']??old?.plannedEntry??'',plannedSL:r['Planned SL']??old?.plannedSL??'',
       plannedTarget:r['Planned Target']??old?.plannedTarget??'',answers,autoAnswers,rsiOverrides,rsiEvidence,beforeImage:old?.beforeImage||'',beforeImageUrl:String(r['Before Screenshot URL']||old?.beforeImageUrl||''),
       lockedAt:old?.lockedAt||Date.now(),source:old?.source||'Cloud',
       mt5:old?.mt5||((r['MT5 Ticket']||'')?{ticket:String(r['MT5 Ticket'])}:undefined),
       verification:{
         ...(old?.verification||{}),actualEntry:r['Actual Entry']??'',actualExit:r['Actual Exit']??'',
         result:String(r['Result']||''),pnl:r['P&L']??'',rr:r['R:R']??'',
         followed:String(r['Followed Setup']||''),movedSL:String(r['Moved SL']||''),
         exitedEarly:String(r['Exited Early']||''),notes:String(r['Review Notes']||old?.verification?.notes||''),
         afterImage:old?.verification?.afterImage||'',afterImageUrl:String(r['After Screenshot URL']||old?.verification?.afterImageUrl||'')
       }
     };
     if(i<0){all.unshift(t);added++}else{all[i]={...old,...t};updated++}
   }
   putTrades(all);
   let next={...s,lastSync:new Date().toISOString()};saveMt5Settings(next);
   alert(`Journal restore complete: ${added} new, ${updated} updated trade(s).`);
   route='dashboard';render();
 }catch(err){console.error(err);alert(`Journal restore failed: ${err.message}`)}
}
function mt5Value(x,names){for(const name of names){let v=x?.[name];if(v!==undefined&&v!==null&&String(v).trim()!=='')return v}return ''}
function mt5Identity(x){
 let account=String(mt5Value(x,['Account Login','Account ID','Login'])||'default').trim();
 let deal=String(mt5Value(x,['Deal ID','MT5 Ticket'])||'').trim();
 if(deal)return `${account}:${deal}`;
 let position=String(mt5Value(x,['Position ID','Order ID'])||'').trim(),closed=normalizeSheetDate(mt5Value(x,['Close Time','Open Time'])),symbol=String(x?.['Symbol']||'').trim(),volume=String(mt5Value(x,['Volume','Lots','Quantity'])||'').trim(),exit=String(mt5Value(x,['Close Price','Exit Price','Exit'])||'').trim();
 return position&&closed&&symbol?`${account}:fallback:${position}:${closed}:${symbol}:${volume}:${exit}`:'';
}
function existingMt5Identity(t){return String(t?.mt5?.identity||((t?.mt5?.dealId||t?.mt5?.ticket)?`${t?.mt5?.account||'default'}:${t.mt5.dealId||t.mt5.ticket}`:''))}
async function syncGoogleSheets(s=getMt5Settings(),options={}){
 let silent=!!options.silent;
 if(!s.url||!s.apiKey){if(!silent)alert('Enter the Apps Script URL and API key first.');return null}
 try{
   let data=await apiGet('getMT5',s);
   let rows=Array.isArray(data.mt5)?data.mt5:[],all=getTrades(),fetched=rows.length,added=0,updated=0,linked=0,skipped=0,errors=0;
   let seen=new Set(),claimedJournalIds=new Set(all.filter(t=>existingMt5Identity(t)).map(t=>String(t.id)));
   for(const x of rows){
     try{
     let identity=mt5Identity(x);
     if(!identity||!String(x['Symbol']||'').trim()){skipped++;continue}
     if(getDeletedIds().has('mt5:'+identity)){skipped++;continue}
     if(seen.has(identity)){skipped++;continue}seen.add(identity);
     let ticket=String(mt5Value(x,['MT5 Ticket','Deal ID'])).trim(),dealId=String(mt5Value(x,['Deal ID','MT5 Ticket'])).trim();
     let id='mt5-'+identity.replace(/[^a-zA-Z0-9_.:-]/g,'_'),i=all.findIndex(t=>existingMt5Identity(t)===identity||t.id===id);
     if(getDeletedIds().has(id)){skipped++;continue}
     let pnl=Number(mt5Value(x,['Net P&L','Profit']));if(!Number.isFinite(pnl))pnl=0;
     let closed=normalizeSheetDate(x['Close Time']||x['Open Time']||localNow());
     let opened=normalizeSheetDate(x['Open Time']||closed);
     if(!closed||!Number.isFinite(parseLocalTime(closed))){skipped++;continue}
     let direction=String(x['Direction']||'').toLowerCase()==='sell'?'Sell':'Buy';
     let planned=i<0?findPlannedMatch(all.filter(t=>!claimedJournalIds.has(String(t.id))),x,direction,closed):null;
     if(i<0&&planned){i=all.findIndex(t=>t.id===planned.id);id=planned.id;linked++}
     let old=i>=0?all[i]:null;
     if(planned)claimedJournalIds.add(String(planned.id));
     let importedRsi={entry:rsiSnapshotFromMt5Row(x,'entry'),exit:rsiSnapshotFromMt5Row(x,'exit')};
     let v={
       ...(old?.verification||{}),
       actualEntry:x['Open Price']??x['Entry Price']??x['Entry']??old?.verification?.actualEntry??'',
       actualSL:x['SL']??x['Stop Loss']??old?.verification?.actualSL??'',
       actualTarget:x['TP']??x['Take Profit']??x['Target']??old?.verification?.actualTarget??'',
       actualExit:x['Close Price']??x['Exit Price']??x['Exit']??old?.verification?.actualExit??'',
       quantity:x['Volume']??x['Lots']??x['Quantity']??old?.verification?.quantity??'1',
       lotSize:old?.verification?.lotSize||'1',
       charges:Math.abs(Number(x['Commission']||0))+Math.abs(Number(x['Swap']||0)),
       pnl,result:pnl>0?'Win':pnl<0?'Loss':'Breakeven',
       notes:old?.verification?.notes||'Imported from MT5 via Google Sheets',
       afterImage:old?.verification?.afterImage||'',afterImageUrl:old?.verification?.afterImageUrl||''
     };
      let importedRr=Number(mt5Value(x,['R:R','RR','Risk Reward','Risk/Reward']));
      v.rr=Number.isFinite(importedRr)&&importedRr!==0?importedRr:riskReward(v,direction);
     let t={
       ...(old||{}),id,mode:old?.mode||'Live',market:isIndianSymbol(x['Symbol'])?'India':(old?.market||'Forex'),currency:isIndianSymbol(x['Symbol'])?'INR':(old?.currency||'USD'),date:closed.slice(0,10),timestamp:closed.slice(0,16),
       script:String(x['Symbol']||old?.script||''),direction,
       plannedEntry:old?.plannedEntry||'',plannedSL:old?.plannedSL||'',plannedTarget:old?.plannedTarget||'',
       answers:old?.answers||{},autoAnswers:old?.autoAnswers||{},rsiOverrides:old?.rsiOverrides||{},
       rsiEvidence:{entry:importedRsi.entry||old?.rsiEvidence?.entry||null,exit:importedRsi.exit||old?.rsiEvidence?.exit||null},beforeImage:old?.beforeImage||'',beforeImageUrl:old?.beforeImageUrl||'',
       lockedAt:old?.lockedAt||(parseLocalTime(closed)||Date.now()),verification:v,source:'MT5',
       mt5:{
         ...(old?.mt5||{}),identity,account:String(mt5Value(x,['Account Login','Account ID','Login'])||'default'),ticket,orderId:x['Order ID']||'',positionId:x['Position ID']||'',dealId,symbol:x['Symbol']||'',
         volume:x['Volume']??x['Lots']??x['Quantity']??old?.mt5?.volume??'',openTime:opened,closeTime:closed,
         entry:x['Open Price']??x['Entry Price']??x['Entry']??old?.mt5?.entry??old?.verification?.actualEntry??'',
         exit:x['Close Price']??x['Exit Price']??x['Exit']??old?.mt5?.exit??old?.verification?.actualExit??'',
         sl:x['SL']??x['Stop Loss']??old?.mt5?.sl??old?.verification?.actualSL??'',
         target:x['TP']??x['Take Profit']??x['Target']??old?.mt5?.target??old?.verification?.actualTarget??'',profit:x['Profit']??'',
         commission:x['Commission']??'',swap:x['Swap']??'',pnl,comment:x['Comment']||'',
         magicNumber:x['Magic Number']||'',lastSyncedAt:x['Last Synced At']||''
       }
     };
     refreshAutoRsiAnswers(t,s);
     if(i<0){all.unshift(t);added++}else{all[i]=t;updated++}
     }catch(rowError){console.error('MT5 row import failed',rowError,x);errors++}
   }
   putTrades(all);
   let next={...s,lastSync:new Date().toISOString()};saveMt5Settings(next);
    let mt5OnDevice=all.filter(t=>!!existingMt5Identity(t)).length,counts={fetched,new:added,updated,linked,skipped,errors,mt5OnDevice};
    if(!silent)alert(`MT5 sync complete\nFetched: ${fetched}\nNew: ${added}\nUpdated: ${updated}\nLinked to journal: ${linked}\nSkipped: ${skipped}\nErrors: ${errors}\nMT5 trades on device: ${mt5OnDevice}`);
    dashboardMarket='All';dashboardStock='All';dashboardTime='Till date';
   route='dashboard';render();
   return counts;
 }catch(err){
   console.error('TradeTrack Google sync error',err);
   if(!silent)alert(`MT5 sync failed: ${err.message}`);
   return null;
 }
}
function equityChart(trades,currency='INR'){let data=trades.slice().sort((a,b)=>(a.timestamp||a.date||'').localeCompare(b.timestamp||b.date||'')).map(t=>Number(t.verification?.pnl||0)),running=0,points=[0,...data.map(n=>running+=n)],min=Math.min(...points,0),max=Math.max(...points,0),range=max-min||1,w=320,h=130,pts=points.map((n,i)=>`${8+i*(w-16)/Math.max(1,points.length-1)},${h-18-(n-min)*(h-36)/range}`).join(' '),zero=h-18-(0-min)*(h-36)/range;return data.length?`<svg class="equity-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Cumulative profit and loss chart"><line x1="8" x2="${w-8}" y1="${zero}" y2="${zero}"/><polyline points="${pts}"/><text x="8" y="12">Net P&amp;L ${esc(signedMoney(running,currency))}</text><text x="8" y="${h-3}">First</text><text x="${w-42}" y="${h-3}">Latest</text></svg>`:`<div class="empty">Add verified trades with P&amp;L to see your equity curve.</div>`}
function calendarGrid(trades,month,currency='All'){let first=new Date(month+'-01T12:00:00'),days=new Date(first.getFullYear(),first.getMonth()+1,0).getDate(),start=first.getDay(),byDay={};trades.filter(t=>(t.date||'').startsWith(month)&&(currency==='All'||tradeCurrency(t)===currency)).forEach(t=>{let d=Number((t.date||'').slice(-2));byDay[d]=(byDay[d]||0)+Number(t.verification?.pnl||0)});let cells=Array.from({length:start+days},(_,i)=>{if(i<start)return '<div class="cal-cell empty-day"></div>';let d=i-start+1,p=byDay[d],cls=p>0?'profit-day':p<0?'loss-day':'',label=p!==undefined?(currency==='All'?fmt(p):signedMoney(p,currency)):'';return `<div class="cal-cell ${cls}"><b>${d}</b>${p!==undefined?`<small>${esc(label)}</small>`:''}</div>`});return `<div class="calendar-week">${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>`<span>${d}</span>`).join('')}</div><div class="calendar-grid">${cells.join('')}</div><p class="hint">${currency==='All'?'Select INR or USD for money-correct daily totals.':'Green = profitable day · Red = losing day'}</p>`}
function mt5Stats(trades){let x=trades.filter(verified).slice().sort((a,b)=>(a.timestamp||a.date||'').localeCompare(b.timestamp||b.date||'')),p=x.map(t=>Number(t.verification?.pnl||0)),wins=p.filter(n=>n>0),losses=p.filter(n=>n<0),grossProfit=wins.reduce((a,n)=>a+n,0),grossLoss=Math.abs(losses.reduce((a,n)=>a+n,0)),net=p.reduce((a,n)=>a+n,0),latest=x.filter(t=>t.mt5?.balance!==undefined).slice(-1)[0]?.mt5,initial=latest?Number(latest.balance)-net:0,equity=initial,peak=initial,minBalance=initial,maxDD=0,maxDDPct=0,curWin=0,curLoss=0,curWinSum=0,curLossSum=0,maxWin=0,maxLoss=0,maxWinSum=0,maxLossSum=0,winRuns=[],lossRuns=[];for(const n of p){equity+=n;peak=Math.max(peak,equity);minBalance=Math.min(minBalance,equity);let dd=peak-equity;maxDD=Math.max(maxDD,dd);maxDDPct=Math.max(maxDDPct,peak?dd/peak*100:0);if(n>0){if(curLoss){lossRuns.push({count:curLoss,sum:curLossSum});curLoss=curLossSum=0}curWin++;curWinSum+=n;if(curWin>maxWin){maxWin=curWin;maxWinSum=curWinSum}}else if(n<0){if(curWin){winRuns.push({count:curWin,sum:curWinSum});curWin=curWinSum=0}curLoss++;curLossSum+=n;if(curLoss>maxLoss){maxLoss=curLoss;maxLossSum=curLossSum}}else{if(curWin)winRuns.push({count:curWin,sum:curWinSum});if(curLoss)lossRuns.push({count:curLoss,sum:curLossSum});curWin=curLoss=curWinSum=curLossSum=0}}if(curWin)winRuns.push({count:curWin,sum:curWinSum});if(curLoss)lossRuns.push({count:curLoss,sum:curLossSum});let mean=x.length?net/x.length:0,variance=x.length?p.reduce((a,n)=>a+(n-mean)**2,0)/x.length:0,sharpe=variance?mean/Math.sqrt(variance):0,side=dir=>{let a=x.filter(t=>t.direction===dir),w=a.filter(t=>Number(t.verification?.pnl||0)>0).length;return {all:a.length,wins:w,rate:a.length?w/a.length*100:0}};let result={x,p,wins,losses,grossProfit,grossLoss,net,profitFactor:grossLoss?grossProfit/grossLoss:0,expected:mean,avgWin:wins.length?grossProfit/wins.length:0,avgLoss:losses.length?grossLoss/losses.length:0,initial,minBalance,maxDD,maxDDPct,recovery:maxDD?net/maxDD:0,sharpe,maxWin,maxLoss,maxWinSum,maxLossSum,avgWinStreak:winRuns.length?winRuns.reduce((a,r)=>a+r.count,0)/winRuns.length:0,avgLossStreak:lossRuns.length?lossRuns.reduce((a,r)=>a+r.count,0)/lossRuns.length:0,best:Math.max(0,...p),worst:Math.min(0,...p),long:side('Buy'),short:side('Sell')};setTimeout(()=>renderMt5Results(result),0);return result}
function renderMt5Results(s){let target=$('.equity-chart')?.closest('.card');if(!target)return;target.insertAdjacentHTML('beforebegin',`<div class="section-label">MT5 results</div><div class="card table-responsive"><table class="table"><tbody><tr><th>Total net profit</th><td>${s.net>=0?'+':''}${fmt(s.net)}</td><th>Gross profit</th><td>+${fmt(s.grossProfit)}</td><th>Gross loss</th><td>-${fmt(s.grossLoss)}</td></tr><tr><th>Profit factor</th><td>${s.grossLoss?fmt(s.profitFactor):'—'}</td><th>Expected payoff</th><td>${s.expected>=0?'+':''}${fmt(s.expected)}</td><th>Recovery factor</th><td>${s.maxDD?fmt(s.recovery):'—'}</td></tr><tr><th>Trade Sharpe ratio</th><td>${fmt(s.sharpe)}</td><th>Absolute drawdown</th><td>${fmt(Math.max(0,s.initial-s.minBalance))}</td><th>Maximal drawdown</th><td>${fmt(s.maxDD)} (${fmt(s.maxDDPct)}%)</td></tr><tr><th>Relative drawdown</th><td>${fmt(s.maxDDPct)}% (${fmt(s.maxDD)})</td><th>Profit trades</th><td>${s.wins.length} (${s.x.length?fmt(s.wins.length/s.x.length*100):0}%)</td><th>Loss trades</th><td>${s.losses.length} (${s.x.length?fmt(s.losses.length/s.x.length*100):0}%)</td></tr><tr><th>Max consecutive wins</th><td>${s.maxWin} (+${fmt(s.maxWinSum)})</td><th>Max consecutive losses</th><td>${s.maxLoss} (${fmt(s.maxLossSum)})</td><th>Average consecutive wins</th><td>${fmt(s.avgWinStreak)}</td></tr><tr><th>Average consecutive losses</th><td>${fmt(s.avgLossStreak)}</td><th>Largest profit trade</th><td>+${fmt(s.best)}</td><th>Largest loss trade</th><td>${fmt(s.worst)}</td></tr></tbody></table></div>`) }
function renderReports(){let all=getTrades(),stocks=[...new Set(all.map(t=>t.script).filter(Boolean))].sort(),ts=dashboardStock==='All'?all:all.filter(t=>t.script===dashboardStock),s=mt5Stats(ts),latest=ts.filter(t=>t.source==='MT5').sort((a,b)=>(b.timestamp||b.date||'').localeCompare(a.timestamp||a.date||''))[0]?.mt5||{};app.innerHTML=heading('MT5 reports',dashboardStock==='All'?'All stocks combined':dashboardStock,`<div class="top-actions"><button class="secondary" id="backToDashboard">Dashboard</button></div>`)+`<div class="card dashboard-filter"><label>View stock<select id="reportStock"><option>All</option>${stocks.map(n=>`<option ${n===dashboardStock?'selected':''}>${esc(n)}</option>`).join('')}</select></label></div><div class="section-label">Account snapshot</div><div class="metric-grid"><div class="metric"><span>Balance</span><b>${latest.balance!==undefined?fmt(latest.balance):'—'}</b></div><div class="metric"><span>Equity</span><b>${latest.equity!==undefined?fmt(latest.equity):'—'}</b></div><div class="metric"><span>Free margin</span><b>${latest.freeMargin!==undefined?fmt(latest.freeMargin):'—'}</b></div></div><div class="section-label">Profit &amp; loss</div><div class="metric-grid"><div class="metric positive"><span>Gross profit</span><b>+${fmt(s.grossProfit)}</b></div><div class="metric negative"><span>Gross loss</span><b>-${fmt(s.grossLoss)}</b></div><div class="metric ${s.net>=0?'positive':'negative'}"><span>Net profit</span><b>${s.net>=0?'+':''}${fmt(s.net)}</b></div><div class="metric"><span>Profit factor</span><b>${s.grossLoss?fmt(s.profitFactor):'—'}</b></div><div class="metric"><span>Expected payoff</span><b>${s.expected>=0?'+':''}${fmt(s.expected)}</b></div><div class="metric"><span>Max drawdown</span><b>-${fmt(s.maxDD)}</b></div></div><div class="section-label">Trade quality</div><div class="metric-grid"><div class="metric"><span>Average win</span><b>+${fmt(s.avgWin)}</b></div><div class="metric"><span>Average loss</span><b>-${fmt(s.avgLoss)}</b></div><div class="metric positive"><span>Largest win</span><b>+${fmt(s.best)}</b></div><div class="metric negative"><span>Largest loss</span><b>${fmt(s.worst)}</b></div><div class="metric"><span>Max win streak</span><b>${s.maxWin}</b></div><div class="metric"><span>Max loss streak</span><b>${s.maxLoss}</b></div></div><div class="section-label">Long / short performance</div><div class="card table-responsive"><table class="table"><thead><tr><th>Direction</th><th>Trades</th><th>Wins</th><th>Win rate</th></tr></thead><tbody><tr><td>Buy / Long</td><td>${s.long.all}</td><td>${s.long.wins}</td><td>${s.long.all?fmt(s.long.rate)+'%':'—'}</td></tr><tr><td>Sell / Short</td><td>${s.short.all}</td><td>${s.short.wins}</td><td>${s.short.all?fmt(s.short.rate)+'%':'—'}</td></tr></tbody></table></div><div class="section-label">Equity curve</div><div class="card">${equityChart(s.x)}</div><p class="hint">Account values appear after you update the MT5 Expert Advisor and sync a newly closed trade. Drawdown is calculated from imported closed-trade P&amp;L.</p>`;$('#reportStock').onchange=e=>{dashboardStock=e.target.value;renderReports()};$('#backToDashboard').onclick=()=>{route='dashboard';render()}}
function bands(ts){return [{label:'90–100%',test:p=>p>=90},{label:'80–89%',test:p=>p>=80&&p<90},{label:'70–79%',test:p=>p>=70&&p<80},{label:'60–69%',test:p=>p>=60&&p<70},{label:'Below 60%',test:p=>p<60}].map(b=>{const all=ts.filter(t=>b.test(percentOf(t)));return {...b,all,wins:all.filter(t=>t.verification.result==='Win').length}})}
function extractDriveFileId(url){
 let s=String(url||'');
 let m=s.match(/\/d\/([a-zA-Z0-9_-]+)/)||s.match(/[?&]id=([a-zA-Z0-9_-]+)/);
 return m?m[1]:'';
}
function ensureScreenshotModal(){
 if($('#screenshotModal'))return;
 document.body.insertAdjacentHTML('beforeend',`<div id="screenshotModal" class="shot-modal" aria-hidden="true">
   <div class="shot-modal-backdrop" data-close-shot></div>
   <div class="shot-modal-panel">
     <div class="shot-modal-head"><strong id="shotTitle">Screenshot</strong><button type="button" data-close-shot>×</button></div>
     <div id="shotLoading" class="shot-loading">Loading screenshot…</div>
     <img id="shotImage" alt="Trade screenshot" />
     <div id="shotError" class="shot-error"></div>
   </div>
 </div>`);
 document.querySelectorAll('[data-close-shot]').forEach(x=>x.onclick=closeScreenshotViewer);
}
function closeScreenshotViewer(){
 let m=$('#screenshotModal');if(!m)return;
 m.classList.remove('open');m.setAttribute('aria-hidden','true');
 $('#shotImage').removeAttribute('src');$('#shotError').textContent='';$('#shotLoading').style.display='none';
}
async function openScreenshotViewer(src,title='Trade screenshot'){
 ensureScreenshotModal();
 let modal=$('#screenshotModal'),img=$('#shotImage'),loading=$('#shotLoading'),err=$('#shotError');
 $('#shotTitle').textContent=title;img.removeAttribute('src');err.textContent='';loading.style.display='block';
 modal.classList.add('open');modal.setAttribute('aria-hidden','false');
 try{
   if(String(src||'').startsWith('data:image/')){
     img.src=src;loading.style.display='none';return;
   }
   let fileId=extractDriveFileId(src);
   if(!fileId)throw new Error('Screenshot file ID not found.');
   let s=getMt5Settings();
   if(!s.url||!s.apiKey)throw new Error('Google sync settings are not configured.');
   let data=await apiGet(`getScreenshot&fileId=${encodeURIComponent(fileId)}`,s,true);
   if(!data.dataUrl)throw new Error('Screenshot data was not returned.');
   img.src=data.dataUrl;loading.style.display='none';
 }catch(e){
   loading.style.display='none';err.textContent='Unable to load screenshot: '+e.message;
 }
}
function bindScreenshotButtons(){
 document.querySelectorAll('[data-shot]').forEach(b=>b.onclick=e=>{
   e.preventDefault();e.stopPropagation();
   let src=b.dataset.shot||'',title=b.dataset.shotTitle||'Trade screenshot';
   openScreenshotViewer(src,title);
 })
}
function tradeRow(t){
 let checklistPresent=hasChecklist(t),p=percentOf(t),v=t.verification||{},m=t.mt5||{},cur=tradeCurrency(t),
 hasPnl=v.pnl!==''&&v.pnl!=null,pnl=hasPnl?signedMoney(v.pnl,cur):'—',
 rr=v.rr===''||v.rr==null?'—':`1:${fmt(v.rr)}`,loss=v.result==='Loss',
 isMt5=!!(t.source==='MT5'||m.ticket),pick=(...xs)=>xs.find(x=>x!==''&&x!==null&&x!==undefined)??'',
 openTime=pick(m.openTime,t.timestamp,t.date),closeTime=pick(m.closeTime,t.timestamp,t.date),
 volume=pick(m.volume,v.quantity),entry=pick(m.entry,v.actualEntry),exit=pick(m.exit,v.actualExit),sl=pick(m.sl,v.actualSL),target=pick(m.target,v.actualTarget),
 hasExecution=isMt5||[volume,entry,exit,sl,target].some(x=>x!==''&&x!=null),
 mt5Info=hasExecution?`<div class="mt5-detail-grid">${m.ticket?`<div><span>Ticket</span><b>${esc(m.ticket)}</b></div>`:''}<div><span>Volume</span><b>${volume!==''?esc(volume):'—'}</b></div><div><span>Entry</span><b>${entry!==''?fmt(entry):'—'}</b></div><div><span>Exit</span><b>${exit!==''?fmt(exit):'—'}</b></div><div><span>SL</span><b>${sl!==''?fmt(sl):'—'}</b></div><div><span>TP</span><b>${target!==''?fmt(target):'—'}</b></div></div>`:'',
 shots=(t.beforeImage||t.beforeImageUrl||v.afterImage||v.afterImageUrl)?`<div class="screenshot-actions">${(t.beforeImage||t.beforeImageUrl)?`<button type="button" data-shot="${esc(t.beforeImage||t.beforeImageUrl)}" data-shot-title="Setup screenshot">Setup image</button>`:''}${(v.afterImage||v.afterImageUrl)?`<button type="button" data-shot="${esc(v.afterImage||v.afterImageUrl)}" data-shot-title="After-trade screenshot">After image</button>`:''}</div>`:'',
 rsiInfo=(t.rsiEvidence?.entry||t.rsiEvidence?.exit)?`<div class="rsi-card-summary"><div><span>Entry RSI</span><b>${t.rsiEvidence?.entry?fmt(t.rsiEvidence.entry.used)+' · '+esc(t.rsiEvidence.entry.trend):'—'}</b></div><div><span>Exit RSI</span><b>${t.rsiEvidence?.exit?fmt(t.rsiEvidence.exit.used)+' · '+esc(t.rsiEvidence.exit.trend):'—'}</b></div></div>`:'',
 linkState=isMt5?(checklistPresent?'<span class="linked-badge">Linked to checklist</span>':'<span class="unlinked-badge">MT5 only</span>'):'';
 return `<div class="trade-card history-trade-card ${loss?'history-loss-card':''}"><div class="history-top"><div><strong>${esc(t.script||'Untitled')}</strong><small><span class="card-date-time">${esc(shortCardDateTime(t))}</span> · ${esc(t.direction)} · ${esc(t.mode)} · ${cur} ${linkState}</small></div><button class="history-open" data-open="${t.id}">Open</button></div><div class="history-middle"><div class="history-score"><span>Strategy Score</span><b>${checklistPresent?wholePercent(p):"—"}</b></div><div class="history-heads">${groups.map(g=>`<div><span>${g.name}</span><b>${checklistPresent?wholePercent(categoryPercent(t,g)):'—'}</b></div>`).join('')}</div></div>${mt5Info}${rsiInfo}${shots}<div class="history-columns history-summary"><div><span>P&amp;L</span><b>${pnl}</b></div><div><span>R:R</span><b>${rr}</b></div><div><span>Result</span><b>${v.result||'Pending'}</b></div><div><span>Plan followed</span><b>${v.followed||'—'}</b></div></div></div>`
}
function renderTrade(){let ts=getTrades(), t=editingId?(draft||ts.find(x=>x.id===editingId)):null; if(!t)t=draft||emptyTrade();if(!t.rsiEvidence)t.rsiEvidence={entry:null,exit:null};refreshAutoRsiAnswers(t); if(!editingId)draft=t; const locked=false;
 app.innerHTML=heading(editingId?'Edit trade':'New trade','MT5 evidence is automatic; the remaining checklist stays manual.')+
 `<form id="tradeForm">${actualTradeForm(t,locked)}${rsiEvidencePanel(t)}${checklist(t)}<button class="primary" type="submit">${editingId?'Update trade':'Save trade'}</button><p class="hint">Automatic RSI evidence is retained from MT5. Manual overrides are recorded separately with a reason.</p></form>`+(editingId?`<div class="row-actions"><button class="secondary" id="backHistory">Back to history</button><button class="danger" id="deleteTrade">Delete trade</button></div>`:'');
 attachTrade(t,locked);
}
function rsiSnapshotHtml(s,title){
 if(!s)return `<article class="rsi-snapshot empty-rsi"><div class="rsi-snapshot-title">${title}</div><p>Waiting for MT5 evidence</p></article>`;
 let values=s.values?.length?s.values.map(x=>Number(x).toFixed(1)).join(' → '):'—',live=s.live!==''&&s.live!=null?fmt(s.live):'—',closed=s.closed!==''&&s.closed!=null?fmt(s.closed):'—';
 return `<article class="rsi-snapshot"><div class="rsi-snapshot-title"><span>${title}</span><span class="rsi-source">${esc(s.captureMode||'MT5')}</span></div><div class="rsi-main"><strong>${fmt(s.used)}</strong><span>${esc(s.trend||'Unavailable')}</span></div><dl><div><dt>Live RSI</dt><dd>${live}</dd></div><div><dt>Closed RSI</dt><dd>${closed}</dd></div><div><dt>Slope</dt><dd>${s.slope===''?'—':Number(s.slope).toFixed(2)}/min</dd></div><div><dt>Moves</dt><dd>${s.upMoves||0} up · ${s.downMoves||0} down</dd></div><div class="wide"><dt>Completed M1 values</dt><dd>${values}</dd></div><div class="wide"><dt>Candle / capture time</dt><dd>${esc(s.candleTime||s.capturedAt||'—')}</dd></div></dl></article>`;
}
function automaticDecision(t,key,label){let auto=t.autoAnswers?.[key],override=t.rsiOverrides?.[key];if(!auto)return `<span class="auto-decision waiting">${label}: manual until configured</span>`;return `<span class="auto-decision ${auto.toLowerCase()}">${label}: Auto ${auto}${override?` · overridden to ${esc(override.value)}`:''}</span>`}
function rsiEvidencePanel(t){let has=t.rsiEvidence?.entry||t.rsiEvidence?.exit;return `<div class="card rsi-evidence"><h2>Automatic RSI evidence</h2><p class="hint">Trend uses the configured number of completed M1 candles. Live RSI is stored separately when the EA was running at the trade event.</p><div class="rsi-snapshot-grid">${rsiSnapshotHtml(t.rsiEvidence?.entry,'Entry RSI')}${rsiSnapshotHtml(t.rsiEvidence?.exit,'Exit RSI')}</div><div class="auto-decision-row">${automaticDecision(t,'Pre-Entry|RSI Trend','Entry trend')}${automaticDecision(t,'Pre-Entry|RSI Level','Entry level')}${automaticDecision(t,'Target|RSI Level','Exit level')}</div>${has?'':`<div class="notice">Install the included MT5 EA v2.30, deploy the included Code.gs, close or resync a trade, then run Broker Sync.</div>`}</div>`}
function checklist(t){let summary=groups.map(g=>`${g.name}: ${wholePercent(categoryPercent(t,g))}`).join('<br>');return `<div class="score-banner"><div><small>Strategy score · ${qualification(percentOf(t))}</small><strong id="scoreValue">${wholePercent(percentOf(t))}</strong></div><div class="score-details" id="scoreDetails">Strategy score: ${wholePercent(percentOf(t))}<br>${summary}</div></div><div class="notice">Category scores are capped at Pre-Entry 9 · Entry 2 · SL 2 · Target 2, so the overall score cannot exceed 100%.</div>${groups.map(g=>`<div class="check-group"><header>${g.name}<span id="category-${g.name}">${wholePercent(categoryPercent(t,g))}</span></header>${g.items.map(([name,w])=>{let k=g.name+'|'+name,a=answerValue(t,k),auto=t.autoAnswers?.[k],override=t.rsiOverrides?.[k];return `<div class="check-row ${auto?'auto-check-row':''}"><span class="item-name">${name}${auto?`<small class="auto-note">MT5 auto: ${auto}${override?` · Manual: ${esc(override.value)} (${esc(override.reason||'reason not supplied')})`:''}</small>`:''}</span><span class="weight">WT ${w}</span><span class="answer"><button type="button" class="yes ${a==='Yes'?'active':''}" data-answer="Yes" data-key="${esc(k)}">YES</button><button type="button" class="no ${a==='No'?'active':''}" data-answer="No" data-key="${esc(k)}">NO</button></span></div>`}).join('')}</div>`).join('')}`}
function preTradeSummary(t){return `<div class="score-banner"><div><small>Locked strategy score · ${qualification(percentOf(t))}</small><strong>${fmt(percentOf(t))}%</strong></div><div class="score-details">Overall: ${scoreOf(t)} / 15<br>Pre-entry ${categoryScore(t,groups[0])}/9 · Entry ${categoryScore(t,groups[1])}/2<br>SL ${categoryScore(t,groups[2])}/2 · Target ${categoryScore(t,groups[3])}/2</div></div><div class="card"><h3>Locked checklist</h3>${groups.map(g=>`<p class="hint"><b>${g.name}</b> — ${g.items.filter(([n])=>answerValue(t,g.name+'|'+n)==='Yes').map(([n])=>n).join(', ')||'No YES responses'}</p>`).join('')}<div class="photo-grid">${t.beforeImage?`<div class="photo-box">Before-trade screenshot<img src="${t.beforeImage}" alt="Before-trade chart"></div>`:''}</div></div>`}
function imageInput(name,value,label){return `<div class="photo-box"><b>${label}</b>${value?`<img src="${value}" alt="${label}">`:''}<input type="file" accept="image/*" data-image="${name}"></div>`}
function actualTradeForm(t,locked){let v=t.verification||{},rr=riskReward(v,t.direction),pnl=calculatedPnl(v,t.direction);return `<div class="card"><h2>Actual trade & execution</h2><div class="form-grid"><label>Mode<div class="segmented" id="modeButtons">${['Backtest','Paper','Live'].map(x=>`<button type="button" data-mode="${x}" class="${t.mode===x?'selected':''}" ${locked?'disabled':''}>${x}</button>`).join('')}</div></label><label>Market<select name="market"><option ${t.market==='India'?'selected':''}>India</option><option ${t.market==='Forex'?'selected':''}>Forex</option></select></label><label>Currency<select name="currency"><option value="INR" ${tradeCurrency(t)==='INR'?'selected':''}>INR ₹</option><option value="USD" ${tradeCurrency(t)==='USD'?'selected':''}>USD $</option></select></label><label>Date<input name="date" type="date" value="${esc(t.date)}" ${locked?'disabled':''}></label><label>Timestamp<input name="timestamp" type="datetime-local" value="${esc(t.timestamp)}" ${locked?'disabled':''}></label><label class="wide">Script / Stock<input name="script" placeholder="e.g. NIFTY" value="${esc(t.script)}" ${locked?'disabled':''}></label><label>Direction<select name="direction" ${locked?'disabled':''}><option ${t.direction==='Buy'?'selected':''}>Buy</option><option ${t.direction==='Sell'?'selected':''}>Sell</option></select></label><label>Actual Entry<input name="actualEntry" type="number" step="any" value="${esc(v.actualEntry)}"></label><label>Actual Stop Loss<input name="actualSL" type="number" step="any" value="${esc(v.actualSL)}"></label><label>Actual Target<input name="actualTarget" type="number" step="any" value="${esc(v.actualTarget)}"></label><label>Actual Exit<input name="actualExit" type="number" step="any" value="${esc(v.actualExit)}"></label><label>Lots / Quantity<input name="quantity" type="number" step="any" min="0" value="${esc(v.quantity||'1')}"></label><label>Lot size<input name="lotSize" type="number" step="any" min="0" value="${esc(v.lotSize||'1')}"></label><label>Charges<input name="charges" type="number" step="any" min="0" value="${esc(v.charges)}"></label><label>Result<select name="result"><option value="">Not verified</option>${['Win','Loss','Breakeven'].map(x=>`<option ${v.result===x?'selected':''}>${x}</option>`).join('')}</select></label><label>Calculated net P&amp;L<input id="pnlCalculated" readonly value="${pnl===''?'Enter entry, exit, quantity & lot size':fmt(pnl)}"></label><label>Calculated R:R<input id="rrCalculated" readonly value="${rr===''?'Enter entry, SL & target':'1 : '+fmt(rr)}"></label><label>Followed setup<div class="segmented" data-field="followed">${yn(v.followed)}</div></label><label>Moved stop loss<div class="segmented" data-field="movedSL">${yn(v.movedSL)}</div></label><label>Exited early<div class="segmented" data-field="exitedEarly">${yn(v.exitedEarly)}</div></label><label class="wide">Review notes<textarea name="notes" placeholder="What happened? What will you repeat or change?">${esc(v.notes)}</textarea></label></div><div class="photo-grid">${imageInput('beforeImage',t.beforeImage,'Setup screenshot')}${t.beforeImage?`<button type="button" class="secondary" data-shot="${esc(t.beforeImage)}" data-shot-title="Setup screenshot">View setup screenshot</button>`:''}${t.beforeImageUrl?`<button type="button" class="secondary" data-shot="${esc(t.beforeImageUrl)}" data-shot-title="Setup screenshot from Drive">View setup in Drive</button>`:''}${imageInput('afterImage',v.afterImage,'After-trade chart')}${v.afterImage?`<button type="button" class="secondary" data-shot="${esc(v.afterImage)}" data-shot-title="After-trade screenshot">View after screenshot</button>`:''}${v.afterImageUrl?`<button type="button" class="secondary" data-shot="${esc(v.afterImageUrl)}" data-shot-title="After-trade screenshot from Drive">View after in Drive</button>`:''}</div><p class="hint">Choose a chart image from your iPhone Photos library or take a new photo. Local screenshots remain viewable even if Google Drive upload fails.</p></div>`}
function yn(v){return ['Yes','No'].map(x=>`<button type="button" class="${v===x?'selected':''}" data-yn="${x}">${x}</button>`).join('')}
function syncDraft(t,form,locked){if(!form)return;if(!locked)['date','timestamp','script','direction','market','currency'].forEach(k=>{const el=form.elements[k];if(el)t[k]=el.value});t.verification=t.verification||{};['actualEntry','actualSL','actualTarget','actualExit','quantity','lotSize','charges','result','notes'].forEach(k=>{const el=form.elements[k];if(el)t.verification[k]=el.value});t.verification.pnl=calculatedPnl(t.verification,t.direction);t.verification.rr=riskReward(t.verification,t.direction);let rr=$('#rrCalculated');if(rr)rr.value=t.verification.rr===''?'Enter entry, SL & target':'1 : '+fmt(t.verification.rr);let pnl=$('#pnlCalculated');if(pnl)pnl.value=t.verification.pnl===''?'Enter entry, exit, quantity & lot size':fmt(t.verification.pnl)}
function attachTrade(t,locked){let form=$('#tradeForm'), pendingImages={beforeImage:t.beforeImage,afterImage:t.verification?.afterImage}; form?.querySelectorAll('[name]').forEach(el=>['input','change','blur'].forEach(event=>el.addEventListener(event,()=>syncDraft(t,form,locked)))); if(!locked)$('#modeButtons')?.addEventListener('click',e=>{let b=e.target.closest('[data-mode]');if(b){t.mode=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('selected',x===b))}});
 form?.elements.market?.addEventListener('change',e=>{let currency=e.target.value==='Forex'?'USD':'INR';if(form.elements.currency)form.elements.currency.value=currency;t.market=e.target.value;t.currency=currency;syncDraft(t,form,locked)});
 if(!locked)document.querySelectorAll('[data-answer]').forEach(b=>b.addEventListener('click',()=>{syncDraft(t,form,locked);let key=b.dataset.key,value=b.dataset.answer,auto=t.autoAnswers?.[key];t.answers=t.answers||{};t.rsiOverrides=t.rsiOverrides||{};if(auto){if(value===auto){delete t.rsiOverrides[key];delete t.answers[key]}else{let reason=prompt(`MT5 calculated ${auto} for ${key.replace('|',' — ')}. Why are you overriding it to ${value}?`,'');if(reason===null)return;if(!reason.trim()){alert('Please enter an override reason.');return}t.rsiOverrides[key]={value,reason:reason.trim(),at:new Date().toISOString()}}}else t.answers[key]=value;draft=t;renderTrade()}));
 document.querySelectorAll('[data-yn]').forEach(b=>b.addEventListener('click',()=>{t.verification=t.verification||{};t.verification[b.closest('[data-field]').dataset.field]=b.dataset.yn; b.closest('.segmented')?.querySelectorAll('button').forEach(x=>x.classList.toggle('selected',x===b))}));
 document.querySelectorAll('[data-image]').forEach(input=>input.addEventListener('change',e=>{syncDraft(t,form,locked);compressImage(e.target.files[0]).then(x=>{pendingImages[e.target.dataset.image]=x;if(e.target.dataset.image==='beforeImage'){t.beforeImage=x;t.beforeImageUrl=''}else{t.verification=t.verification||{};t.verification.afterImage=x;t.verification.afterImageUrl=''}draft=t;renderTrade()})}));
 form?.addEventListener('submit',async e=>{e.preventDefault();let submit=form.querySelector('[type="submit"]');if(submit)submit.disabled=true;let f=new FormData(form);['date','timestamp','script','direction','market','currency'].forEach(k=>{let v=f.get(k);if(v!==null)t[k]=v});t.beforeImage=pendingImages.beforeImage;t.verification={...t.verification,actualEntry:f.get('actualEntry'),actualSL:f.get('actualSL'),actualTarget:f.get('actualTarget'),actualExit:f.get('actualExit'),quantity:f.get('quantity'),lotSize:f.get('lotSize'),charges:f.get('charges'),result:f.get('result'),notes:f.get('notes'),afterImage:pendingImages.afterImage};t.verification.pnl=calculatedPnl(t.verification,t.direction);t.verification.rr=riskReward(t.verification,t.direction);refreshAutoRsiAnswers(t);let all=getTrades(),i=all.findIndex(x=>x.id===t.id);if(i<0)all.unshift(t);else all[i]=t;putTrades(all);editingId=t.id;draft=null;route='history';render();try{let result=await pushTradeToCloud(t);alert(result.message||'Trade saved successfully.')}catch(err){console.error(err);alert(err.message||'Trade saved locally, but cloud backup failed.')}render()});
 bindScreenshotButtons();
 $('#backHistory')?.addEventListener('click',()=>{route='history';render()}); $('#deleteTrade')?.addEventListener('click',()=>{if(confirm('Delete this trade permanently from this device?')){putTrades(getTrades().filter(x=>x.id!==t.id));editingId=null;route='history';render()}});
}
function compressImage(file){if(!file)return Promise.resolve('');return new Promise(resolve=>{let r=new FileReader();r.onload=()=>{let im=new Image();im.onload=()=>{let max=900,s=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=im.width*s;c.height=im.height*s;c.getContext('2d').drawImage(im,0,0,c.width,c.height);resolve(c.toDataURL('image/jpeg',.72))};im.src=r.result};r.readAsDataURL(file)})}
function deleteHistoryTrades(ids){let chosen=new Set([...ids].map(String));if(!chosen.size)return;let deleted=getDeletedIds();chosen.forEach(id=>deleted.add(id));putDeletedIds(deleted);putTrades(getTrades().filter(t=>!chosen.has(String(t.id))));chosen.forEach(id=>selectedHistoryIds.delete(id))}
function bindHistorySwipe(){document.querySelectorAll('[data-swipe-trade]').forEach(row=>{let startX=0,startY=0;row.addEventListener('touchstart',e=>{let p=e.changedTouches[0];startX=p.clientX;startY=p.clientY},{passive:true});row.addEventListener('touchend',e=>{let p=e.changedTouches[0],dx=p.clientX-startX,dy=p.clientY-startY;if(Math.abs(dx)<Math.abs(dy)||Math.abs(dx)<42)return;document.querySelectorAll('.swipe-row.swiped').forEach(x=>{if(x!==row)x.classList.remove('swiped')});row.classList.toggle('swiped',dx<0)},{passive:true})});document.querySelectorAll('[data-swipe-delete]').forEach(b=>b.onclick=()=>{let id=String(b.dataset.swipeDelete);if(confirm('Delete this trade from this device?')){deleteHistoryTrades([id]);renderHistory()}})}
function renderHistory(){
 const all=getTrades(),ts=filterTrades(all,historyMarket,historyStock).slice().sort((a,b)=>(parseLocalTime(b.timestamp||b.date)||b.lockedAt||0)-(parseLocalTime(a.timestamp||a.date)||a.lockedAt||0)),modes=['All','Backtest','Paper','Live'];
 let x=historyFilter==='All'?ts:ts.filter(t=>t.mode===historyFilter),shownIds=x.map(t=>String(t.id));
 let manage=historyManage?`<div class="selection-bar"><label><input id="selectAllShown" type="checkbox" ${shownIds.length&&shownIds.every(id=>selectedHistoryIds.has(id))?'checked':''}> Select all shown</label><button class="danger" id="deleteSelected" ${selectedHistoryIds.size?'':'disabled'}>Delete (${selectedHistoryIds.size})</button></div>`:'';
 let rows=x.map(t=>`<div class="swipe-row ${historyManage?'manage-mode':''}" data-swipe-trade="${esc(t.id)}"><button class="swipe-delete" data-swipe-delete="${esc(t.id)}" aria-label="Delete ${esc(t.script||'trade')}">Delete</button><div class="swipe-content">${historyManage?`<label class="trade-selector"><input type="checkbox" data-select-trade="${esc(t.id)}" ${selectedHistoryIds.has(String(t.id))?'checked':''}><span>Select</span></label>`:''}${tradeRow(t)}</div></div>`).join('');
 app.innerHTML=heading('Trade history','Swipe a trade left to delete it',`<div class="top-actions"><button class="secondary" id="manageTrades">${historyManage?'Done':'Manage'}</button><button class="secondary" id="csvBtn">CSV</button><button class="secondary" id="importBtn">Restore</button></div>`)+marketFilters(all,historyMarket,historyStock,'history')+`<div class="filter-row">${modes.map(m=>`<button data-filter="${m}" class="${m===historyFilter?'active':''}">${m}</button>`).join('')}</div>${manage}<div class="history-list">${rows||'<div class="card empty">No trades saved for this filter.</div>'}</div>`;
 document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{historyFilter=b.dataset.filter;renderHistory()});
 $('#historyMarket').onchange=e=>{historyMarket=e.target.value;historyStock='All';renderHistory()};$('#historyStock').onchange=e=>{historyStock=e.target.value;renderHistory()};
 $('#manageTrades').onclick=()=>{historyManage=!historyManage;if(!historyManage)selectedHistoryIds.clear();renderHistory()};
 document.querySelectorAll('[data-select-trade]').forEach(c=>c.onchange=()=>{let id=String(c.dataset.selectTrade);c.checked?selectedHistoryIds.add(id):selectedHistoryIds.delete(id);renderHistory()});
 if(historyManage){$('#selectAllShown').onchange=e=>{shownIds.forEach(id=>e.target.checked?selectedHistoryIds.add(id):selectedHistoryIds.delete(id));renderHistory()};$('#deleteSelected').onclick=()=>{let count=selectedHistoryIds.size;if(count&&confirm(`Delete ${count} selected trade${count===1?'':'s'} from this device?`)){deleteHistoryTrades(selectedHistoryIds);selectedHistoryIds.clear();renderHistory()}}}
 document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>{editingId=b.dataset.open;draft=null;route='new';render()});$('#csvBtn').onclick=exportCSV;$('#importBtn').onclick=()=>$('#importFile').click();bindScreenshotButtons();bindHistorySwipe()
}
function renderAnalysis(){const all=getTrades(),done=filterTrades(all,analysisMarket,analysisStock).filter(t=>verified(t)&&hasChecklist(t)),items=groups.flatMap(g=>g.items.map(([n,w])=>({group:g.name,name:n,w,key:g.name+'|'+n})));app.innerHTML=heading('Strategy analysis','Find which rules deserve your trust')+marketFilters(all,analysisMarket,analysisStock,'analysis')+`<div class="card"><h2>Checklist-item performance</h2>${done.length?items.map(i=>{let have=done.filter(t=>answerValue(t,i.key)==='Yes'),w=have.filter(t=>t.verification.result==='Win').length,l=have.filter(t=>t.verification.result==='Loss').length,wr=have.length?w/have.length*100:0;return `<div class="analysis-item"><div class="bar-row"><span>${i.name}<br><small>${i.group} · WT ${i.w}</small></span><div class="bar"><i style="width:${wr}%"></i></div><b>${wholePercent(wr)}</b></div><small>${have.length} present · ${w} wins · ${l} losses</small></div>`}).join(''):`<div class="empty">No verified checklist trades for this filter.</div>`}</div><div class="card"><h2>Score vs win rate</h2>${done.length?bands(done).map(x=>{let wr=x.all.length?x.wins/x.all.length*100:0;return `<div class="bar-row"><span>${x.label}</span><div class="bar"><i style="width:${wr}%"></i></div><b>${x.all.length?wholePercent(wr):'—'}</b></div>`}).join(''):`<div class="empty">No verified trades for this filter.</div>`}</div><div class="notice">Only verified trades with checklist answers are included.</div>`;$('#analysisMarket').onchange=e=>{analysisMarket=e.target.value;analysisStock='All';renderAnalysis()};$('#analysisStock').onchange=e=>{analysisStock=e.target.value;renderAnalysis()}}
function exportCSV(){
 let ts=getTrades(),headers=['ID','Mode','Market','Currency','Date','Timestamp','Script','Direction','Score / 15','Score %','Result','Actual Entry','Actual Stop Loss','Actual Target','Actual Exit','Lots / Quantity','Lot Size','Charges','P&L','R:R','Entry RSI','Entry RSI Live','Entry RSI Closed','Entry RSI Trend','Entry RSI Slope','Entry RSI Values','Entry RSI Capture','Exit RSI','Exit RSI Live','Exit RSI Closed','Exit RSI Trend','Exit RSI Slope','Exit RSI Values','Exit RSI Capture','RSI Override Reasons','Followed Setup','Moved SL','Exited Early','Review Notes',...groups.flatMap(g=>g.items.map(([n])=>g.name+' — '+n))];
 let rows=ts.map(t=>{let e=t.rsiEvidence?.entry||{},x=t.rsiEvidence?.exit||{},overrides=Object.entries(t.rsiOverrides||{}).map(([key,v])=>`${key}: ${v.value} — ${v.reason||''}`).join(' | ');return [t.id,t.mode,t.market||'',tradeCurrency(t),t.date,t.timestamp,t.script,t.direction,scoreOf(t),percentOf(t).toFixed(2),t.verification?.result,t.verification?.actualEntry,t.verification?.actualSL,t.verification?.actualTarget,t.verification?.actualExit,t.verification?.quantity,t.verification?.lotSize,t.verification?.charges,t.verification?.pnl,t.verification?.rr,e.used,e.live,e.closed,e.trend,e.slope,(e.values||[]).join('|'),e.captureMode,x.used,x.live,x.closed,x.trend,x.slope,(x.values||[]).join('|'),x.captureMode,overrides,t.verification?.followed,t.verification?.movedSL,t.verification?.exitedEarly,t.verification?.notes,...groups.flatMap(g=>g.items.map(([n])=>answerValue(t,g.name+'|'+n)))]});
 download('tradetrack-ai-backup-'+new Date().toISOString().slice(0,10)+'.csv',[headers,...rows].map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\n'),'text/csv')
}
function backupJSON(){download('tradetrack-ai-full-backup-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify({app:'TradeTrack AI',version:2,trades:getTrades()},null,2),'application/json')}
function download(name,text,type){let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
$('#exportBtn').onclick=exportCSV; $('#importFile').onchange=e=>{let f=e.target.files[0];if(!f)return;let r=new FileReader();r.onload=()=>{try{let x=JSON.parse(r.result);if(!Array.isArray(x.trades))throw 0;if(confirm('Replace current local trade records with this backup?')){putTrades(x.trades);render()}}catch{alert('This is not a valid TradeTrack AI full backup.')}};r.readAsText(f);e.target.value=''};
migrateLegacy();document.querySelectorAll('[data-route]').forEach(b=>b.onclick=()=>{route=b.dataset.route;if(route==='new'){editingId=null;draft=null}render()});if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js');render();
(()=>{let s=getMt5Settings(),last=Date.parse(s.lastSync||0);if(s.url&&s.apiKey&&(!Number.isFinite(last)||Date.now()-last>5*60*1000))syncGoogleSheets(s,{silent:true})})();
