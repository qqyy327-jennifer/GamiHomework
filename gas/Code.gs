/**
 * GamiHomework - Google Apps Script backend (dual-child)
 *
 * Config sheet:
 *   jasper_pin / terry_pin / parent_pin / star_per_task / bonus_star /
 *   streak_reward / drive_folder_id / gemini_api_key
 *
 * DailyLog:  child_id | date | subjects_json | chores_json |
 *            exercise_count | bag_packed | stars_earned | all_done | streak_day
 *
 * TaskItems: child_id | date | type | label | status |
 *            file_url | ai_result_json | stars_awarded
 *
 * StarLedger: child_id | date | action | amount | reason | balance_after
 *
 * Rewards:    id | label | cost | icon | active
 */

var SHEET_CONFIG  = 'Config';
var SHEET_DAILY   = 'DailyLog';
var SHEET_TASKS   = 'TaskItems';
var SHEET_LEDGER  = 'StarLedger';
var SHEET_REWARDS = 'Rewards';

// --- doGet -------------------------------------------------------

function doGet(e) {
  var p = e.parameter;
  var result;
  try {
    switch (p.action) {
      case 'getTodayTasks':  result = getTodayTasks(p.child_id);       break;
      case 'getConfig':      result = getPublicConfig();                break;
      case 'getStarBalance': result = getStarBalance(p.child_id);      break;
      case 'getStreak':      result = getStreak(p.child_id);           break;
      case 'getRewards':     result = getRewards();                     break;
      case 'getDailyLog':    result = getDailyLog(p.child_id, p.date); break;
      default: result = { error: 'unknown action: ' + p.action };
    }
  } catch (err) {
    result = { error: err.message };
  }
  return jsonResponse(result);
}

// --- doPost ------------------------------------------------------

function doPost(e) {
  var body;
  try { body = JSON.parse(e.postData.contents); }
  catch (_) { return jsonResponse({ error: 'invalid JSON body' }); }

  var result;
  try {
    switch (body.action) {
      case 'checkPin':      result = checkPin(body.pin, body.role);                              break;
      case 'uploadFile':    result = uploadFileToDrive(body);                                    break;
      case 'completeTask':  result = completeTask(body);                                         break;
      case 'approveTask':   result = approveTask(body.taskRowId, body.stars, body.child_id);     break;
      case 'addStars':      result = addStars(body.child_id, body.amount, body.reason);          break;
      case 'addStarBonus':  result = addStarBonus(body.child_id, body.amount, body.reason, body.bonusDate); break;
      case 'spendStars':    result = spendStars(body.child_id, body.amount, body.reason);        break;
      case 'saveSubjects':  result = saveSubjects(body.child_id, body.date, body.subjects);      break;
      case 'addChoreTask':  result = addChoreTask(body.child_id, body.date, body.label);         break;
      case 'updateConfig':  result = updateConfig(body.key, body.value);                         break;
      case 'updateReward':  result = updateReward(body);                                         break;
      case 'checkHomework': result = checkHomeworkWithAI(body);                                  break;
      default: result = { error: 'unknown action: ' + body.action };
    }
  } catch (err) {
    result = { error: err.message };
  }
  return jsonResponse(result);
}

// --- PIN ---------------------------------------------------------

function checkPin(pin, role) {
  var config = getConfigMap();
  var key = role === 'parent' ? 'parent_pin'
          : role === 'jasper' ? 'jasper_pin'
          :                     'terry_pin';
  if (String(config[key]) === String(pin)) return { ok: true, role: role };
  return { ok: false, error: 'wrong pin' };
}

// --- tasks -------------------------------------------------------

function getTodayTasks(childId) {
  if (!childId) return { error: 'child_id required' };
  var today = todayStr();
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TASKS);
  var data  = sheet.getDataRange().getValues();
  var tasks = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === childId && data[i][1] === today) {
      tasks.push({
        rowId:    i + 1,
        childId:  data[i][0],
        date:     data[i][1],
        type:     data[i][2],
        label:    data[i][3],
        status:   data[i][4],
        fileUrl:  data[i][5],
        aiResult: safeJson(data[i][6]),
        stars:    data[i][7]
      });
    }
  }
  return { date: today, tasks: tasks };
}

