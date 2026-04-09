/**
 * GamiHomework — Google Apps Script 後端 API（雙孩子版）
 *
 * ===================== Google Sheets 結構 =====================
 *
 * 試算表1: Config
 *   A: key | B: value
 *   jasper_pin      | 1111
 *   terry_pin       | 2222
 *   parent_pin      | 5678
 *   star_per_task   | 1
 *   bonus_star      | 2
 *   streak_reward   | 5
 *   drive_folder_id | <Google Drive 資料夾 ID>
 *   gemini_api_key  | <Gemini API Key>
 *
 * 試算表2: DailyLog
 *   A: child_id | B: date | C: subjects_json | D: chores_json |
 *   E: exercise_count | F: bag_packed | G: stars_earned |
 *   H: all_done | I: streak_day
 *
 * 試算表3: TaskItems
 *   A: child_id | B: date | C: type | D: label | E: status |
 *   F: file_url | G: ai_result_json | H: stars_awarded
 *
 * 試算表4: StarLedger
 *   A: child_id | B: date | C: action | D: amount | E: reason | F: balance_after
 *
 * 試算表5: Rewards（共用）
 *   A: id | B: label | C: cost | D: icon | E: active
 *
 * =============================================================
 */

const SHEET_CONFIG   = 'Config'
const SHEET_DAILY    = 'DailyLog'
const SHEET_TASKS    = 'TaskItems'
const SHEET_LEDGER   = 'StarLedger'
const SHEET_REWARDS  = 'Rewards'

// ── 主要進入點 ────────────────────────────────────────────────

function doGet(e) {
  const p = e.parameter
  let result
  try {
    switch (p.action) {
      case 'getTodayTasks':  result = getTodayTasks(p.child_id);          break
      case 'getConfig':      result = getPublicConfig();                   break
      case 'getStarBalance': result = getStarBalance(p.child_id);         break
      case 'getStreak':      result = getStreak(p.child_id);              break
      case 'getRewards':     result = getRewards();                        break
      case 'getDailyLog':    result = getDailyLog(p.child_id, p.date);    break
      default: result = { error: '未知的 action: ' + p.action }
    }
  } catch (err) {
    result = { error: err.message }
  }
  return jsonResponse(result)
}

function doPost(e) {
  let body
  try { body = JSON.parse(e.postData.contents) }
  catch (_) { return jsonResponse({ error: '無效的 JSON body' }) }

  let result
  try {
    switch (body.action) {
      case 'checkPin':      result = checkPin(body.pin, body.role);                       break
      case 'uploadFile':    result = uploadFileToDrive(body);                             break
      case 'completeTask':  result = completeTask(body);                                  break
      case 'approveTask':   result = approveTask(body.taskRowId, body.stars, body.child_id); break
      case 'addStars':      result = addStars(body.child_id, body.amount, body.reason);   break
      case 'spendStars':    result = spendStars(body.child_id, body.amount, body.reason); break
      case 'saveSubjects':  result = saveSubjects(body.child_id, body.date, body.subjects); break
      case 'addChoreTask':  result = addChoreTask(body.child_id, body.date, body.label);  break
      case 'updateConfig':  result = updateConfig(body.key, body.value);                  break
      case 'updateReward':  result = updateReward(body);                                  break
      case 'checkHomework': result = checkHomeworkWithAI(body);                           break
      default: result = { error: '未知的 action: ' + body.action }
    }
  } catch (err) {
    result = { error: err.message }
  }
  return jsonResponse(result)
}

// ── PIN 驗證 ──────────────────────────────────────────────────

function checkPin(pin, role) {
  const config = getConfigMap()
  // role: 'jasper' | 'terry' | 'parent'
  const key = role === 'parent' ? 'parent_pin'
            : role === 'jasper' ? 'jasper_pin'
            :                     'terry_pin'
  if (String(config[key]) === String(pin)) return { ok: true, role }
  return { ok: false, error: '密碼錯誤！再試一次～' }
}

// ── 每日任務 ──────────────────────────────────────────────────

function getTodayTasks(childId) {
  if (!childId) return { error: 'child_id 必填' }
  const today = todayStr()
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TASKS)
  const data  = sheet.getDataRange().getValues()
  const tasks = []
  for (let i = 1; i < data.length; i++) {
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
        stars:    data[i][7],
      })
    }
  }
  return { date: today, tasks }
}

function saveSubjects(childId, date, subjects) {
  if (!childId) return { error: 'child_id 必填' }
  const d = date || todayStr()
  deleteTasksByChildDateType(childId, d, 'homework')
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TASKS)
  subjects.forEach(label => sheet.appendRow([childId, d, 'homework', label, 'pending', '', '', 0]))
  ensureDailyFixedTasks(childId, d)
  return { ok: true, subjects }
}

function ensureDailyFixedTasks(childId, date) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TASKS)
  const data  = sheet.getDataRange().getValues()
  const existingTypes = data.filter(r => r[0] === childId && r[1] === date).map(r => r[2])
  if (!existingTypes.includes('bag'))
    sheet.appendRow([childId, date, 'bag', '整理書包', 'pending', '', '', 0])
}

