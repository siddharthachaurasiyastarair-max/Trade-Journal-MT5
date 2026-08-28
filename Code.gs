const SPREADSHEET_ID = "1MvyMfRKmsV578ADDuJkQhp2n0S46h8AaF71_k3M8T_Q";
const SCREENSHOT_FOLDER_ID = "1Hl6yBTRRlTd4fl1qqLU2qIhWSxoCWA0A";
const MT5_HEADERS = [
  "MT5 Ticket","Order ID","Deal ID","Position ID","Account Login","Account Server","Account Currency",
  "Symbol","Direction","Volume","Open Time","Close Time","Open Price","Close Price","SL","TP",
  "Profit","Commission","Swap","Net P&L","Comment","Magic Number","Trade ID Match",
  "RSI Timeframe","RSI Period","RSI Lookback","RSI Slope Threshold","RSI Use Live Level",
  "Entry RSI","Entry RSI Live","Entry RSI Closed","Entry RSI Values","Entry RSI Slope","Entry RSI Trend",
  "Entry RSI Up Moves","Entry RSI Down Moves","Entry RSI Candle Time","Entry RSI Captured At","Entry RSI Capture",
  "Exit RSI","Exit RSI Live","Exit RSI Closed","Exit RSI Values","Exit RSI Slope","Exit RSI Trend",
  "Exit RSI Up Moves","Exit RSI Down Moves","Exit RSI Candle Time","Exit RSI Captured At","Exit RSI Capture",
  "Last Synced At"
];
const CHECKLIST_HEADERS = [
  "Trade ID","Date","Script","Mode","RSI Trend","RSI Level","Liquidity (SL Hunt)","Engulfing Candle - Pre","Divergent",
  "OB Entry (On retracement)","Candle Close Entry","Engulfing Candle - SL","Nearest Swing","Others - SL","RSI Level - Target",
  "Opposite Engulfing Candle","Liquidity (SL Hunt) - Target","Others - Target","Pre-Entry Score","Entry Score","SL Score",
  "Target Score","Overall Score","Locked At","Auto RSI Answers JSON","RSI Overrides JSON","Entry RSI Evidence JSON","Exit RSI Evidence JSON"
];

function doGet(e) {
  try {
    const action=(e&&e.parameter&&e.parameter.action)||"ping";
    if(action==="ping") return jsonResponse({ok:true,message:"TradeTrack AI API is running",time:new Date().toISOString()});
    checkApiKey(e.parameter.apiKey);
    if(action==="getTrades") return jsonResponse({ok:true,trades:sheetToObjects("Trades")});
    if(action==="getChecklist") { ensureSheetColumns("Checklist",CHECKLIST_HEADERS); return jsonResponse({ok:true,checklist:sheetToObjects("Checklist")}); }
    if(action==="getMT5") { ensureSheetColumns("MT5_Data",MT5_HEADERS); return jsonResponse({ok:true,mt5:sheetToObjects("MT5_Data")}); }
    if(action==="getScreenshot") return jsonResponse(getScreenshot(e.parameter.fileId));
    if(action==="fundedNextStatus") return jsonResponse(typeof fundedNextStatus==="function"?fundedNextStatus():{ok:true,configured:false});
    return jsonResponse({ok:false,error:"Unknown action"});
  } catch(err) { return jsonResponse({ok:false,error:err.message}); }
}

function doPost(e) {
  try {
    if(!e||!e.postData||!e.postData.contents) throw new Error("No POST data received");
    const data=JSON.parse(e.postData.contents); checkApiKey(data.apiKey);
    switch(data.action) {
      case "saveTrade": return jsonResponse(saveTrade(data));
      case "saveChecklist": return jsonResponse(saveChecklist(data));
      case "verifyTrade": return jsonResponse(verifyTrade(data));
      case "mt5Trade": return jsonResponse(saveMT5Trade(data));
      case "uploadScreenshot": return jsonResponse(uploadScreenshot(data));
      case "testFundedNext": if(typeof testFundedNext==="function") return jsonResponse(testFundedNext(data)); throw new Error("FundedNext helper is not installed in this Apps Script project");
      case "syncFundedNext": if(typeof syncFundedNext==="function") return jsonResponse(syncFundedNext(data)); throw new Error("FundedNext helper is not installed in this Apps Script project");
      default: throw new Error("Unknown action");
    }
  } catch(err) { return jsonResponse({ok:false,error:err.message}); }
}

function ensureTradeColumns() {
  const sh=getSheet("Trades");
  const required=["Market","Currency","Before Screenshot URL","After Screenshot URL"];
  const headers=sh.getRange(1,1,1,Math.max(1,sh.getLastColumn())).getValues()[0];
  required.forEach(h=>{if(!headers.includes(h)){sh.getRange(1,sh.getLastColumn()+1).setValue(h);headers.push(h)}});
}