function saveSubjects(childId, date, subjects) {
  if (!childId) return { error: 'child_id required' };
  var d = date || todayStr();
  deleteTasksByChildDateType(childId, d, 'homework');
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TASKS);
  subjects.forEach(function(label) {
    sheet.appendRow([childId, d, 'homework', label, 'pending', '', '', 0]);
  });
  ensureDailyFixedTasks(childId, d);
  return { ok: true, subjects: subjects };
}

function ensureDailyFixedTasks(childId, date) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TASKS);
  var data  = sheet.getDataRange().getValues();
  var existingTypes = data.filter(function(r) { return r[0] === childId && r[1] === date; }).map(function(r) { return r[2]; });
  if (existingTypes.indexOf('bag') === -1) {
    sheet.appendRow([childId, date, 'bag', '整理書包', 'pending', '', '', 0]);
  }
}

function completeTask(body) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TASKS);
  var row   = body.rowId;
  sheet.getRange(row, 5).setValue('done');
  if (body.fileUrl) sheet.getRange(row, 6).setValue(body.fileUrl);
  var stars  = Number(getConfigMap()['star_per_task'] || 1);
  sheet.getRange(row, 8).setValue(stars);
  var ledger = addStars(body.child_id, stars, 'task row ' + row);
  checkAndUpdateStreak(body.child_id);
  return { ok: true, starsAwarded: stars, balance: ledger.balance };
}

function approveTask(rowId, extraStars, childId) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TASKS);
  sheet.getRange(rowId, 5).setValue('approved');
  if (extraStars > 0) addStars(childId, extraStars, 'parent bonus row ' + rowId);
  return { ok: true };
}

function addChoreTask(childId, date, label) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TASKS);
  sheet.appendRow([childId, date || todayStr(), 'chore', label, 'pending', '', '', 0]);
  return { ok: true };
}

// --- stars -------------------------------------------------------

function getStarBalance(childId) {
  if (!childId) return { balance: 0 };
  var data = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(SHEET_LEDGER).getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === childId) return { balance: data[i][5] || 0 };
  }
  return { balance: 0 };
}

function addStars(childId, amount, reason) {
  var current    = getStarBalance(childId).balance;
  var newBalance = current + Number(amount);
  SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(SHEET_LEDGER)
    .appendRow([childId, todayStr(), 'earn', amount, reason, newBalance]);
  return { ok: true, balance: newBalance };
}

// Parent manual star bonus (custom date allowed)
function addStarBonus(childId, amount, reason, bonusDate) {
  if (!childId) return { error: 'child_id required' };
  if (!amount || Number(amount) <= 0) return { error: 'amount must be > 0' };
  var d          = bonusDate || todayStr();
  var current    = getStarBalance(childId).balance;
  var newBalance = current + Number(amount);
  SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(SHEET_LEDGER)
    .appendRow([childId, d, 'bonus', Number(amount), reason || 'parent bonus', newBalance]);
  return { ok: true, balance: newBalance, starsAdded: Number(amount) };
}

function spendStars(childId, amount, reason) {
  var current = getStarBalance(childId).balance;
  if (current < amount) return { ok: false, error: 'not enough stars' };
  var newBalance = current - Number(amount);
  SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(SHEET_LEDGER)
    .appendRow([childId, todayStr(), 'spend', amount, reason, newBalance]);
  return { ok: true, balance: newBalance };
}

// --- streak ------------------------------------------------------

function getStreak(childId) {
  var data = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(SHEET_DAILY).getDataRange().getValues();
  var streak = 0;
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === childId) rows.push(data[i]);
  }
  for (var j = rows.length - 1; j >= 0; j--) {
    if (rows[j][7] === true || rows[j][7] === 'TRUE') streak++;
    else break;
  }
  var target = Number(getConfigMap()['streak_reward'] || 5);
  return { streak: streak, target: target, superStar: streak >= target };
}