function completeTask(body) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TASKS)
  const row   = body.rowId
  sheet.getRange(row, 5).setValue('done')
  if (body.fileUrl) sheet.getRange(row, 6).setValue(body.fileUrl)
  const stars = Number(getConfigMap()['star_per_task'] || 1)
  sheet.getRange(row, 8).setValue(stars)
  addStars(body.child_id, stars, `完成任務 (第${row}列)`)
  checkAndUpdateStreak(body.child_id)
  return { ok: true, starsAwarded: stars }
}

function approveTask(rowId, extraStars, childId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TASKS)
  sheet.getRange(rowId, 5).setValue('approved')
  if (extraStars > 0) addStars(childId, extraStars, `家長核准加星 (第${rowId}列)`)
  return { ok: true }
}

function addChoreTask(childId, date, label) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TASKS)
  sheet.appendRow([childId, date || todayStr(), 'chore', label, 'pending', '', '', 0])
  return { ok: true }
}

// ── 星星帳本 ──────────────────────────────────────────────────

function getStarBalance(childId) {
  if (!childId) return { balance: 0 }
  const data = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(SHEET_LEDGER).getDataRange().getValues()
  // 找此孩子最後一筆的 balance_after
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === childId) return { balance: data[i][5] || 0 }
  }
  return { balance: 0 }
}

function addStars(childId, amount, reason) {
  const current    = getStarBalance(childId).balance
  const newBalance = current + Number(amount)
  SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(SHEET_LEDGER)
    .appendRow([childId, todayStr(), 'earn', amount, reason, newBalance])
  return { ok: true, balance: newBalance }
}

function spendStars(childId, amount, reason) {
  const current = getStarBalance(childId).balance
  if (current < amount) return { ok: false, error: '星星不夠用！' }
  const newBalance = current - Number(amount)
  SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(SHEET_LEDGER)
    .appendRow([childId, todayStr(), 'spend', amount, reason, newBalance])
  return { ok: true, balance: newBalance }
}

// ── 連續天數 ──────────────────────────────────────────────────

function getStreak(childId) {
  const data = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(SHEET_DAILY).getDataRange().getValues()
  let streak = 0
  // 從最新往回找此孩子連續完成的天數
  const rows = data.filter(r => r[0] === childId).slice(1)
  for (let i = rows.length - 1; i >= 0; i--) {
    if (rows[i][7] === true || rows[i][7] === 'TRUE') streak++
    else break
  }
  const target = Number(getConfigMap()['streak_reward'] || 5)
  return { streak, target, superStar: streak >= target }
}

function checkAndUpdateStreak(childId) {
  const today   = todayStr()
  const tasks   = getTodayTasks(childId).tasks
  const allDone = tasks.length > 0 && tasks.every(t => t.status !== 'pending')
  const sheet   = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_DAILY)
  const data    = sheet.getDataRange().getValues()
  let todayRow  = -1
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === childId && data[i][1] === today) { todayRow = i + 1; break }
  }
  const streakData = getStreak(childId)
  const newStreak  = allDone ? streakData.streak + 1 : 0
  if (todayRow > 0) {
    sheet.getRange(todayRow, 8).setValue(allDone)
    sheet.getRange(todayRow, 9).setValue(newStreak)
  } else {
    sheet.appendRow([childId, today, '', '', 0, false, 0, allDone, newStreak])
  }
}

// ── 獎勵（共用）──────────────────────────────────────────────

function getRewards() {
  const data = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(SHEET_REWARDS).getDataRange().getValues()
  const rewards = []
  for (let i = 1; i < data.length; i++) {
    if (data[i][4] === true || data[i][4] === 'TRUE')
      rewards.push({ id: data[i][0], label: data[i][1], cost: data[i][2], icon: data[i][3] })
  }
  return { rewards }
}

function updateReward(body) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_REWARDS)
  const data  = sheet.getDataRange().getValues()
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(body.id)) {
      const row = i + 1
      if (body.label  !== undefined) sheet.getRange(row, 2).setValue(body.label)
      if (body.cost   !== undefined) sheet.getRange(row, 3).setValue(body.cost)
      if (body.active !== undefined) sheet.getRange(row, 5).setValue(body.active)
      return { ok: true }
    }
  }
  return { error: '找不到獎勵 id: ' + body.id }
}

// ── Gemini AI 批改 ────────────────────────────────────────────

