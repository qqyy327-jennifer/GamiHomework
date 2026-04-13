import { useState, useRef } from 'react'
import confetti from 'canvas-confetti'
import { Mic, MicOff, LogOut, ChevronLeft, ChevronRight, Check } from 'lucide-react'
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

// ── Task type icons + labels ───────────────────────────────────────────────

const ICONS = {
  subject:  { emoji: '📚', color: 'bg-blue-100',   text: 'text-blue-700'   },
  jumprope: { emoji: '🪢', color: 'bg-purple-100', text: 'text-purple-700' },
  daily:    { emoji: '🎒', color: 'bg-amber-100',  text: 'text-amber-700'  },
  chore:    { emoji: '🧹', color: 'bg-green-100',  text: 'text-green-700'  },
  custom:   { emoji: '⭐', color: 'bg-pink-100',   text: 'text-pink-700'   },
}
const CHORE_EMOJI = { '擦桌子':'🧹','摺衣服':'👕','掃樓梯':'🧺','收玩具':'🧸' }
const SUBJECT_EMOJI = { '國語':'📖','數學':'📐','英文':'🔤' }
const taskEmoji = t => CHORE_EMOJI[t.taskName] || SUBJECT_EMOJI[t.taskName] || ICONS[t.taskType]?.emoji || '⭐'

// ── Jasper task row ────────────────────────────────────────────────────────

function JasperRow({ task, onToggle }) {
  const [jumpVal, setJumpVal] = useState(task.extra || '')
  const done = task.status === 'Completed'
  const style = ICONS[task.taskType] || ICONS.custom

  if (task.taskType === 'jumprope') {
    return (
      <div className={`task-row ${done ? 'done' : ''}`}>
        <span className="text-2xl">{taskEmoji(task)}</span>
        <span className="flex-1 font-bold text-gray-700">{task.taskName}</span>
        {done
          ? <span className="text-green-500 font-bold text-sm">✓ {task.extra} 下</span>
          : (
            <div className="flex items-center gap-2">
              <input
                type="number" min="0" placeholder="次數"
                value={jumpVal}
                onChange={e => setJumpVal(e.target.value)}
                onClick={e => e.stopPropagation()}
                className="w-20 border-2 border-amber-300 rounded-xl px-2 py-1 text-center font-bold"
              />
              <button
                onClick={() => { if (jumpVal) onToggle(task, jumpVal) }}
                className="bg-amber-400 text-white rounded-xl px-3 py-1 font-bold"
              >完成</button>
            </div>
          )}
        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${style.color} ${style.text}`}>
          +{task.value}⭐
        </span>
      </div>
    )
  }

  return (
    <div className={`task-row ${done ? 'done' : ''}`} onClick={() => onToggle(task)}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${done ? 'bg-green-400' : 'bg-gray-100'}`}>
        {done ? <Check size={16} className="text-white" /> : <span className="text-lg">{taskEmoji(task)}</span>}
      </div>
      <span className={`flex-1 font-bold ${done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
        {task.taskName}
      </span>
      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${style.color} ${style.text}`}>
        +{task.value}⭐
      </span>
    </div>
  )
}

// ── Terry task card ────────────────────────────────────────────────────────

const TERRY_COLORS = [
  'bg-blue-200 text-blue-800',
  'bg-green-200 text-green-800',
  'bg-purple-200 text-purple-800',
  'bg-amber-200 text-amber-800',
  'bg-pink-200 text-pink-800',
  'bg-teal-200 text-teal-800',
]

function TerryCard({ task, index, onToggle }) {
  const done = task.status === 'Completed'
  const color = TERRY_COLORS[index % TERRY_COLORS.length]
  return (
    <div
      className={`terry-card p-4 ${color} ${done ? 'done' : ''}`}
      onClick={() => onToggle(task)}
    >
      <span className="text-4xl">{done ? '✅' : taskEmoji(task)}</span>
      <span className="font-bold text-base mt-1">{task.taskName}</span>
      <span className="text-xs font-bold opacity-70">+{task.value}⭐</span>
    </div>
  )
}

// ── Voice button ───────────────────────────────────────────────────────────

function VoiceButton({ onResult, childName }) {
  const [listening, setListening] = useState(false)
  const recRef = useRef(null)

  function start() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('此裝置不支援語音辨識，請手動輸入'); return }
    const rec = new SR()
    rec.lang = 'zh-TW'
    rec.interimResults = false
    rec.onstart  = () => setListening(true)
    rec.onend    = () => setListening(false)
    rec.onerror  = () => setListening(false)
    rec.onresult = e => {
      const text = e.results[0][0].transcript.trim()
      if (text) {
        onResult(text)
        if (childName === 'terry') {
          const utt = new SpeechSynthesisUtterance(`好的，Terry 要幫忙${text}，太棒了！`)
          utt.lang = 'zh-TW'
          speechSynthesis.speak(utt)
        }
      }
    }
    recRef.current = rec
    rec.start()
  }

  function stop() { recRef.current?.stop() }

  return (
    <button
      onClick={listening ? stop : start}
      className={`btn-child w-full gap-3 text-white font-bold
        ${listening ? 'bg-red-400 animate-pulse' : 'bg-pink-400'}`}
    >
      {listening ? <MicOff size={20} /> : <Mic size={20} />}
      {listening ? '說話中…點擊停止' : '🎙️ 語音新增家事 (+2⭐)'}
    </button>
  )
}