function checkAndUpdateStreak(childId) {
  var today   = todayStr();
  var tasks   = getTodayTasks(childId).tasks;
  var allDone = tasks.length > 0 && tasks.every(function(t) { return t.status !== 'pending'; });
  var sheet   = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_DAILY);
  var data    = sheet.getDataRange().getValues();
  var todayRow = -1;
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === childId && data[i][1] === today) { todayRow = i + 1; break; }
  }
  var streakData = getStreak(childId);
  var newStreak  = allDone ? streakData.streak + 1 : 0;
  if (todayRow > 0) {
    sheet.getRange(todayRow, 8).setValue(allDone);
    sheet.getRange(todayRow, 9).setValue(newStreak);
  } else {
    sheet.appendRow([childId, today, '', '', 0, false, 0, allDone, newStreak]);
  }
}

// --- rewards -----------------------------------------------------

function getRewards() {
  var data = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(SHEET_REWARDS).getDataRange().getValues();
  var rewards = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][4] === true || data[i][4] === 'TRUE') {
      rewards.push({ id: data[i][0], label: data[i][1], cost: data[i][2], icon: data[i][3] });
    }
  }
  return { rewards: rewards };
}

function updateReward(body) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_REWARDS);
  var data  = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(body.id)) {
      var row = i + 1;
      if (body.label  !== undefined) sheet.getRange(row, 2).setValue(body.label);
      if (body.cost   !== undefined) sheet.getRange(row, 3).setValue(body.cost);
      if (body.active !== undefined) sheet.getRange(row, 5).setValue(body.active);
      return { ok: true };
    }
  }
  return { error: 'reward id not found: ' + body.id };
}

// --- Gemini AI homework check ------------------------------------

function checkHomeworkWithAI(body) {
  var config = getConfigMap();
  var apiKey = config['gemini_api_key'];
  if (!apiKey) return { error: 'gemini_api_key not set' };

  var fileId   = extractFileId(body.fileUrl);
  var file     = DriveApp.getFileById(fileId);
  var blob     = file.getBlob();
  var base64   = Utilities.base64Encode(blob.getBytes());
  var mimeType = blob.getContentType();

  var systemPrompt = body.prompt ||
    '\u4f60\u662f\u4e00\u4f4d\u53cb\u5584\u7684\u5c0f\u5b78\u8001\u5e2b\uff0c\u6b63\u5728\u6279\u6539\u4e00\u5e74\u7d1a\u7684' +
    (body.subject || '') +
    '\u4f5c\u696d\u3002\u8acb\u7528\u7e41\u9ad4\u4e2d\u6587\u56de\u61c9\uff0c\u8a9e\u6c23\u8f15\u9b06\u53ef\u611b\u3002' +
    '1. \u5982\u679c\u6709\u932f\u8aa4\uff0c\u8acb\u300c\u63cf\u8ff0\u932f\u8aa4\u5728\u54ea\u88e1\u300d\uff08\u5982\uff1a\u7b2c\u4e09\u884c\u7b2c\u4e8c\u984c\uff09\uff0c\u4e0d\u8981\u76f4\u63a5\u7d66\u7b54\u6848\u3002' +
    '2. \u5982\u679c\u5168\u90e8\u6b63\u78ba\uff0c\u56de\u8986\u300c\u592a\u68d2\u4e86\uff01\u5168\u90e8\u6b63\u78ba\uff01\u2b50\u300d\u3002' +
    '3. \u7528 JSON \u683c\u5f0f\u56de\u8986\uff1a{ "allCorrect": bool, "errors": [ { "location": "...", "hint": "..." } ], "encouragement": "..." }';

  var url     = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey;
  var payload = {
    contents: [{ parts: [{ text: systemPrompt }, { inline_data: { mime_type: mimeType, data: base64 } }] }],
    generationConfig: { responseMimeType: 'application/json' }
  };
  var response = UrlFetchApp.fetch(url, {
    method: 'post', contentType: 'application/json',
    payload: JSON.stringify(payload), muteHttpExceptions: true
  });
  var json = JSON.parse(response.getContentText());
  var text = json.candidates && json.candidates[0] && json.candidates[0].content &&
             json.candidates[0].content.parts && json.candidates[0].content.parts[0]
             ? json.candidates[0].content.parts[0].text : '{}';
  return { ok: true, result: safeJson(text) };
}