function ensureSheetColumns(name,required) {
  const sh=getSheet(name);
  let lastColumn=Math.max(1,sh.getLastColumn());
  let headers=sh.getRange(1,1,1,lastColumn).getValues()[0].map(String);
  if(sh.getLastRow()===0 || headers.every(h=>!h.trim())) {
    headers=required.slice();
    sh.getRange(1,1,1,headers.length).setValues([headers]);
    return headers;
  }
  required.forEach(h=>{
    if(!headers.includes(h)) {
      sh.getRange(1,headers.length+1).setValue(h);
      headers.push(h);
    }
  });
  return headers;
}

function saveTrade(data) {
  ensureTradeColumns();
  const sh=getSheet("Trades"),headers=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  const id=data.tradeId||createTradeId();
  const obj={
    "Trade ID":id,"Date":data.date||"","Time":data.time||"","Mode":data.mode||"",
    "Market":data.market||"","Currency":data.currency||"","Script":data.script||"","Direction":data.direction||"",
    "Planned Entry":valueOrBlank(data.plannedEntry),"Planned SL":valueOrBlank(data.plannedSL),"Planned Target":valueOrBlank(data.plannedTarget),
    "Pre-Entry %":valueOrBlank(data.preEntryPercent),"Entry %":valueOrBlank(data.entryPercent),"SL %":valueOrBlank(data.slPercent),
    "Target %":valueOrBlank(data.targetPercent),"Overall %":valueOrBlank(data.overallPercent),"Strategy Grade":data.strategyGrade||"",
    "Locked":data.locked===true?"YES":"NO","MT5 Ticket":data.mt5Ticket||"","Actual Entry":valueOrBlank(data.actualEntry),
    "Actual Exit":valueOrBlank(data.actualExit),"Result":data.result||"","P&L":valueOrBlank(data.pnl),"R:R":valueOrBlank(data.rr),
    "Followed Setup":data.followedSetup||"","Moved SL":data.movedSL||"","Exited Early":data.exitedEarly||"",
    "Review Notes":data.reviewNotes||"","Before Screenshot URL":data.beforeScreenshotUrl||"","After Screenshot URL":data.afterScreenshotUrl||""
  };
  const row=headers.map(h=>Object.prototype.hasOwnProperty.call(obj,h)?obj[h]:"");
  const existing=findRowByValue(sh,1,id);
  if(existing) {
    const old=sh.getRange(existing,1,1,row.length).getValues()[0];
    ["Before Screenshot URL","After Screenshot URL"].forEach(h=>{const i=headers.indexOf(h);if(i>=0&&!row[i])row[i]=old[i]||""});
    sh.getRange(existing,1,1,row.length).setValues([row]);
  } else sh.appendRow(row);
  return {ok:true,tradeId:id,message:existing?"Trade updated":"Trade saved"};
}

function saveChecklist(data) {
  const sh=getSheet("Checklist"),headers=ensureSheetColumns("Checklist",CHECKLIST_HEADERS); if(!data.tradeId) throw new Error("tradeId is required");
  const obj={
    "Trade ID":data.tradeId,"Date":data.date||"","Script":data.script||"","Mode":data.mode||"","RSI Trend":data.rsiTrend||"","RSI Level":data.rsiLevel||"",
    "Liquidity (SL Hunt)":data.liquidityPre||"","Engulfing Candle - Pre":data.engulfingPre||"","Divergent":data.divergent||"",
    "OB Entry (On retracement)":data.obEntry||"","Candle Close Entry":data.candleCloseEntry||"","Engulfing Candle - SL":data.engulfingSL||"",
    "Nearest Swing":data.nearestSwing||"","Others - SL":data.othersSL||"","RSI Level - Target":data.rsiTarget||"",
    "Opposite Engulfing Candle":data.oppositeEngulfing||"","Liquidity (SL Hunt) - Target":data.liquidityTarget||"","Others - Target":data.othersTarget||"",
    "Pre-Entry Score":valueOrBlank(data.preEntryScore),"Entry Score":valueOrBlank(data.entryScore),"SL Score":valueOrBlank(data.slScore),
    "Target Score":valueOrBlank(data.targetScore),"Overall Score":valueOrBlank(data.overallScore),"Locked At":data.lockedAt||new Date(),
    "Auto RSI Answers JSON":data.autoRsiAnswers||"","RSI Overrides JSON":data.rsiOverrides||"",
    "Entry RSI Evidence JSON":data.entryRsiEvidence||"","Exit RSI Evidence JSON":data.exitRsiEvidence||""
  };
  const idColumn=headers.indexOf("Trade ID")+1,existing=findRowByValue(sh,idColumn,data.tradeId);
  const row=existing?sh.getRange(existing,1,1,headers.length).getValues()[0]:headers.map(()=>"");
  headers.forEach((h,i)=>{if(Object.prototype.hasOwnProperty.call(obj,h))row[i]=obj[h]});
  if(existing) sh.getRange(existing,1,1,row.length).setValues([row]); else sh.appendRow(row);
  return {ok:true,tradeId:data.tradeId};
}