// ── Main dashboard ─────────────────────────────────────────────────────────

const SECTION_ORDER = ['subject', 'jumprope', 'daily', 'chore', 'custom']
const SECTION_LABELS = {
  subject:  '📚 學科',
  jumprope: '🪢 跳繩',
  daily:    '🎒 日常',
  chore:    '🧹 家事',
  custom:   '⭐ 自訂家事',
}

export default function ChildDashboard() {
  const {
    currentChild, setCurrentChild,
    selectedDate, setSelectedDate,
    tasks, balance, streak,
    completeTask, uncompleteTask, addCustomTask,
    showToast, logout,
  } = useApp()

  const childTasks = tasks[currentChild] || []
  const today = todayStr()

  // Group tasks by type
  const grouped = {}
  for (const t of childTasks) {
    const type = t.taskType || 'custom'
    if (!grouped[type]) grouped[type] = []
    grouped[type].push(t)
  }

  // For Terry, hide subjects (not applicable)
  const sections = SECTION_ORDER.filter(s => {
    if (currentChild === 'terry' && s === 'subject') return false
    if (currentChild === 'terry' && s === 'jumprope') return false
    return grouped[s]?.length > 0 || s === 'custom'
  })

  async function handleToggle(task, extra) {
    if (task.status === 'Completed') {
      await uncompleteTask(currentChild, selectedDate, task.taskName)
    } else {
      const res = await completeTask(currentChild, selectedDate, task.taskName, extra)
      if (res) {
        celebrate()
        showToast(`+${res.stars}⭐ ${task.taskName} 完成！`)
      }
    }
  }

  async function handleVoiceResult(text) {
    await addCustomTask(currentChild, selectedDate, text)
    showToast(`已新增：${text}`)
  }

  // Date navigation (today + 4 days back)
  const dateOptions = Array.from({ length: 5 }, (_, i) => addDays(today, -i))

  const completedCount = childTasks.filter(t => t.status === 'Completed').length
  const totalCount     = childTasks.length
  const progressPct    = totalCount ? Math.round(completedCount / totalCount * 100) : 0

  return (
    <div className="flex flex-col flex-1 pb-8">
      {/* Header */}
      <div className="bg-amber-400 px-4 pt-6 pb-4 rounded-b-3xl shadow-md">
        {/* Child switcher */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={logout} className="text-amber-700 p-1"><LogOut size={18} /></button>
          <div className="flex rounded-2xl overflow-hidden bg-amber-300 shadow-inner">
            {[['jasper','🦸 Jasper'],['terry','🌟 Terry']].map(([id, label]) => (
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

        {/* Streak */}
        <div className="mb-1">
          <div className="flex justify-between text-xs text-amber-700 mb-1">
            <span>連續達成</span>
            <span>{streak[currentChild]}/5 天</span>
          </div>
          <StreakBar count={streak[currentChild]} />
        </div>
      </div>

      <div className="flex-1 px-4 pt-4 flex flex-col gap-4 overflow-y-auto">
        {/* Date picker */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {dateOptions.map(d => (
            <button
              key={d}
              onClick={() => setSelectedDate(d)}
              className={`flex-shrink-0 px-4 py-2 rounded-2xl font-bold text-sm transition-colors
                ${selectedDate === d
                  ? 'bg-amber-400 text-white shadow'
                  : 'bg-white text-gray-500'}`}
            >
              {displayDate(d)}
            </button>
          ))}
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>今日進度</span>
            <span>{completedCount}/{totalCount}</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Task sections — Jasper: list view, Terry: card grid */}
        {currentChild === 'jasper' ? (
          SECTION_ORDER.filter(s => grouped[s]?.length > 0).map(section => (
            <div key={section}>
              <div className="text-xs font-bold text-gray-400 mb-2 px-1">{SECTION_LABELS[section]}</div>
              <div className="flex flex-col gap-2">
                {grouped[section].map(task => (
                  <JasperRow key={task.taskName} task={task} onToggle={handleToggle} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {childTasks
              .filter(t => t.taskType !== 'subject' && t.taskType !== 'jumprope')
              .map((task, i) => (
                <TerryCard key={task.taskName} task={task} index={i} onToggle={handleToggle} />
              ))}
          </div>
        )}

        {/* Voice add custom chore */}
        <VoiceButton onResult={handleVoiceResult} childName={currentChild} />

        {completedCount === totalCount && totalCount > 0 && (
          <div className="text-center py-4 text-2xl font-black text-amber-500 animate-bounce">
            🎉 全部完成！超棒的！
          </div>
        )}
      </div>
    </div>
  )
}
