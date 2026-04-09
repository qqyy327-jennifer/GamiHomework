import { useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import ContactBookUpload from './ContactBookUpload'
import TaskReview       from './TaskReview'
import ConfigPanel      from './ConfigPanel'

const TABS = [
  { id: 'review',   label: '審核任務', icon: '✅' },
  { id: 'book',     label: '聯絡簿',   icon: '📖' },
  { id: 'config',   label: '設定',     icon: '⚙️' },
]

export default function ParentDashboard() {
  const { stars, streak, tasks, logout, config } = useApp()
  const [tab, setTab] = useState('review')

  const pendingApproval = tasks.filter(t => t.status === 'done')
  const target = config.streakTarget || 5

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto">

      {/* Header */}
      <header className="bg-mario-brown px-4 pt-10 pb-4 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <button onClick={logout} className="text-white/70 text-sm">← 登出</button>
          <span className="font-bold text-white">👨‍👩‍👧 家長模式</span>
          <span className="text-mario-yellow font-bold">{stars} ⭐</span>
        </div>

        {/* 概況 */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="今日任務" value={tasks.length} />
          <StatCard label="待審核" value={pendingApproval.length} highlight />
          <StatCard label={`連續天數`} value={`${streak}/${target}`} />
        </div>
      </header>

      {/* 主內容 */}
      <main className="flex-1 overflow-y-auto px-4 py-4">
        {tab === 'review' && <TaskReview />}
        {tab === 'book'   && <ContactBookUpload />}
        {tab === 'config' && <ConfigPanel />}
      </main>

      {/* 底部導航 */}
      <nav className="bg-white border-t border-gray-100 px-2 py-2 rounded-t-3xl shadow-lg">
        <div className="flex">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center py-1 rounded-2xl transition-all
                ${tab === t.id ? 'bg-mario-brown text-white scale-105' : 'text-gray-400'}`}
            >
              <span className="text-xl">{t.icon}</span>
              <span className="text-xs font-bold">{t.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

function StatCard({ label, value, highlight }) {
  return (
    <div className={`rounded-2xl p-2 text-center ${highlight && Number(value) > 0 ? 'bg-mario-red' : 'bg-white/20'}`}>
      <p className="text-white/70 text-xs">{label}</p>
      <p className="text-white font-bold text-xl">{value}</p>
    </div>
  )
}
