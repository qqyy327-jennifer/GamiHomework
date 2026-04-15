// Hero's Quest - Google Apps Script Backend
// Sheet 1: Daily_Tasks  -> Date | Child_Name | Task_Name | Task_Type | Value | Status | Extra
// Sheet 2: Star_Ledger  -> Timestamp | Child_Name | Amount | Reason | Category

function getSpreadsheet() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
}

function jsonOut(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Default task definitions ───────────────────────────────────────────────

// 學科由前端 quick-pick chips 新增；defaultTasks 只建立家事
function defaultTasks(child) {
  void child; // 兩人家事相同
  return [
    { taskName: '\u6574\u7406\u66f8\u5305', taskType: 'daily', value: 1 },
    { taskName: '\u64e6\u684c\u5b50',       taskType: 'chore', value: 1 },
    { taskName: '\u647a\u8863\u670d',       taskType: 'chore', value: 1 },
    { taskName: '\u6383\u6a13\u68af',       taskType: 'chore', value: 1 },
    { taskName: '\u6536\u73a9\u5177',       taskType: 'chore', value: 1 }
  ];
}

// ── GET handler ────────────────────────────────────────────────────────────

function doGet(e) {
  try {
    var p = e.parameter;
    var result;
    if (p.action === 'getTasks')       result = getTasks(p.child, p.date);
    else if (p.action === 'getBalance') result = getBalance(p.child);
    else if (p.action === 'getStreak')  result = getStreak(p.child);
    else result = { error: 'Unknown action: ' + p.action };
    return jsonOut(result);
  } catch (err) {
    return jsonOut({ error: err.message });
  }
}

// ── POST handler ───────────────────────────────────────────────────────────

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    var result;
    if      (d.action === 'completeTask')   result = completeTask(d.child, d.date, d.taskName, d.taskType, d.value, d.extra);
    else if (d.action === 'uncompleteTask') result = uncompleteTask(d.child, d.date, d.taskName);
    else if (d.action === 'addCustomTask')  result = addCustomTask(d.child, d.date, d.taskName);
    else if (d.action === 'addManualStar')  result = addManualStar(d.child, d.amount, d.reason);
    else if (d.action === 'redeemReward')   result = redeemReward(d.child, d.rewardName, d.cost);
    else if (d.action === 'removeTask')     result = removeTask(d.child, d.date, d.taskName);
    else if (d.action === 'parseContactBook') result = parseContactBook(d.imageBase64);
    else result = { error: 'Unknown action: ' + d.action };
    return jsonOut(result);
  } catch (err) {
    return jsonOut({ error: err.message });
  }
}

// ── Task functions ─────────────────────────────────────────────────────────

function getTasks(child, date) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Daily_Tasks');
  var data = sheet.getDataRange().getValues();

  var existing = [];
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === date && data[i][1] === child) {
      existing.push({
        taskName: data[i][2],
        taskType: data[i][3],
        value:    Number(data[i][4]),
        status:   data[i][5],
        extra:    data[i][6] || ''
      });
    }
  }

  if (existing.length === 0) {
    var defs = defaultTasks(child);
    for (var j = 0; j < defs.length; j++) {
      sheet.appendRow([date, child, defs[j].taskName, defs[j].taskType, defs[j].value, 'Pending', '']);
      existing.push({ taskName: defs[j].taskName, taskType: defs[j].taskType, value: defs[j].value, status: 'Pending', extra: '' });
    }
  }
  return { tasks: existing };
}

function completeTask(child, date, taskName, taskType, value, extra) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Daily_Tasks');
  var data = sheet.getDataRange().getValues();
  var found = false;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === date && data[i][1] === child && data[i][2] === taskName) {
      if (data[i][5] === 'Completed') return { success: true, alreadyDone: true, stars: 0 };
      sheet.getRange(i + 1, 6).setValue('Completed');
      if (extra) sheet.getRange(i + 1, 7).setValue(extra);
      found = true;
      break;
    }
  }

  if (!found) {
    // Custom task row doesn't exist yet, just complete it
    sheet.appendRow([date, child, taskName, taskType || 'custom', value || 2, 'Completed', extra || '']);
  }

  var ledger = ss.getSheetByName('Star_Ledger');
  ledger.appendRow([new Date().toISOString(), child, value, taskName, 'Task']);

  var bonus = checkStreakBonus(child, date);
  return { success: true, stars: value, streakBonus: bonus };
}

function uncompleteTask(child, date, taskName) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Daily_Tasks');
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === date && data[i][1] === child && data[i][2] === taskName) {
      if (data[i][5] === 'Pending') return { success: true };
      sheet.getRange(i + 1, 6).setValue('Pending');

      var ledger = ss.getSheetByName('Star_Ledger');
      var ldata = ledger.getDataRange().getValues();
      for (var j = ldata.length - 1; j >= 1; j--) {
        if (ldata[j][1] === child && ldata[j][3] === taskName && ldata[j][4] === 'Task') {
          ledger.deleteRow(j + 1);
          break;
        }
      }
      return { success: true };
    }
  }
  return { success: false, error: 'Task not found' };
}

function addCustomTask(child, date, taskName) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Daily_Tasks');
  sheet.appendRow([date, child, taskName, 'custom', 1, 'Pending', '']);
  return { success: true, task: { taskName: taskName, taskType: 'custom', value: 1, status: 'Pending', extra: '' } };
}

