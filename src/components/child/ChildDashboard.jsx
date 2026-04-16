import { useState, useRef, useEffect } from 'react'
import confetti from 'canvas-confetti'
import { Mic, MicOff, LogOut, Check, Plus } from 'lucide-react'
import { useApp } from '../../contexts/AppContext.jsx'

// ── Audio feedback ─────────────────────────────────────────────────────────

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const notes = [523, 659, 784]
    notes.forEach((freq, i) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = ctx.currentTime + i * 0.12
      gain.gain.setValueAtTime(0.25, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
      osc.start(t); osc.stop(t + 0.4)
    })
  } catch (_) {}
}

function celebrate() {
  confetti({ particleCount: 90, spread: 65, origin: { y: 0.65 }, zIndex: 9999 })
  playChime()
}

// ── Date helpers ───────────────────────────────────────────────────────────

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  const mm = d.getMonth() + 1, dd = d.getDate()
  return `${d.getFullYear()}-${mm<10?'0'+mm:mm}-${dd<10?'0'+dd:dd}`
}

function todayStr() {
  const d = new Date()
  const mm = d.getMonth() + 1, dd = d.getDate()
  return `${d.getFullYear()}-${mm<10?'0'+mm:mm}-${dd<10?'0'+dd:dd}`
}

function displayDate(dateStr) {
  if (dateStr === todayStr()) return '今天'
  if (dateStr === addDays(todayStr(), -1)) return '昨天'
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getMonth()+1}/${d.getDate()}`
}

// ── Streak bar ─────────────────────────────────────────────────────────────

function StreakBar({ count }) {
  const MAX = 5
  const done = Math.min(count, MAX)
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: MAX }).map((_, i) => (
        <div
          key={i}
          className={`h-3 flex-1 rounded-full transition-colors
            ${i < done ? 'bg-amber-400' : 'bg-gray-200'}`}
        />
      ))}
      {count >= MAX && <span className="text-lg ml-1">🏆</span>}
    </div>
  )
}

// ── Task emoji helpers ─────────────────────────────────────────────────────

const CHORE_EMOJI    = { '擦桌子':'🧹','摺衣服':'👕','掃樓梯':'🧺','收玩具':'🧸','整理書包':'🎒' }
const SUBJECT_EMOJI  = { '國語':'📖','英文':'🔤','數學':'📐','ㄅㄆㄇ':'🔡' }
const taskEmoji = t => CHORE_EMOJI[t.taskName] || SUBJECT_EMOJI[t.taskName] || '⭐'

// ── Quick-pick presets ─────────────────────────────────────────────────────

const PRESETS = {
  jasper: ['國語', '英文', '數學', '鋼琴', '跳繩', '足球', '游泳'],
  terry:  ['ㄅㄆㄇ', '數學', '英文', '鋼琴', '跳繩', '足球', '游泳'],
}

// ── Task row (list style) ──────────────────────────────────────────────────

function TaskRow({ task, onToggle }) {
  const done = task.status === 'Completed'
  return (
    <div
      className={`task-row ${done ? 'done' : ''}`}
      onClick={() => onToggle(task)}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0
        ${done ? 'bg-green-400' : 'bg-gray-100'}`}>
        {done
          ? <Check size={16} className="text-white" />
          : <span className="text-lg">{taskEmoji(task)}</span>}
      </div>
      <span className={`flex-1 font-bold ${done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
        {task.taskName}
      </span>
      <span className={`text-xs font-bold px-2 py-1 rounded-lg
        ${done ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-700'}`}>
        +1⭐
      </span>
    </div>
  )
}

// ── Task card (grid style, for Terry) ─────────────────────────────────────

const CARD_COLORS = [
  'bg-blue-200 text-blue-800',
  'bg-green-200 text-green-800',
  'bg-purple-200 text-purple-800',
  'bg-amber-200 text-amber-800',
  'bg-pink-200 text-pink-800',
  'bg-teal-200 text-teal-800',
]

function TaskCard({ task, index, onToggle }) {
  const done = task.status === 'Completed'
  const color = CARD_COLORS[index % CARD_COLORS.length]
  return (
    <div
      className={`terry-card p-4 ${color} ${done ? 'done' : ''}`}
      onClick={() => onToggle(task)}
    >
      <span className="text-4xl">{done ? '✅' : taskEmoji(task)}</span>
      <span className="font-bold text-base mt-1">{task.taskName}</span>
      <span className="text-xs font-bold opacity-70">+1⭐</span>
    </div>
  )
}

// ── Main dashboard ─────────────────────────────────────────────────────────