function verifyTrade(data) {
  ensureTradeColumns(); const sh=getSheet("Trades"),rowNo=findRowByValue(sh,1,data.tradeId); if(!rowNo) throw new Error("Trade not found");
  const headers=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0],row=sh.getRange(rowNo,1,1,headers.length).getValues()[0];
  const set=(h,v)=>{const i=headers.indexOf(h);if(i>=0&&v!==undefined)row[i]=v};
  set("MT5 Ticket",data.mt5Ticket);set("Actual Entry",data.actualEntry);set("Actual Exit",data.actualExit);set("Result",data.result);set("P&L",data.pnl);set("R:R",data.rr);set("Followed Setup",data.followedSetup);set("Moved SL",data.movedSL);set("Exited Early",data.exitedEarly);set("Review Notes",data.reviewNotes);
  sh.getRange(rowNo,1,1,row.length).setValues([row]); return {ok:true,tradeId:data.tradeId};
}

function uploadScreenshot(data) {
  if(!data.tradeId) throw new Error("tradeId is required");
  if(!data.dataUrl||String(data.dataUrl).indexOf("data:image/")!==0) throw new Error("Valid image data is required");
  const m=String(data.dataUrl).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/); if(!m) throw new Error("Invalid image format");
  const bytes=Utilities.base64Decode(m[2]);
  if(bytes.length>8*1024*1024) throw new Error("Screenshot is too large after compression");
  const lock=LockService.getScriptLock();
  lock.waitLock(30000);
  let folder;
  try {
    const root=DriveApp.getFolderById(SCREENSHOT_FOLDER_ID);
    const folders=root.getFoldersByName(String(data.tradeId)); folder=folders.hasNext()?folders.next():root.createFolder(String(data.tradeId));
  } finally { lock.releaseLock(); }
  const ext=m[1].includes("png")?"png":"jpg";
  const safeScript=String(data.script||"trade").replace(/[^a-zA-Z0-9_-]+/g,"_");
  const name=`${data.date||Utilities.formatDate(new Date(),"Asia/Kolkata","yyyy-MM-dd")}_${safeScript}_${data.kind||"screenshot"}.${ext}`;
  const blob=Utilities.newBlob(bytes,m[1],name);
  const file=folder.createFile(blob);
  return {ok:true,fileId:file.getId(),url:file.getUrl(),name:file.getName()};
}

function getScreenshot(fileId) {
  if(!fileId) throw new Error("fileId is required");
  const file=DriveApp.getFileById(fileId);
  const blob=file.getBlob();
  const mime=blob.getContentType()||"image/jpeg";
  if(String(mime).indexOf("image/")!==0) throw new Error("The Drive file is not an image");
  const dataUrl="data:"+mime+";base64,"+Utilities.base64Encode(blob.getBytes());
  return {ok:true,fileId:fileId,name:file.getName(),dataUrl:dataUrl};
}

