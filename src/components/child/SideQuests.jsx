import { useState } from 'react'
import { useApp } from '../../contexts/AppContext'

const PRESET_CHORES = [
  { label: '擦桌子', icon: '🧽' },
  { label: '折衣服', icon: '👕' },
  { label: '整理玩具', icon: '🧸' },
  { label: '掃樓梯', icon: '🧹' },
]

export default function SideQuests() {
  const { completeTask, apiPost, showToast, tasks, loadAll } = useApp()
  const [jumpCount, setJumpCount] = useState('')
  const [customChore, setCustomChore] = useState('')
  const [done, setDone] = useState({})   // { label: true }

  const bagTask = tasks.find(t => t.type === 'bag')

  const markChore = async (label) => {
    if (done[label]) return
    // 新增並立即完成家事
    const addRes = await apiPost({ action: 'addChoreTask', date: null, label })
    if (addRes.ok) {
      await apiPost({ action: 'completeTask', rowId: addRes.rowId })
      setDone(d => ({ ...d, [label]: true }))
      showToast(`${label} 完成！+1⭐`, 'success')
    }
  }

  const submitJump = async () => {
    const count = parseInt(jumpCount)
    if (!count || count <= 0) { showToast('請輸入跳繩次數', 'error'); return }
    const stars = count >= 100 ? 3 : count >= 50 ? 2 : 1
    await apiPost({ action: 'addStars', amount: stars, reason: `跳繩 ${count} 下` })
    showToast(`跳繩 ${count} 下！獲得 ${stars}⭐`, 'success')
    setJumpCount('')
    setDone(d => ({ ...d, jump: true }))
  }

  const completeBag = async () => {
    if (!bagTask || bagTask.status !== 'pending') return
    await completeTask(bagTask.rowId)
  }

  return (
    <div className="space-y-5">
      <h2 className="font-bold text-mario-brown text-lg">🎯 額外任務</h2>

      {/* 家事 */}
      <div className="card">
        <h3 className="font-bold text-mario-brown mb-3">🧹 做家事 (+1⭐ 每項)</h3>
        <div className="grid grid-cols-2 gap-3">
          {PRESET_CHORES.map(c => (
            <button
              key={c.label}
              onClick={() => markChore(c.label)}
              className={`btn-mario py-4 flex-col text-sm
                ${done[c.label] ? 'bg-mario-green' : 'bg-mario-blue'}`}
            >
              <span className="text-3xl">{done[c.label] ? '✅' : c.icon}</span>
              <span className="mt-1">{c.label}</span>
            </button>
          ))}
        </div>

        {/* 自訂家事 */}
        <div className="flex gap-2 mt-3">
          <input
            value={customChore}
            onChange={e => setCustomChore(e.target.value)}
            placeholder="其他家事..."
            className="flex-1 border-2 border-mario-blue/30 rounded-xl px-3 py-2 text-sm"
          />
          <button
            onClick={() => { if (customChore.trim()) { markChore(customChore.trim()); setCustomChore('') } }}
            className="btn-mario bg-mario-blue px-4"
          >
            ＋
          </button>
        </div>
      </div>

      {/* 跳繩 */}
      <div className="card">
        <h3 className="font-bold text-mario-brown mb-3">🏃 跳繩運動</h3>
        <p className="text-xs text-gray-400 mb-3">50下=2⭐，100下以上=3⭐</p>
        <div className="flex gap-3 items-center">
          <input
            type="number"
            value={jumpCount}
            onChange={e => setJumpCount(e.target.value)}
            placeholder="跳了幾下？"
            className="flex-1 border-2 border-mario-green/30 rounded-xl px-3 py-3 text-lg text-center font-bold"
            min="1"
          />
          <button
            onClick={submitJump}
            disabled={done.jump}
            className={`btn-mario px-5 py-3 ${done.jump ? 'bg-mario-green' : 'bg-mario-red'}`}
          >
            {done.jump ? '✅' : '送出'}
          </button>
        </div>
      </div>

      {/* 整理書包 */}
      <div className="card">
        <h3 className="font-bold text-mario-brown mb-3">🎒 整理書包</h3>
        <button
          onClick={completeBag}
          disabled={!bagTask || bagTask.status !== 'pending'}
          className={`btn-mario w-full py-4 text-lg
            ${bagTask?.status !== 'pending' ? 'bg-mario-green' : 'bg-mario-yellow text-mario-brown'}`}
        >
          {bagTask?.status !== 'pending' ? '✅ 已整理好！' : '🎒 書包整理完畢！'}
        </button>
      </div>
    </div>
  )
}