function removeTask(child, date, taskName) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Daily_Tasks');
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][0]) === date && data[i][1] === child && data[i][2] === taskName && data[i][5] !== 'Completed') {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, error: 'Task not found or already completed' };
}

// ── Star ledger functions ──────────────────────────────────────────────────

function getBalance(child) {
  var ss = getSpreadsheet();
  var data = ss.getSheetByName('Star_Ledger').getDataRange().getValues();
  var total = 0;
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === child) total += Number(data[i][2]) || 0;
  }
  return { balance: Math.max(0, total) };
}

function addManualStar(child, amount, reason) {
  var ss = getSpreadsheet();
  ss.getSheetByName('Star_Ledger').appendRow([new Date().toISOString(), child, amount, reason, 'Manual']);
  return { success: true };
}

function redeemReward(child, rewardName, cost) {
  var bal = getBalance(child).balance;
  if (bal < cost) return { success: false, error: '\u661f\u661f\u4e0d\u8db3' };
  var ss = getSpreadsheet();
  ss.getSheetByName('Star_Ledger').appendRow([new Date().toISOString(), child, -cost, rewardName, 'Redeem']);
  return { success: true, newBalance: bal - cost };
}

// ── Streak functions ───────────────────────────────────────────────────────

function isDayComplete(child, dateStr) {
  var ss = getSpreadsheet();
  var data = ss.getSheetByName('Daily_Tasks').getDataRange().getValues();
  var defs = defaultTasks(child);
  var required = {};
  for (var k = 0; k < defs.length; k++) required[defs[k].taskName] = false;

  var hasAny = false;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === dateStr && data[i][1] === child && data[i][3] !== 'custom') {
      if (required.hasOwnProperty(data[i][2])) {
        hasAny = true;
        if (data[i][5] === 'Completed') required[data[i][2]] = true;
      }
    }
  }
  if (!hasAny) return false;
  for (var name in required) {
    if (!required[name]) return false;
  }
  return true;
}

function getStreak(child) {
  var today = new Date();
  var streak = 0;
  for (var i = 0; i < 30; i++) {
    var d = new Date(today);
    d.setDate(d.getDate() - i);
    var ds = fmtDate(d);
    if (isDayComplete(child, ds)) streak++;
    else break;
  }
  return { streak: streak };
}

function checkStreakBonus(child, completedDate) {
  var date = new Date(completedDate + 'T00:00:00');
  for (var i = 0; i < 5; i++) {
    var d = new Date(date);
    d.setDate(d.getDate() - i);
    if (!isDayComplete(child, fmtDate(d))) return 0;
  }
  // All 5 days complete — check if bonus already given for this milestone
  var ss = getSpreadsheet();
  var data = ss.getSheetByName('Star_Ledger').getDataRange().getValues();
  for (var j = 1; j < data.length; j++) {
    if (data[j][1] === child && data[j][4] === 'Streak' && data[j][3] === completedDate) return 0;
  }
  ss.getSheetByName('Star_Ledger').appendRow([new Date().toISOString(), child, 10, completedDate, 'Streak']);
  return 10;
}

function fmtDate(d) {
  var mm = d.getMonth() + 1;
  var dd = d.getDate();
  return d.getFullYear() + '-' + (mm < 10 ? '0' + mm : mm) + '-' + (dd < 10 ? '0' + dd : dd);
}

// ── Gemini contact-book OCR ────────────────────────────────────────────────

function parseContactBook(imageBase64) {
  var apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) return { error: 'GEMINI_API_KEY not set in Script Properties' };

  var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey;
  var payload = {
    contents: [{
      parts: [
        { text: '\u9019\u662f\u4e00\u5f35\u806f\u7d61\u7c3f\u7167\u7247\u3002\u8acb\u8fa8\u8b58\u4eca\u5929\u7684\u4f5c\u696d\u5167\u5bb9\uff0c\u4ee5JSON\u683c\u5f0f\u56de\u8986\uff1a{"tasks":[{"subject":"\u79d1\u76ee","description":"\u4f5c\u696d\u63cf\u8ff0"}]}\u3002\u53ea\u56de\u50b3JSON\uff0c\u4e0d\u8981\u5176\u4ed6\u6587\u5b57\u3002' },
        { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }
      ]
    }]
  };
  var resp = UrlFetchApp.fetch(url, {
    method: 'post', contentType: 'application/json',
    payload: JSON.stringify(payload), muteHttpExceptions: true
  });
  var result = JSON.parse(resp.getContentText());
  if (result.error) return { error: result.error.message };
  var text = result.candidates[0].content.parts[0].text;
  try {
    var cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    return { raw: text };
  }
}

// ── One-time setup ─────────────────────────────────────────────────────────

function initializeSheets() {
  var ss = getSpreadsheet();

  var tasks = ss.getSheetByName('Daily_Tasks');
  if (!tasks) {
    tasks = ss.insertSheet('Daily_Tasks');
    tasks.appendRow(['Date', 'Child_Name', 'Task_Name', 'Task_Type', 'Value', 'Status', 'Extra']);
    tasks.setFrozenRows(1);
  }

  var ledger = ss.getSheetByName('Star_Ledger');
  if (!ledger) {
    ledger = ss.insertSheet('Star_Ledger');
    ledger.appendRow(['Timestamp', 'Child_Name', 'Amount', 'Reason', 'Category']);
    ledger.setFrozenRows(1);
  }

  return { success: true, message: 'Sheets ready' };
}