export default function ChildDashboard() {
  const {
    currentChild, setCurrentChild,
    selectedDate, setSelectedDate,
    tasks, balance, streak,
    completeTask, uncompleteTask, addCustomTask, removeTask,
    loadBalance, showToast, logout,
  } = useApp()

  const [inputText, setInputText]   = useState('')
  const [interim,   setInterim]     = useState('')   // 語音辨識即時預覽
  const [listening, setListening]   = useState(false)
  const recRef  = useRef(null)
  const inputRef = useRef(null)

  const childTasks = tasks[currentChild] || []
  const today      = todayStr()

  // 每次進入子頁面或切換孩子時，強制重拉 balance（確保家長補給的星星同步顯示）
  useEffect(() => {
    loadBalance(currentChild)
  }, [currentChild, loadBalance])

  // ── Voice input ────────────────────────────────────────────────────────

  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      showToast('此裝置不支援語音辨識，請手動輸入', 'error')
      return
    }

    // 先確認麥克風權限
    navigator.mediaDevices?.getUserMedia({ audio: true })
      .then(() => launchRecognition(SR))
      .catch(() => showToast('請允許使用麥克風後再試', 'error'))
  }

  function launchRecognition(SR) {
    const rec = new SR()
    rec.lang = 'zh-TW'
    rec.interimResults = true   // 邊說邊顯示
    rec.maxAlternatives = 1
    rec.continuous = false

    rec.onstart = () => { setListening(true); setInterim('') }
    rec.onend   = () => { setListening(false); setInterim('') }

    rec.onerror = e => {
      setListening(false); setInterim('')
      const msgs = {
        'not-allowed':       '請允許使用麥克風後再試',
        'no-speech':         '沒有偵測到聲音，請再說一次',
        'audio-capture':     '找不到麥克風裝置',
        'network':           '網路錯誤，無法使用語音辨識',
        'service-not-allowed':'此裝置不支援語音辨識',
      }
      showToast(msgs[e.error] || `語音辨識失敗（${e.error}）`, 'error')
    }

    rec.onresult = e => {
      let final = '', inter = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript
        else inter += e.results[i][0].transcript
      }
      if (inter) setInterim(inter)
      if (final.trim()) {
        setInterim('')
        // 說完直接自動新增任務，不需再按按鈕
        const text = final.trim()
        setInputText(text)
        // 用 timeout 讓 setInputText 先 flush，再 handleAdd
        setTimeout(() => handleAddByText(text), 50)
      }
    }

    recRef.current = rec
    try { rec.start() } catch (e) { showToast('語音啟動失敗，請重試', 'error') }
  }

  function stopVoice() { recRef.current?.stop?.() }

  // ── Add / remove task ─────────────────────────────────────────────────

  // 語音辨識完成後直接呼叫（傳入辨識到的文字）
  async function handleAddByText(text) {
    const trimmed = text.trim()
    if (!trimmed) return
    if (childTasks.some(t => t.taskName === trimmed)) {
      showToast(`「${trimmed}」已在清單中`, 'error')
      setInputText('')
      return
    }
    await addCustomTask(currentChild, selectedDate, trimmed)
    showToast(`🎙️ 已新增：${trimmed}`)
    setInputText('')
  }

  async function handleAdd(name) {
    const trimmed = (name || inputText).trim()
    if (!trimmed) return
    if (childTasks.some(t => t.taskName === trimmed)) {
      showToast(`「${trimmed}」已在清單中`, 'error')
      return
    }
    await addCustomTask(currentChild, selectedDate, trimmed)
    showToast(`已新增：${trimmed}`)
    setInputText('')
  }

  async function handleRemovePreset(name) {
    const task = childTasks.find(t => t.taskName === name)
    if (!task) return
    if (task.status === 'Completed') {
      showToast('已完成的任務不能取消', 'error')
      return
    }
    await removeTask(currentChild, selectedDate, name)
    showToast(`已移除：${name}`)
  }

  // ── Complete / uncomplete ──────────────────────────────────────────────

  async function handleToggle(task) {
    if (task.status === 'Completed') {
      await uncompleteTask(currentChild, selectedDate, task.taskName)
    } else {
      const res = await completeTask(currentChild, selectedDate, task.taskName)
      if (res) {
        celebrate()
        showToast(`+1⭐ ${task.taskName} 完成！`)
      }
    }
  }

  // ── Date navigation ────────────────────────────────────────────────────
  const dateOptions  = Array.from({ length: 5 }, (_, i) => addDays(today, -i))
  const completedCount = childTasks.filter(t => t.status === 'Completed').length
  const totalCount     = childTasks.length
  const progressPct    = totalCount ? Math.round(completedCount / totalCount * 100) : 0

  return (
    <div className="flex flex-col flex-1 pb-8">

      {/* ── Header ── */}
      <div className="bg-amber-400 px-4 pt-6 pb-4 rounded-b-3xl shadow-md">
        <div className="flex items-center justify-between mb-3">
          <button onClick={logout} className="text-amber-700 p-1"><LogOut size={18} /></button>
          <div className="flex rounded-2xl overflow-hidden bg-amber-300 shadow-inner">
            {[['jasper','👦 Jasper'],['terry','🧒 Terry']].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setCurrentChild(id)}
                className={`px-4 py-2 font-bold text-sm transition-colors
                  ${currentChild === id ? 'bg-white text-amber-600' : 'text-amber-700'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-white">{balance[currentChild]}⭐</div>
            <div className="text-xs text-amber-700">星星存摺</div>
          </div>
        </div>
        <div className="mb-1">
          <div className="flex justify-between text-xs text-amber-700 mb-1">
            <span>連續達成</span>
            <span>{streak[currentChild]}/5 天</span>
          </div>
          <StreakBar count={streak[currentChild]} />
        </div>
      </div>

      <div className="flex-1 px-4 pt-4 flex flex-col gap-4 overflow-y-auto">

        {/* ── Date picker ── */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {dateOptions.map(d => (
            <button
              key={d}
              onClick={() => setSelectedDate(d)}
              className={`flex-shrink-0 px-4 py-2 rounded-2xl font-bold text-sm transition-colors
                ${selectedDate === d ? 'bg-amber-400 text-white shadow' : 'bg-white text-gray-500'}`}
            >
              {displayDate(d)}
            </button>
          ))}
        </div>

        {/* ── 新增任務區 ── */}
        <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
          <div className="text-sm font-bold text-gray-500">📌 新增今日任務</div>

          {/* Quick-pick chips */}
          <div className="flex gap-2 flex-wrap">
            {PRESETS[currentChild].map(name => {
              const task   = childTasks.find(t => t.taskName === name)
              const added  = !!task
              const done   = task?.status === 'Completed'
              return (
                <button
                  key={name}
                  onClick={() => added ? handleRemovePreset(name) : handleAdd(name)}
                  className={`px-4 py-2 rounded-2xl font-bold text-sm transition-all active:scale-95
                    ${done
                      ? 'bg-green-400 text-white cursor-default'
                      : added
                        ? 'bg-amber-400 text-white shadow-inner'
                        : 'bg-amber-50 text-amber-700 border-2 border-amber-300'}`}
                  title={done ? '已完成' : added ? '點擊取消' : '點擊新增'}
                >
                  {done ? `✓ ${name}` : added ? `× ${name}` : name}
                </button>
              )
            })}
          </div>

          {/* 語音按鈕 */}
          <button
            onClick={listening ? stopVoice : startVoice}
            className={`btn-child gap-3 font-bold transition-all
              ${listening
                ? 'bg-red-400 text-white animate-pulse'
                : 'bg-pink-100 text-pink-600 border-2 border-pink-300'}`}
          >
            {listening
              ? <><MicOff size={20} /> 點擊停止</>
              : <><Mic size={20} /> 🎙️ 說出任務名稱（自動新增）</>}
          </button>

          {/* 即時語音預覽 */}
          {(listening || interim) && (
            <div className="bg-pink-50 border-2 border-pink-200 rounded-2xl px-4 py-2 text-sm text-pink-700 font-bold min-h-[2.5rem]">
              {interim ? `「${interim}」` : '🎧 聆聽中，請說任務名稱…'}
            </div>
          )}

          {/* 文字輸入 */}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="或直接打字輸入任務…"
              className="flex-1 border-2 border-amber-300 rounded-2xl px-4 py-2 text-sm font-bold
                focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={() => handleAdd()}
              disabled={!inputText.trim()}
              className="btn-child bg-amber-400 text-white disabled:opacity-40 gap-1 px-4"
            >
              <Plus size={18} /> 新增
            </button>
          </div>
        </div>

        {/* ── 今日任務清單 ── */}
        {totalCount > 0 && (
          <div className="flex flex-col gap-3">
            <div className="text-sm font-bold text-gray-500">✅ 今日任務清單</div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>完成進度</span>
                <span>{completedCount}/{totalCount}</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Tasks */}
            {currentChild === 'jasper' ? (
              <div className="flex flex-col gap-2">
                {childTasks.map(task => (
                  <TaskRow key={task.taskName} task={task} onToggle={handleToggle} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {childTasks.map((task, i) => (
                  <TaskCard key={task.taskName} task={task} index={i} onToggle={handleToggle} />
                ))}
              </div>
            )}

            {completedCount === totalCount && totalCount > 0 && (
              <div className="text-center py-4 text-2xl font-black text-amber-500 animate-bounce">
                🎉 全部完成！超棒的！
              </div>
            )}
          </div>
        )}

        {totalCount === 0 && (
          <div className="text-center py-8 text-gray-300 text-sm">
            還沒有任務，點上方新增今日功課吧！
          </div>
        )}

      </div>
    </div>
  )
}