// --- Drive upload ------------------------------------------------

function uploadFileToDrive(body) {
  var config = getConfigMap();
  var parentFolderId = config['drive_folder_id'];
  if (!parentFolderId) return { error: 'drive_folder_id not set' };
  var parentFolder = DriveApp.getFolderById(parentFolderId);
  var folder = parentFolder;
  if (body.subfolder) {
    var iter = parentFolder.getFoldersByName(body.subfolder);
    folder = iter.hasNext() ? iter.next() : parentFolder.createFolder(body.subfolder);
  }
  var bytes = Utilities.base64Decode(body.base64);
  var blob  = Utilities.newBlob(bytes, body.mimeType, body.filename);
  var file  = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { ok: true, fileId: file.getId(), fileUrl: file.getUrl() };
}

// --- Config ------------------------------------------------------

function getConfigMap() {
  var data = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(SHEET_CONFIG).getDataRange().getValues();
  var map = {};
  for (var i = 1; i < data.length; i++) map[data[i][0]] = data[i][1];
  return map;
}

function getPublicConfig() {
  var c = getConfigMap();
  return {
    starPerTask:  c['star_per_task']  || 1,
    bonusStar:    c['bonus_star']     || 2,
    streakTarget: c['streak_reward']  || 5
  };
}

function updateConfig(key, value) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CONFIG);
  var data  = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === key) { sheet.getRange(i + 1, 2).setValue(value); return { ok: true }; }
  }
  sheet.appendRow([key, value]);
  return { ok: true };
}

// --- utils -------------------------------------------------------

function getDailyLog(childId, date) {
  var d    = date || todayStr();
  var data = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(SHEET_DAILY).getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === childId && data[i][1] === d) return { date: d, log: data[i] };
  }
  return { date: d, log: null };
}

function deleteTasksByChildDateType(childId, date, type) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TASKS);
  var data  = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === childId && data[i][1] === date && data[i][2] === type) {
      sheet.deleteRow(i + 1);
    }
  }
}

function extractFileId(url) {
  var match = url.match(/\/d\/([^/]+)/);
  return match ? match[1] : url;
}

function todayStr() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function safeJson(str) {
  try { return typeof str === 'string' ? JSON.parse(str) : str; }
  catch (_) { return {}; }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- init (run once from inside Spreadsheet) ---------------------

function initializeSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var setup = [
    { name: SHEET_CONFIG, headers: ['key', 'value'],
      defaults: [
        ['jasper_pin', '1111'], ['terry_pin', '2222'], ['parent_pin', '5678'],
        ['star_per_task', 1], ['bonus_star', 2], ['streak_reward', 5],
        ['drive_folder_id', ''], ['gemini_api_key', '']
      ]
    },
    { name: SHEET_DAILY,
      headers: ['child_id','date','subjects_json','chores_json','exercise_count','bag_packed','stars_earned','all_done','streak_day']
    },
    { name: SHEET_TASKS,
      headers: ['child_id','date','type','label','status','file_url','ai_result_json','stars_awarded']
    },
    { name: SHEET_LEDGER,
      headers: ['child_id','date','action','amount','reason','balance_after']
    },
    { name: SHEET_REWARDS, headers: ['id','label','cost','icon','active'],
      defaults: [
        [1, 'board game 30min', 5, '', true],
        [2, 'video game 20min', 8, '', true],
        [3, 'buy a book',       6, '', true],
        [4, 'candy',            3, '', true],
        [5, 'TV 20min',         5, '', true]
      ]
    }
  ];

  setup.forEach(function(item) {
    var sheet = ss.getSheetByName(item.name);
    if (!sheet) sheet = ss.insertSheet(item.name);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(item.headers);
      if (item.defaults) item.defaults.forEach(function(r) { sheet.appendRow(r); });
    }
  });

  SpreadsheetApp.getUi().alert('Init complete! Default PINs: Jasper=1111, Terry=2222, Parent=5678');
}