function checkHomeworkWithAI(body) {
  const config = getConfigMap()
  const apiKey = config['gemini_api_key']
  if (!apiKey) return { error: '尚未設定 Gemini API Key' }

  const fileId   = extractFileId(body.fileUrl)
  const file     = DriveApp.getFileById(fileId)
  const blob     = file.getBlob()
  const base64   = Utilities.base64Encode(blob.getBytes())
  const mimeType = blob.getContentType()

  const systemPrompt = body.prompt || `
你是一位友善的小學老師，正在批改一年級的${body.subject || ''}作業。
請用繁體中文回應，語氣輕鬆可愛。
1. 如果有錯誤，請「描述錯誤在哪裡」（如：第三行第二題），不要直接給答案。
2. 如果全部正確，回覆「太棒了！全部正確！⭐」。
3. 用 JSON 格式回覆：{ "allCorrect": bool, "errors": [ { "location": "...", "hint": "..." } ], "encouragement": "..." }
`

  const url     = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
  const payload = {
    contents: [{ parts: [{ text: systemPrompt }, { inline_data: { mime_type: mimeType, data: base64 } }] }],
    generationConfig: { responseMimeType: 'application/json' }
  }
  const response = UrlFetchApp.fetch(url, {
    method: 'post', contentType: 'application/json',
    payload: JSON.stringify(payload), muteHttpExceptions: true
  })
  const json = JSON.parse(response.getContentText())
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
  return { ok: true, result: safeJson(text) }
}

// ── Google Drive 上傳 ─────────────────────────────────────────

function uploadFileToDrive(body) {
  const config = getConfigMap()
  const parentFolderId = config['drive_folder_id']
  if (!parentFolderId) return { error: '尚未設定 drive_folder_id' }
  const parentFolder = DriveApp.getFolderById(parentFolderId)
  let folder = parentFolder
  if (body.subfolder) {
    const iter = parentFolder.getFoldersByName(body.subfolder)
    folder = iter.hasNext() ? iter.next() : parentFolder.createFolder(body.subfolder)
  }
  const bytes = Utilities.base64Decode(body.base64)
  const blob  = Utilities.newBlob(bytes, body.mimeType, body.filename)
  const file  = folder.createFile(blob)
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW)
  return { ok: true, fileId: file.getId(), fileUrl: file.getUrl() }
}

// ── Config ────────────────────────────────────────────────────

function getConfigMap() {
  const data = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(SHEET_CONFIG).getDataRange().getValues()
  const map = {}
  for (let i = 1; i < data.length; i++) map[data[i][0]] = data[i][1]
  return map
}

function getPublicConfig() {
  const c = getConfigMap()
  return {
    starPerTask:  c['star_per_task']  || 1,
    bonusStar:    c['bonus_star']     || 2,
    streakTarget: c['streak_reward']  || 5,
  }
}

function updateConfig(key, value) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CONFIG)
  const data  = sheet.getDataRange().getValues()
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) { sheet.getRange(i + 1, 2).setValue(value); return { ok: true } }
  }
  sheet.appendRow([key, value])
  return { ok: true }
}

// ── 工具函式 ──────────────────────────────────────────────────

function getDailyLog(childId, date) {
  const d    = date || todayStr()
  const data = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(SHEET_DAILY).getDataRange().getValues()
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === childId && data[i][1] === d) return { date: d, log: data[i] }
  }
  return { date: d, log: null }
}

function deleteTasksByChildDateType(childId, date, type) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TASKS)
  const data  = sheet.getDataRange().getValues()
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === childId && data[i][1] === date && data[i][2] === type)
      sheet.deleteRow(i + 1)
  }
}

function extractFileId(url) {
  const match = url.match(/\/d\/([^/]+)/)
  return match ? match[1] : url
}

function todayStr() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd')
}

function safeJson(str) {
  try { return typeof str === 'string' ? JSON.parse(str) : str }
  catch (_) { return {} }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
}

// ── 初始化（從試算表內 Apps Script 執行一次）─────────────────

function initializeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()

  const setup = [
    { name: SHEET_CONFIG, headers: ['key', 'value'],
      defaults: [
        ['jasper_pin', '1111'], ['terry_pin', '2222'], ['parent_pin', '5678'],
        ['star_per_task', 1], ['bonus_star', 2], ['streak_reward', 5],
        ['drive_folder_id', ''], ['gemini_api_key', '']
      ]
    },
    { name: SHEET_DAILY,
      headers: ['child_id','date','subjects_json','chores_json','exercise_count','bag_packed','stars_earned','all_done','streak_day'] },
    { name: SHEET_TASKS,
      headers: ['child_id','date','type','label','status','file_url','ai_result_json','stars_awarded'] },
    { name: SHEET_LEDGER,
      headers: ['child_id','date','action','amount','reason','balance_after'] },
    { name: SHEET_REWARDS, headers: ['id','label','cost','icon','active'],
      defaults: [
        [1,'桌遊時間',5,'🎲',true], [2,'電動20分',8,'🎮',true],
        [3,'買一本書',6,'📚',true], [4,'糖果一顆',3,'🍬',true],
        [5,'看電視20分',5,'📺',true]
      ]
    },
  ]

  setup.forEach(({ name, headers, defaults }) => {
    let sheet = ss.getSheetByName(name)
    if (!sheet) sheet = ss.insertSheet(name)
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers)
      if (defaults) defaults.forEach(r => sheet.appendRow(r))
    }
  })

  SpreadsheetApp.getUi().alert(
    '✅ 初始化完成！\n\n' +
    '預設密碼：\n' +
    '• Jasper：1111\n' +
    '• Terry：2222\n' +
    '• 爸媽：5678\n\n' +
    '請在 Config 工作表填入 drive_folder_id 與 gemini_api_key。'
  )
}
