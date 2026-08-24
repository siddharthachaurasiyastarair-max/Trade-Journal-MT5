/* TradeTrack AI: all data stays on this device in localStorage. */
const KEY='tradetrack_ai_v2_records';
const MT5_SYNC_KEY='tradetrack_mt5_sync_settings';
const groups=[
 {name:'Pre-Entry',total:9,items:[['RSI Trend',2],['RSI Level',2],['Liquidity (SL Hunt)',2],['Engulfing Candle',2],['Divergent',1]]},
 {name:'Entry',total:2,items:[['OB Entry (On retracement)',2],['Candle Close Entry',1]]},
 {name:'SL',total:2,items:[['Engulfing Candle',2],['Nearest Swing',1],['Others',1]]},
 {name:'Target',total:2,items:[['RSI Level',2],['Opposite Engulfing Candle',2],['Liquidity (SL Hunt)',2],['Others',1]]}
];
const $=s=>document.querySelector(s), app=$('#app');
let route='dashboard', historyFilter='All', editingId=null, draft=null, dashboardStock='All', dashboardCurrency='All', calendarMonth=localNow().slice(0,7);
const getTrades=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}};
const putTrades=x=>localStorage.setItem(KEY,JSON.stringify(x));
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const fmt=n=>Number(n||0).toLocaleString(undefined,{maximumFractionDigits:2});
const resultClass=r=>r==='Win'?'':r==='Loss'?'loss':r==='Breakeven'?'breakeven':'pending';
const scoreOf=t=>groups.reduce((n,g)=>n+g.items.reduce((a,[name,w])=>a+(t.answers?.[g.name+'|'+name]==='Yes'?w:0),0),0);
const percentOf=t=>scoreOf(t)/15*100;
const categoryScore=(t,g)=>g.items.reduce((a,[name,w])=>a+(t.answers?.[g.name+'|'+name]==='Yes'?w:0),0);
const categoryPercent=(t,g)=>g.total?categoryScore(t,g)/g.total*100:0;
const hasChecklist=t=>Object.values(t?.answers||{}).some(v=>v==='Yes'||v==='No');
const wholePercent=n=>`${Math.round(Number(n)||0)}%`;
function riskReward(v,direction){let entry=Number(v?.actualEntry),sl=Number(v?.actualSL),target=Number(v?.actualTarget);if(!Number.isFinite(entry)||!Number.isFinite(sl)||!Number.isFinite(target)||entry===sl)return '';let risk=Math.abs(entry-sl),reward=direction==='Sell'?entry-target:target-entry;return reward>0?reward/risk:''}
function calculatedPnl(v,direction){if(v?.actualEntry===''||v?.actualEntry==null||v?.actualExit===''||v?.actualExit==null||v?.quantity===''||Number(v?.quantity)<=0||v?.lotSize===''||Number(v?.lotSize||1)<=0)return '';let entry=Number(v.actualEntry),exit=Number(v.actualExit),quantity=Number(v.quantity),lotSize=Number(v.lotSize||1),charges=Number(v.charges||0);if(!Number.isFinite(entry)||!Number.isFinite(exit)||!Number.isFinite(quantity)||!Number.isFinite(lotSize)||!Number.isFinite(charges))return '';return (direction==='Sell'?entry-exit:exit-entry)*quantity*lotSize-charges}
function monthLabel(month){return new Date(month+'-01T12:00:00').toLocaleDateString(undefined,{month:'long',year:'numeric'})}
function qualification(p){return p>=80?'A+ Setup':p>=70?'A Setup':p>=60?'B Setup':'Avoid'}
function localNow(){let d=new Date(),z=d.getTimezoneOffset()*60000;return new Date(d-z).toISOString()}
function emptyTrade(){let now=localNow();return {id:uid(),mode:'Paper',market:'India',currency:'INR',date:now.slice(0,10),timestamp:now.slice(0,16),script:'',direction:'Buy',plannedEntry:'',plannedSL:'',plannedTarget:'',answers:{},beforeImage:'',beforeImageUrl:'',lockedAt:null,verification:{actualEntry:'',actualExit:'',quantity:'1',lotSize:'1',charges:'',result:'',pnl:'',rr:'',followed:'',movedSL:'',exitedEarly:'',notes:'',afterImage:'',afterImageUrl:''}}}
function tradeCurrency(t){return String(t?.currency||((t?.source==='MT5'||t?.mt5?.ticket)?'USD':'INR')).toUpperCase()==='USD'?'USD':'INR'}
function moneyFmt(n,c){let x=Number(n||0);return (c==='USD'?'$':'₹')+Math.abs(x).toLocaleString(undefined,{maximumFractionDigits:2,minimumFractionDigits:2})}
function signedMoney(n,c){let x=Number(n||0);return (x<0?'-':x>0?'+':'')+moneyFmt(x,c)}
function migrateLegacy(){if(localStorage.getItem(KEY)!==null)return;try{let legacy=JSON.parse(localStorage.getItem('tradetrack_records')||'[]');if(!Array.isArray(legacy)||!legacy.length)return;putTrades(legacy.map(x=>{let t=emptyTrade();t.id=x.id||uid();t.date=x.date||t.date;t.timestamp=x.timestamp||x.dateTime||t.timestamp;t.script=x.script||x.stock||x.symbol||'';t.direction=x.direction||x.side||t.direction;t.mode=x.mode||t.mode;t.market=x.market||((x.source==='MT5'||x.mt5?.ticket)?'Forex':'India');t.currency=x.currency||((x.source==='MT5'||x.mt5?.ticket)?'USD':'INR');t.answers=x.answers||x.responses||{};t.plannedEntry=x.plannedEntry||x.entry||'';t.plannedSL=x.plannedSL||x.stopLoss||'';t.plannedTarget=x.plannedTarget||x.target||'';t.lockedAt=x.lockedAt||x.createdAt||Date.now();t.verification={...t.verification,result:x.result||x.outcome||'',pnl:x.pnl||''};return t}))}catch{ /* The previous app data is left untouched if it cannot be read. */ }}
function nav(){document.querySelectorAll('[data-route]').forEach(b=>b.classList.toggle('active',b.dataset.route===route));}
function heading(title,sub,actions=''){return `<div class="page-heading"><div><h1>${title}</h1><p>${sub||''}</p></div>${actions}</div>`}
function render(){nav(); if(route==='new')renderTrade(); else if(route==='history')renderHistory(); else if(route==='analysis')renderAnalysis(); else if(route==='reports')renderReports(); else if(route==='settings')renderSyncSettings(); else renderDashboard();}
function verified(t){return ['Win','Loss','Breakeven'].includes(t.verification?.result)}
function renderDashboard(){
 const all=getTrades(),
 stocks=[...new Set(all.map(t=>t.script).filter(Boolean))].sort(),
 byStock=dashboardStock==='All'?all:all.filter(t=>t.script===dashboardStock),
 ts=dashboardCurrency==='All'?byStock:byStock.filter(t=>tradeCurrency(t)===dashboardCurrency),
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

 app.innerHTML=heading('Dashboard',(dashboardStock==='All'?'All stocks':dashboardStock)+' · '+(dashboardCurrency==='All'?'INR & USD separate':dashboardCurrency),
 `<div class="top-actions"><button class="secondary" id="reportsBtn">Reports</button><button class="secondary" id="syncMt5Btn">MT5 Sync</button><button class="secondary" id="backupBtn">Backup</button></div>`)+
 `<div class="card dashboard-filter"><label>View stock<select id="dashboardStock"><option>All</option>${stocks.map(s=>`<option ${s===dashboardStock?'selected':''}>${esc(s)}</option>`).join('')}</select></label>
 <label>Currency<select id="dashboardCurrency"><option value="All" ${dashboardCurrency==='All'?'selected':''}>All (keep separate)</option><option ${dashboardCurrency==='INR'?'selected':''}>INR</option><option ${dashboardCurrency==='USD'?'selected':''}>USD</option></select></label></div>
 <div class="metric-grid"><div class="metric"><span>Total trades</span><b>${ts.length}</b></div><div class="metric positive"><span>Wins</span><b>${wins.length}</b></div><div class="metric negative"><span>Losses</span><b>${losses.length}</b></div><div class="metric"><span>Breakeven</span><b>${be.length}</b></div><div class="metric positive"><span>Win rate</span><b>${fmt(wr)}%</b></div><div class="metric"><span>Avg score</span><b>${fmt(avg)}%</b></div><div class="metric positive"><span>Avg win score</span><b>${fmt(aw)}%</b></div><div class="metric negative"><span>Avg loss score</span><b>${fmt(al)}%</b></div>${moneyMetrics}</div>`+
 (dashboardCurrency==='All'?`<div class="notice">INR and USD are never added together. Select one currency for profit factor, expectancy and equity curve.</div>`:
 `<div class="section-label">Trading ratios (${dashboardCurrency})</div><div class="metric-grid"><div class="metric"><span>Profit factor</span><b>${typeof pf==='number'?fmt(pf):pf}</b></div><div class="metric"><span>Payoff ratio</span><b>${typeof payoff==='number'?fmt(payoff):payoff}</b></div><div class="metric"><span>Expectancy / trade</span><b>${signedMoney(expectancy,cur)}</b></div><div class="metric"><span>Average R:R</span><b>${fmt(avgR)}</b></div><div class="metric"><span>Plan followed</span><b>${done.length?fmt(followed/done.length*100)+'%':'—'}</b></div></div><div class="section-label">Equity curve</div><div class="card">${equityChart(done,cur)}</div>`)+
 `<div class="section-label">Score-band performance</div><div class="card table-responsive"><table class="table"><thead><tr><th>Score</th><th>Trades</th><th>Wins</th><th>Losses</th><th>Win rate</th></tr></thead><tbody>${bands(done.filter(hasChecklist)).map(x=>{let xl=x.all.filter(t=>t.verification.result==='Loss');return `<tr><td>${x.label}</td><td>${x.all.length}</td><td>${x.wins}</td><td>${xl.length}</td><td>${x.all.length?fmt(x.wins/x.all.length*100)+'%':'—'}</td></tr>`}).join('')}</tbody></table></div>`+
 `<div class="section-label">Monthly P&amp;L calendar</div><div class="card"><div class="calendar-controls"><button id="previousMonth">‹</button><strong>${monthLabel(calendarMonth)}</strong><button id="nextMonth">›</button></div>${calendarGrid(done,calendarMonth,dashboardCurrency)}</div>
 <div class="section-label">Recent trades</div><div class="card">${ts.length?ts.slice().sort((a,b)=>(b.timestamp||b.date||'').localeCompare(a.timestamp||a.date||'')).slice(0,5).map(tradeRow).join(''):`<div class="empty">No trades saved for this view.</div>`}</div>`;
 $('#backupBtn')?.addEventListener('click',backupJSON);$('#reportsBtn')?.addEventListener('click',()=>{route='reports';render()});$('#syncMt5Btn')?.addEventListener('click',()=>{route='settings';render()});
 document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>{editingId=b.dataset.open;draft=null;route='new';render()});
 bindScreenshotButtons();
 $('#dashboardStock')?.addEventListener('change',e=>{dashboardStock=e.target.value;renderDashboard()});
 $('#dashboardCurrency')?.addEventListener('change',e=>{dashboardCurrency=e.target.value;renderDashboard()});
 $('#previousMonth')?.addEventListener('click',()=>{let d=new Date(calendarMonth+'-01T12:00:00');d.setMonth(d.getMonth()-1);calendarMonth=d.toISOString().slice(0,7);renderDashboard()});
 $('#nextMonth')?.addEventListener('click',()=>{let d=new Date(calendarMonth+'-01T12:00:00');d.setMonth(d.getMonth()+1);calendarMonth=d.toISOString().slice(0,7);renderDashboard()});
}
function getMt5Settings(){try{return JSON.parse(localStorage.getItem(MT5_SYNC_KEY)||'{}')}catch{return{}}}
function saveMt5Settings(s){localStorage.setItem(MT5_SYNC_KEY,JSON.stringify(s))}
function renderSyncSettings(){
 let s=getMt5Settings(),last=s.lastSync?new Date(s.lastSync).toLocaleString():'Never';
 app.innerHTML=heading('Google Sheets sync','MT5 + journal backup in your TradeTrack AI Database')+
 `<div class="card"><form id="mt5Settings">
 <label>Apps Script URL<input name="url" value="${esc(s.url||'https://script.google.com/macros/s/AKfycbyMkVzqfADdBgzlzmjDdkPSR8-CFOjT_KQ8YbBQLn2R3UPyDrud0F6SBVSFTOdyKYE/exec')}" placeholder="https://script.google.com/macros/s/.../exec"></label>
 <label>API Key<input name="apiKey" type="password" value="${esc(s.apiKey||'')}" placeholder="TradeTrack API key" autocomplete="off"></label>
 <button class="primary">Save settings &amp; sync MT5</button>
 </form>
 <p class="hint">Last successful sync: ${esc(last)}. The API key stays only in local storage on this device and is not written to your public GitHub repository.</p>
 </div>
 <div class="card"><h2>Journal cloud backup</h2>
 <button class="primary" id="pushJournal">Upload local journal to Google Sheets</button>
 <button class="secondary" id="pullJournal">Restore / merge journal from Google Sheets</button>
 <p class="hint">Trade details and checklist answers are backed up to Sheets. New screenshots are uploaded to your private TradeTrack AI Screenshots folder in Google Drive.</p></div>
 <button class="secondary" id="backDashboard">Back to dashboard</button>`;
 $('#mt5Settings').onsubmit=async e=>{
   e.preventDefault();
   let f=new FormData(e.target),next={...s,url:String(f.get('url')||'').trim(),apiKey:String(f.get('apiKey')||'').trim()};
   saveMt5Settings(next);
   await syncGoogleSheets(next);
 };
 $('#pushJournal').onclick=async()=>{await pushAllJournalToCloud()};
 $('#pullJournal').onclick=async()=>{await pullJournalFromCloud()};
 $('#backDashboard').onclick=()=>{route='dashboard';render()}
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
 if(!response.ok)throw new Error(`HTTP ${response.status}`);
 let data=await response.json();
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
 let a=t.answers||{};
 return {
   action:'saveChecklist',tradeId:t.id,date:t.date||'',script:t.script||'',mode:t.mode||'',
   rsiTrend:a['Pre-Entry|RSI Trend']||'',rsiLevel:a['Pre-Entry|RSI Level']||'',
   liquidityPre:a['Pre-Entry|Liquidity (SL Hunt)']||'',engulfingPre:a['Pre-Entry|Engulfing Candle']||'',
   divergent:a['Pre-Entry|Divergent']||'',obEntry:a['Entry|OB Entry (On retracement)']||'',
   candleCloseEntry:a['Entry|Candle Close Entry']||'',engulfingSL:a['SL|Engulfing Candle']||'',
   nearestSwing:a['SL|Nearest Swing']||'',othersSL:a['SL|Others']||'',
   rsiTarget:a['Target|RSI Level']||'',oppositeEngulfing:a['Target|Opposite Engulfing Candle']||'',
   liquidityTarget:a['Target|Liquidity (SL Hunt)']||'',othersTarget:a['Target|Others']||'',
   preEntryScore:categoryScore(t,groups[0]),entryScore:categoryScore(t,groups[1]),
   slScore:categoryScore(t,groups[2]),targetScore:categoryScore(t,groups[3]),
   overallScore:scoreOf(t),lockedAt:t.lockedAt?new Date(t.lockedAt).toISOString():''
 };
}
async function uploadScreenshotToDrive(t,kind,s=getMt5Settings()){
 let dataUrl=kind==='before'?t.beforeImage:t.verification?.afterImage;
 if(!dataUrl||!String(dataUrl).startsWith('data:image/'))return '';
 let existing=kind==='before'?t.beforeImageUrl:t.verification?.afterImageUrl;
 if(existing)return existing;
 let res=await apiPost({action:'uploadScreenshot',tradeId:t.id,kind,dataUrl,script:t.script||'',date:t.date||''},s);
 if(kind==='before')t.beforeImageUrl=res.url||'';else{t.verification=t.verification||{};t.verification.afterImageUrl=res.url||''}
 return res.url||'';
}
async function pushTradeToCloud(t,s=getMt5Settings()){
 if(!s.url||!s.apiKey)return {skipped:true};
 try{await uploadScreenshotToDrive(t,'before',s)}catch(e){console.warn('Before screenshot upload failed',e)}
 try{await uploadScreenshotToDrive(t,'after',s)}catch(e){console.warn('After screenshot upload failed',e)}
 await apiPost(tradeCloudPayload(t),s);
 if(hasChecklist(t))await apiPost(checklistCloudPayload(t),s);
 let all=getTrades(),i=all.findIndex(x=>x.id===t.id);if(i>=0){all[i]=t;putTrades(all)}
 return {ok:true};
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
async function pullJournalFromCloud(){
 let s=getMt5Settings();
 try{
   let [tr,cl]=await Promise.all([apiGet('getTrades',s),apiGet('getChecklist',s)]);
   let checklistById={};(cl.checklist||[]).forEach(c=>checklistById[String(c['Trade ID']||'')]=c);
   let all=getTrades(),added=0,updated=0;
   for(const r of (tr.trades||[])){
     let id=String(r['Trade ID']||'').trim();if(!id)continue;
     let i=all.findIndex(t=>String(t.id)===id),old=i>=0?all[i]:null,c=checklistById[id];
     let date=normalizeSheetDate(r['Date']||c?.['Date']||'').slice(0,10);
     let tm=String(r['Time']||'').trim(),timestamp=date+(tm?`T${tm}`:'T00:00');
     let answers=c?checklistFromCloudRow(c):(old?.answers||{});
     let t={
       id,date,timestamp,mode:String(r['Mode']||c?.['Mode']||old?.mode||'Paper'),market:String(r['Market']||old?.market||'India'),currency:String(r['Currency']||old?.currency||'INR'),
       script:String(r['Script']||c?.['Script']||old?.script||''),direction:String(r['Direction']||old?.direction||'Buy'),
       plannedEntry:r['Planned Entry']??old?.plannedEntry??'',plannedSL:r['Planned SL']??old?.plannedSL??'',
       plannedTarget:r['Planned Target']??old?.plannedTarget??'',answers,beforeImage:old?.beforeImage||'',beforeImageUrl:String(r['Before Screenshot URL']||old?.beforeImageUrl||''),
       lockedAt:old?.lockedAt||Date.now(),source:old?.source||'Cloud',
       mt5:old?.mt5||((r['MT5 Ticket']||'')?{ticket:String(r['MT5 Ticket'])}:undefined),
       verification:{
         ...(old?.verification||{}),actualEntry:r['Actual Entry']??'',actualExit:r['Actual Exit']??'',
         result:String(r['Result']||''),pnl:r['P&L']??'',rr:r['R:R']??'',
         followed:String(r['Followed Setup']||''),movedSL:String(r['Moved SL']||''),
         exitedEarly:String(r['Exited Early']||''),notes:String(r['Review Notes']||old?.verification?.notes||''),
         afterImage:old?.verification?.afterImage||'',afterImageUrl:old?.verification?.afterImageUrl||''
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
async function syncGoogleSheets(s=getMt5Settings()){
 if(!s.url||!s.apiKey){alert('Enter the Apps Script URL and API key first.');return}
 try{
   let data=await apiGet('getMT5',s);
   let rows=Array.isArray(data.mt5)?data.mt5:[],all=getTrades(),added=0,updated=0,linked=0;
   for(const x of rows){
     let ticket=String(x['MT5 Ticket']||x['Deal ID']||'').trim();
     if(!ticket)continue;
     let id='mt5-'+ticket,i=all.findIndex(t=>t.id===id||String(t.mt5?.ticket||'')===ticket);
     let pnl=Number(x['Net P&L'] ?? x['Profit'] ?? 0);
     let closed=normalizeSheetDate(x['Close Time']||x['Open Time']||localNow());
     let opened=normalizeSheetDate(x['Open Time']||closed);
     let direction=String(x['Direction']||'').toLowerCase()==='sell'?'Sell':'Buy';
     let planned=i<0?findPlannedMatch(all,x,direction,closed):null;
     if(i<0&&planned){i=all.findIndex(t=>t.id===planned.id);id=planned.id;linked++}
     let old=i>=0?all[i]:null;
     let v={
       ...(old?.verification||{}),
       actualEntry:x['Open Price']??old?.verification?.actualEntry??'',
       actualSL:x['SL']??old?.verification?.actualSL??'',
       actualTarget:x['TP']??old?.verification?.actualTarget??'',
       actualExit:x['Close Price']??old?.verification?.actualExit??'',
       quantity:x['Volume']??old?.verification?.quantity??'1',
       lotSize:old?.verification?.lotSize||'1',
       charges:Math.abs(Number(x['Commission']||0))+Math.abs(Number(x['Swap']||0)),
       pnl,result:pnl>0?'Win':pnl<0?'Loss':'Breakeven',
       notes:old?.verification?.notes||'Imported from MT5 via Google Sheets',
       afterImage:old?.verification?.afterImage||'',afterImageUrl:old?.verification?.afterImageUrl||''
     };
     v.rr=riskReward(v,direction);
     let t={
       ...(old||{}),id,mode:old?.mode||'Live',market:old?.market||'Forex',currency:old?.currency||'USD',date:closed.slice(0,10),timestamp:closed.slice(0,16),
       script:String(x['Symbol']||old?.script||''),direction,
       plannedEntry:old?.plannedEntry||'',plannedSL:old?.plannedSL||'',plannedTarget:old?.plannedTarget||'',
       answers:old?.answers||{},beforeImage:old?.beforeImage||'',beforeImageUrl:old?.beforeImageUrl||'',
       lockedAt:old?.lockedAt||(parseLocalTime(closed)||Date.now()),verification:v,source:'MT5',
       mt5:{
         ...(old?.mt5||{}),ticket,orderId:x['Order ID']||'',dealId:x['Deal ID']||'',symbol:x['Symbol']||'',
         volume:x['Volume']||'',openTime:opened,closeTime:closed,entry:x['Open Price']??'',
         exit:x['Close Price']??'',sl:x['SL']??'',target:x['TP']??'',profit:x['Profit']??'',
         commission:x['Commission']??'',swap:x['Swap']??'',pnl,comment:x['Comment']||'',
         magicNumber:x['Magic Number']||'',lastSyncedAt:x['Last Synced At']||''
       }
     };
     if(i<0){all.unshift(t);added++}else{all[i]=t;updated++}
   }
   putTrades(all);
   let next={...s,lastSync:new Date().toISOString()};saveMt5Settings(next);
   alert(`MT5 sync complete: ${added} new, ${updated} updated${linked?`, ${linked} linked to planned journal trade(s)`:''}.`);
   route='dashboard';render();
 }catch(err){
   console.error('TradeTrack Google sync error',err);
   alert(`MT5 sync failed: ${err.message}`);
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
 isMt5=!!(t.source==='MT5'||m.ticket),openTime=m.openTime||'',closeTime=m.closeTime||'',
 mt5Info=isMt5?`<div class="mt5-detail-grid"><div><span>MT5 Ticket</span><b>${esc(m.ticket||'—')}</b></div><div><span>Volume</span><b>${m.volume!==''&&m.volume!=null?esc(m.volume):'—'}</b></div><div><span>Entry</span><b>${m.entry!==''&&m.entry!=null?fmt(m.entry):'—'}</b></div><div><span>Exit</span><b>${m.exit!==''&&m.exit!=null?fmt(m.exit):'—'}</b></div><div><span>SL</span><b>${m.sl!==''&&m.sl!=null?fmt(m.sl):'—'}</b></div><div><span>TP</span><b>${m.target!==''&&m.target!=null?fmt(m.target):'—'}</b></div><div><span>Open time</span><b>${esc(openTime||'—')}</b></div><div><span>Close time</span><b>${esc(closeTime||'—')}</b></div></div>`:'',
 shots=(t.beforeImageUrl||v.afterImageUrl)?`<div class="screenshot-actions">${t.beforeImageUrl?`<button type="button" data-shot="${esc(t.beforeImageUrl)}" data-shot-title="Setup screenshot">View setup screenshot</button>`:''}${v.afterImageUrl?`<button type="button" data-shot="${esc(v.afterImageUrl)}" data-shot-title="After-trade screenshot">View after screenshot</button>`:''}</div>`:'',
 linkState=isMt5?(checklistPresent?'<span class="linked-badge">Linked to checklist</span>':'<span class="unlinked-badge">MT5 only</span>'):'';
 return `<div class="trade-card history-trade-card ${loss?'history-loss-card':''}"><div class="history-top"><div><strong>${esc(t.script||'Untitled')}</strong><small>${esc(t.date||'No date')} · ${esc(t.direction)} · ${esc(t.mode)} · ${cur} ${linkState}</small></div><button class="history-open" data-open="${t.id}">Open</button></div><div class="history-middle"><div class="history-score"><span>Strategy Score</span><b>${checklistPresent?wholePercent(p):"—"}</b></div><div class="history-heads">${groups.map(g=>`<div><span>${g.name}</span><b>${checklistPresent?wholePercent(categoryPercent(t,g)):'—'}</b></div>`).join('')}</div></div>${mt5Info}${shots}<div class="history-columns history-summary"><div><span>P&amp;L</span><b>${pnl}</b></div><div><span>R:R</span><b>${rr}</b></div><div><span>Result</span><b>${v.result||'Pending'}</b></div><div><span>Plan followed</span><b>${v.followed||'—'}</b></div></div></div>`
}
function renderTrade(){let ts=getTrades(), t=editingId?(draft||ts.find(x=>x.id===editingId)):null; if(!t)t=draft||emptyTrade(); if(!editingId)draft=t; const locked=false;
 app.innerHTML=heading(editingId?'Edit trade':'New trade','Checklist answers, scores, and actual details can be changed any time.')+
 `<form id="tradeForm">${actualTradeForm(t,locked)}${checklist(t)}<button class="primary" type="submit">${editingId?'Update trade':'Save trade'}</button><p class="hint">Nothing is locked. Open any saved trade from History whenever you want to edit it.</p></form>`+(editingId?`<div class="row-actions"><button class="secondary" id="backHistory">Back to history</button><button class="danger" id="deleteTrade">Delete trade</button></div>`:'');
 attachTrade(t,locked);
}
function checklist(t){let summary=groups.map(g=>`${g.name}: ${wholePercent(categoryPercent(t,g))}`).join('<br>');return `<div class="score-banner"><div><small>Strategy score · ${qualification(percentOf(t))}</small><strong id="scoreValue">${wholePercent(percentOf(t))}</strong></div><div class="score-details" id="scoreDetails">Strategy score: ${wholePercent(percentOf(t))}<br>${summary}</div></div><div class="notice">Category displayed totals: Pre-Entry 9 · Entry 2 · SL 2 · Target 2 · Overall denominator 15.</div>${groups.map(g=>`<div class="check-group"><header>${g.name}<span id="category-${g.name}">${wholePercent(categoryPercent(t,g))}</span></header>${g.items.map(([name,w])=>{let k=g.name+'|'+name,a=t.answers[k];return `<div class="check-row"><span class="item-name">${name}</span><span class="weight">WT ${w}</span><span class="answer"><button type="button" class="yes ${a==='Yes'?'active':''}" data-answer="Yes" data-key="${esc(k)}">YES</button><button type="button" class="no ${a==='No'?'active':''}" data-answer="No" data-key="${esc(k)}">NO</button></span></div>`}).join('')}</div>`).join('')}`}
function preTradeSummary(t){return `<div class="score-banner"><div><small>Locked strategy score · ${qualification(percentOf(t))}</small><strong>${fmt(percentOf(t))}%</strong></div><div class="score-details">Overall: ${scoreOf(t)} / 15<br>Pre-entry ${categoryScore(t,groups[0])}/9 · Entry ${categoryScore(t,groups[1])}/2<br>SL ${categoryScore(t,groups[2])}/2 · Target ${categoryScore(t,groups[3])}/2</div></div><div class="card"><h3>Locked checklist</h3>${groups.map(g=>`<p class="hint"><b>${g.name}</b> — ${g.items.filter(([n])=>t.answers[g.name+'|'+n]==='Yes').map(([n])=>n).join(', ')||'No YES responses'}</p>`).join('')}<div class="photo-grid">${t.beforeImage?`<div class="photo-box">Before-trade screenshot<img src="${t.beforeImage}" alt="Before-trade chart"></div>`:''}</div></div>`}
function imageInput(name,value,label){return `<div class="photo-box"><b>${label}</b>${value?`<img src="${value}" alt="${label}">`:''}<input type="file" accept="image/*" data-image="${name}"></div>`}
function actualTradeForm(t,locked){let v=t.verification||{},rr=riskReward(v,t.direction),pnl=calculatedPnl(v,t.direction);return `<div class="card"><h2>Actual trade & execution</h2><div class="form-grid"><label>Mode<div class="segmented" id="modeButtons">${['Backtest','Paper','Live'].map(x=>`<button type="button" data-mode="${x}" class="${t.mode===x?'selected':''}" ${locked?'disabled':''}>${x}</button>`).join('')}</div></label><label>Market<select name="market"><option ${t.market==='India'?'selected':''}>India</option><option ${t.market==='Forex'?'selected':''}>Forex</option></select></label><label>Currency<select name="currency"><option value="INR" ${tradeCurrency(t)==='INR'?'selected':''}>INR ₹</option><option value="USD" ${tradeCurrency(t)==='USD'?'selected':''}>USD $</option></select></label><label>Date<input name="date" type="date" value="${esc(t.date)}" ${locked?'disabled':''}></label><label>Timestamp<input name="timestamp" type="datetime-local" value="${esc(t.timestamp)}" ${locked?'disabled':''}></label><label class="wide">Script / Stock<input name="script" placeholder="e.g. NIFTY" value="${esc(t.script)}" ${locked?'disabled':''}></label><label>Direction<select name="direction" ${locked?'disabled':''}><option ${t.direction==='Buy'?'selected':''}>Buy</option><option ${t.direction==='Sell'?'selected':''}>Sell</option></select></label><label>Actual Entry<input name="actualEntry" type="number" step="any" value="${esc(v.actualEntry)}"></label><label>Actual Stop Loss<input name="actualSL" type="number" step="any" value="${esc(v.actualSL)}"></label><label>Actual Target<input name="actualTarget" type="number" step="any" value="${esc(v.actualTarget)}"></label><label>Actual Exit<input name="actualExit" type="number" step="any" value="${esc(v.actualExit)}"></label><label>Lots / Quantity<input name="quantity" type="number" step="any" min="0" value="${esc(v.quantity||'1')}"></label><label>Lot size<input name="lotSize" type="number" step="any" min="0" value="${esc(v.lotSize||'1')}"></label><label>Charges<input name="charges" type="number" step="any" min="0" value="${esc(v.charges)}"></label><label>Result<select name="result"><option value="">Not verified</option>${['Win','Loss','Breakeven'].map(x=>`<option ${v.result===x?'selected':''}>${x}</option>`).join('')}</select></label><label>Calculated net P&amp;L<input id="pnlCalculated" readonly value="${pnl===''?'Enter entry, exit, quantity & lot size':fmt(pnl)}"></label><label>Calculated R:R<input id="rrCalculated" readonly value="${rr===''?'Enter entry, SL & target':'1 : '+fmt(rr)}"></label><label>Followed setup<div class="segmented" data-field="followed">${yn(v.followed)}</div></label><label>Moved stop loss<div class="segmented" data-field="movedSL">${yn(v.movedSL)}</div></label><label>Exited early<div class="segmented" data-field="exitedEarly">${yn(v.exitedEarly)}</div></label><label class="wide">Review notes<textarea name="notes" placeholder="What happened? What will you repeat or change?">${esc(v.notes)}</textarea></label></div><div class="photo-grid">${imageInput('beforeImage',t.beforeImage,'Setup screenshot')}${t.beforeImageUrl?`<button type="button" class="secondary" data-shot="${esc(t.beforeImageUrl)}" data-shot-title="Setup screenshot">View saved setup screenshot</button>`:''}${imageInput('afterImage',v.afterImage,'After-trade chart')}${v.afterImageUrl?`<button type="button" class="secondary" data-shot="${esc(v.afterImageUrl)}" data-shot-title="After-trade screenshot">View saved after screenshot</button>`:''}</div><p class="hint">Choose a chart image from your iPhone Photos library or take a new photo. P&amp;L is calculated from entry, exit, direction, quantity, lot size and charges; P&amp;L refreshes while you edit any of these values.</p></div>`}
function yn(v){return ['Yes','No'].map(x=>`<button type="button" class="${v===x?'selected':''}" data-yn="${x}">${x}</button>`).join('')}
function syncDraft(t,form,locked){if(!form)return;if(!locked)['date','timestamp','script','direction','market','currency'].forEach(k=>{const el=form.elements[k];if(el)t[k]=el.value});t.verification=t.verification||{};['actualEntry','actualSL','actualTarget','actualExit','quantity','lotSize','charges','result','notes'].forEach(k=>{const el=form.elements[k];if(el)t.verification[k]=el.value});t.verification.pnl=calculatedPnl(t.verification,t.direction);t.verification.rr=riskReward(t.verification,t.direction);let rr=$('#rrCalculated');if(rr)rr.value=t.verification.rr===''?'Enter entry, SL & target':'1 : '+fmt(t.verification.rr);let pnl=$('#pnlCalculated');if(pnl)pnl.value=t.verification.pnl===''?'Enter entry, exit, quantity & lot size':fmt(t.verification.pnl)}
function attachTrade(t,locked){let form=$('#tradeForm'), pendingImages={beforeImage:t.beforeImage,afterImage:t.verification?.afterImage}; form?.querySelectorAll('[name]').forEach(el=>['input','change','blur'].forEach(event=>el.addEventListener(event,()=>syncDraft(t,form,locked)))); if(!locked)$('#modeButtons')?.addEventListener('click',e=>{let b=e.target.closest('[data-mode]');if(b){t.mode=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('selected',x===b))}});
 if(!locked)document.querySelectorAll('[data-answer]').forEach(b=>b.addEventListener('click',()=>{syncDraft(t,form,locked);t.answers[b.dataset.key]=b.dataset.answer;draft=t;renderTrade()}));
 document.querySelectorAll('[data-yn]').forEach(b=>b.addEventListener('click',()=>{t.verification=t.verification||{};t.verification[b.closest('[data-field]').dataset.field]=b.dataset.yn; b.closest('.segmented')?.querySelectorAll('button').forEach(x=>x.classList.toggle('selected',x===b))}));
 document.querySelectorAll('[data-image]').forEach(input=>input.addEventListener('change',e=>{syncDraft(t,form,locked);compressImage(e.target.files[0]).then(x=>{pendingImages[e.target.dataset.image]=x;if(e.target.dataset.image==='beforeImage'){t.beforeImage=x;t.beforeImageUrl=''}else{t.verification=t.verification||{};t.verification.afterImage=x;t.verification.afterImageUrl=''}draft=t;renderTrade()})}));
 form?.addEventListener('submit',e=>{e.preventDefault();let f=new FormData(form);['date','timestamp','script','direction','market','currency'].forEach(k=>{let v=f.get(k);if(v!==null)t[k]=v});t.beforeImage=pendingImages.beforeImage;t.verification={...t.verification,actualEntry:f.get('actualEntry'),actualSL:f.get('actualSL'),actualTarget:f.get('actualTarget'),actualExit:f.get('actualExit'),quantity:f.get('quantity'),lotSize:f.get('lotSize'),charges:f.get('charges'),result:f.get('result'),notes:f.get('notes'),afterImage:pendingImages.afterImage};t.verification.pnl=calculatedPnl(t.verification,t.direction);t.verification.rr=riskReward(t.verification,t.direction);let all=getTrades(),i=all.findIndex(x=>x.id===t.id);if(i<0)all.unshift(t);else all[i]=t;putTrades(all);pushTradeToCloud(t).catch(err=>console.warn('Cloud backup pending:',err));editingId=t.id;draft=null;route='history';render()});
 bindScreenshotButtons();
 $('#backHistory')?.addEventListener('click',()=>{route='history';render()}); $('#deleteTrade')?.addEventListener('click',()=>{if(confirm('Delete this trade permanently from this device?')){putTrades(getTrades().filter(x=>x.id!==t.id));editingId=null;route='history';render()}});
}
function compressImage(file){if(!file)return Promise.resolve('');return new Promise(resolve=>{let r=new FileReader();r.onload=()=>{let im=new Image();im.onload=()=>{let max=900,s=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=im.width*s;c.height=im.height*s;c.getContext('2d').drawImage(im,0,0,c.width,c.height);resolve(c.toDataURL('image/jpeg',.72))};im.src=r.result};r.readAsDataURL(file)})}
function renderHistory(){const ts=getTrades().slice().sort((a,b)=>b.lockedAt-a.lockedAt), modes=['All','Backtest','Paper','Live'];let x=historyFilter==='All'?ts:ts.filter(t=>t.mode===historyFilter);app.innerHTML=heading('Trade history','Open a record to verify or review it',`<div class="top-actions"><button class="secondary" id="csvBtn">CSV</button><button class="secondary" id="importBtn">Restore</button></div>`)+`<div class="filter-row">${modes.map(m=>`<button data-filter="${m}" class="${m===historyFilter?'active':''}">${m}</button>`).join('')}</div><div class="card">${x.length?x.map(tradeRow).join(''):`<div class="empty">No ${historyFilter==='All'?'':historyFilter+' '}trades saved yet.</div>`}</div>`;document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{historyFilter=b.dataset.filter;renderHistory()});document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>{editingId=b.dataset.open;draft=null;route='new';render()});$('#csvBtn').onclick=exportCSV;$('#importBtn').onclick=()=>$('#importFile').click();bindScreenshotButtons()}
function renderAnalysis(){const done=getTrades().filter(t=>verified(t)&&hasChecklist(t)), items=groups.flatMap(g=>g.items.map(([n,w])=>({group:g.name,name:n,w,key:g.name+'|'+n}))); app.innerHTML=heading('Strategy analysis','Find which rules deserve your trust')+`<div class="card"><h2>Checklist-item performance</h2>${done.length?items.map(i=>{let have=done.filter(t=>t.answers[i.key]==='Yes'),w=have.filter(t=>t.verification.result==='Win').length,l=have.filter(t=>t.verification.result==='Loss').length,wr=have.length?w/have.length*100:0;return `<div class="analysis-item"><div class="bar-row"><span>${i.name}<br><small>${i.group} · WT ${i.w}</small></span><div class="bar"><i style="width:${wr}%"></i></div><b>${fmt(wr)}%</b></div><small>${have.length} present · ${w} wins · ${l} losses</small></div>`}).join(''):`<div class="empty">Verify some trades first; then this view will reveal performance by checklist item.</div>`}</div><div class="card"><h2>Score vs win rate</h2>${done.length?bands(done).map(x=>{let wr=x.all.length?x.wins/x.all.length*100:0;return `<div class="bar-row"><span>${x.label}</span><div class="bar"><i style="width:${wr}%"></i></div><b>${x.all.length?fmt(wr)+'%':'—'}</b></div>`}).join(''):`<div class="empty">No verified trades yet.</div>`}</div><div class="notice">Only verified trades are included, so the analysis does not mistake unreviewed ideas for outcomes.</div>`}
function exportCSV(){let ts=getTrades(),headers=['ID','Mode','Market','Currency','Date','Timestamp','Script','Direction','Score / 15','Score %','Result','Actual Entry','Actual Stop Loss','Actual Target','Actual Exit','Lots / Quantity','Lot Size','Charges','P&L','R:R','Followed Setup','Moved SL','Exited Early','Review Notes',...groups.flatMap(g=>g.items.map(([n])=>g.name+' — '+n))];let rows=ts.map(t=>[t.id,t.mode,t.market||'',tradeCurrency(t),t.date,t.timestamp,t.script,t.direction,scoreOf(t),percentOf(t).toFixed(2),t.verification?.result,t.verification?.actualEntry,t.verification?.actualSL,t.verification?.actualTarget,t.verification?.actualExit,t.verification?.quantity,t.verification?.lotSize,t.verification?.charges,t.verification?.pnl,t.verification?.rr,t.verification?.followed,t.verification?.movedSL,t.verification?.exitedEarly,t.verification?.notes,...groups.flatMap(g=>g.items.map(([n])=>t.answers[g.name+'|'+n]||''))]);download('tradetrack-ai-backup-'+new Date().toISOString().slice(0,10)+'.csv',[headers,...rows].map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\n'),'text/csv')}
function backupJSON(){download('tradetrack-ai-full-backup-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify({app:'TradeTrack AI',version:2,trades:getTrades()},null,2),'application/json')}
function download(name,text,type){let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
$('#exportBtn').onclick=exportCSV; $('#importFile').onchange=e=>{let f=e.target.files[0];if(!f)return;let r=new FileReader();r.onload=()=>{try{let x=JSON.parse(r.result);if(!Array.isArray(x.trades))throw 0;if(confirm('Replace current local trade records with this backup?')){putTrades(x.trades);render()}}catch{alert('This is not a valid TradeTrack AI full backup.')}};r.readAsText(f);e.target.value=''};
migrateLegacy();document.querySelectorAll('[data-route]').forEach(b=>b.onclick=()=>{route=b.dataset.route;if(route==='new'){editingId=null;draft=null}render()});if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js');render();