function saveMT5Trade(data) {
  const sh=getSheet("MT5_Data"),headers=ensureSheetColumns("MT5_Data",MT5_HEADERS),ticket=String(data.mt5Ticket||""); if(!ticket) throw new Error("mt5Ticket is required");
  const profit=Number(data.profit||0),commission=Number(data.commission||0),swap=Number(data.swap||0);
  const obj={
    "MT5 Ticket":ticket,"Order ID":data.orderId||"","Deal ID":data.dealId||"","Position ID":data.positionId||"",
    "Account Login":data.accountLogin||"","Account Server":data.accountServer||"","Account Currency":data.accountCurrency||"",
    "Symbol":data.symbol||"","Direction":data.direction||"","Volume":valueOrBlank(data.volume),"Open Time":data.openTime||"","Close Time":data.closeTime||"",
    "Open Price":valueOrBlank(data.openPrice),"Close Price":valueOrBlank(data.closePrice),"SL":valueOrBlank(data.sl),"TP":valueOrBlank(data.tp),
    "Profit":profit,"Commission":commission,"Swap":swap,"Net P&L":valueOrBlank(data.netProfit!==undefined?data.netProfit:profit+commission+swap),
    "Comment":data.comment||"","Magic Number":data.magicNumber||"","Trade ID Match":data.tradeIdMatch||"",
    "RSI Timeframe":data.rsiTimeframe||"M1","RSI Period":valueOrBlank(data.rsiPeriod),"RSI Lookback":valueOrBlank(data.rsiLookback),
    "RSI Slope Threshold":valueOrBlank(data.rsiSlopeThreshold),"RSI Use Live Level":(data.rsiUseLiveLevel===true||String(data.rsiUseLiveLevel).toLowerCase()==="true")?"YES":"NO",
    "Entry RSI":valueOrBlank(data.entryRsi),"Entry RSI Live":valueOrBlank(data.entryRsiLive),"Entry RSI Closed":valueOrBlank(data.entryRsiClosed),
    "Entry RSI Values":data.entryRsiValues||"","Entry RSI Slope":valueOrBlank(data.entryRsiSlope),"Entry RSI Trend":data.entryRsiTrend||"",
    "Entry RSI Up Moves":valueOrBlank(data.entryRsiUpMoves),"Entry RSI Down Moves":valueOrBlank(data.entryRsiDownMoves),
    "Entry RSI Candle Time":data.entryRsiCandleTime||"","Entry RSI Captured At":data.entryRsiCapturedAt||"","Entry RSI Capture":data.entryRsiCapture||"",
    "Exit RSI":valueOrBlank(data.exitRsi),"Exit RSI Live":valueOrBlank(data.exitRsiLive),"Exit RSI Closed":valueOrBlank(data.exitRsiClosed),
    "Exit RSI Values":data.exitRsiValues||"","Exit RSI Slope":valueOrBlank(data.exitRsiSlope),"Exit RSI Trend":data.exitRsiTrend||"",
    "Exit RSI Up Moves":valueOrBlank(data.exitRsiUpMoves),"Exit RSI Down Moves":valueOrBlank(data.exitRsiDownMoves),
    "Exit RSI Candle Time":data.exitRsiCandleTime||"","Exit RSI Captured At":data.exitRsiCapturedAt||"","Exit RSI Capture":data.exitRsiCapture||"",
    "Last Synced At":new Date()
  };
  const ticketColumn=headers.indexOf("MT5 Ticket")+1;
  const existing=findRowByValue(sh,ticketColumn,ticket);
  const row=existing?sh.getRange(existing,1,1,headers.length).getValues()[0]:headers.map(()=>"");
  headers.forEach((h,i)=>{if(Object.prototype.hasOwnProperty.call(obj,h))row[i]=obj[h]});
  if(existing) sh.getRange(existing,1,1,row.length).setValues([row]); else sh.appendRow(row);
  return {ok:true,mt5Ticket:ticket,message:existing?"MT5 trade updated":"MT5 trade added"};
}

function sheetToObjects(name) {
  const sh=getSheet(name),values=sh.getDataRange().getValues(); if(values.length<2)return [];
  const headers=values[0]; return values.slice(1).filter(r=>r.some(v=>v!=="")).map(r=>{const o={};headers.forEach((h,i)=>o[String(h)]=serializeValue(r[i]));return o});
}
function serializeValue(v){if(v instanceof Date)return Utilities.formatDate(v,"Asia/Kolkata","yyyy-MM-dd'T'HH:mm:ss");return v}
function valueOrBlank(v){return v===undefined||v===null?"":v}
function findRowByValue(sh,col,value){if(!value||sh.getLastRow()<2)return null;const a=sh.getRange(2,col,sh.getLastRow()-1,1).getValues(),t=String(value);for(let i=0;i<a.length;i++)if(String(a[i][0])===t)return i+2;return null}
function getSheet(name){const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(name);if(!sh)throw new Error("Sheet not found: "+name);return sh}
function createTradeId(){return "TRD-"+Utilities.formatDate(new Date(),"Asia/Kolkata","yyyyMMdd-HHmmss")+"-"+Math.floor(Math.random()*10000)}
function checkApiKey(key){const stored=PropertiesService.getScriptProperties().getProperty("TRADETRACK_API_KEY");if(!stored)throw new Error("API key is not configured");if(String(key||"")!==stored)throw new Error("Unauthorized")}
function jsonResponse(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON)}
function setupApiKey(){const key=Utilities.getUuid()+Utilities.getUuid();PropertiesService.getScriptProperties().setProperty("TRADETRACK_API_KEY",key);Logger.log("TRADETRACK_API_KEY = "+key)}

// Run this once from the Apps Script editor after replacing Code.gs. The temporary
// folder creation forces Google to request full Drive write permission.
function authorizeAndTestDrive() {
  const folder=DriveApp.getFolderById(SCREENSHOT_FOLDER_ID);
  const testFolder=folder.createFolder("TradeTrack permission test - safe to delete");
  const testId=testFolder.getId();
  testFolder.setTrashed(true);
  Logger.log("Drive read/write access OK: "+folder.getName()+" (temporary folder "+testId+" moved to trash)");
}
