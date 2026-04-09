import { useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import StreakBar     from '../shared/StreakBar'
import TaskCard      from './TaskCard'
import HomeworkUpload from './HomeworkUpload'
import SideQuests    from './SideQuests'
import StarExchange  from './StarExchange'

const TABS = [
  { id: 'home',    label: '今日任務', icon: '📋' },
  { id: 'hw',      label: '上傳作業', icon: '📸' },
  { id: 'quests',  label: '額外任務', icon: '🎯' },
  { id: 'shop',    label: '星星商店', icon: '🛒' },
]

export default function ChildDashboard() {
  const { stars, tasks, logout, loading, childInfo } = useApp()
  const [tab, setTab] = useState('home')

  const homeworkTasks = tasks.filter(t => t.type === 'homework')
  const otherTasks    = tasks.filter(t => t.type !== 'homework')
  const doneCount     = tasks.filter(t => t.status !== 'pending').length
  const allDone       = tasks.length > 0 && doneCount === tasks.length

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto">

      {/* 頂部 Header */}
      <header className="bg-mario-red border-b-4 border-mario-redDark px-4 pt-10 pb-4 shadow-lg">
        <div className="flex items-center justify-between">
          <button onClick={logout} className="text-white/70 text-sm font-bold">← 登出</button>
          {/* 孩子名字 */}
          <span className="font-black text-white text-base tracking-wide">
            {childInfo?.emoji} {childInfo?.name}
          </span>
          {/* 金幣風格星星餘額 */}
          <div className="flex items-center gap-2 bg-mario-brown/40 border-2 border-mario-yellowDk px-4 py-1.5 rounded-xl">
            <span className="text-xl animate-float">⭐</span>
            <span className="font-black text-mario-yellow text-xl drop-shadow-[0_2px_0_#C8860A]">{stars}</span>
          </div>
        </div>

        {/* 進度條 */}
        <div className="mt-3">
          <div className="flex justify-between text-white/80 text-xs mb-1 font-bold">
            <span>今日進度</span>
            <span>{doneCount}/{tasks.length}</span>
          </div>
          <div className="h-4 bg-mario-redDark rounded-full overflow-hidden border border-mario-redDark">
            <div
              className="h-full bg-mario-yellow rounded-full transition-all duration-700"
              style={{ width: tasks.length ? `${(doneCount / tasks.length) * 100}%` : '0%' }}
            />
          </div>
          {allDone && (
            <p className="text-center text-mario-yellow font-black mt-1 animate-bounce2 drop-shadow-[0_2px_0_#C8860A]">
              🎉 全部完成！太厲害了！
            </p>
          )}
        </div>
      </header>

      {/* 主內容 */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading && (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl animate-bounce2">⭐</div>
            <p>載入中...</p>
          </div>
        )}

        {tab === 'home' && (
          <>
            <StreakBar />

            {/* 作業任務 */}
            {homeworkTasks.length > 0 && (
              <section>
                <h2 className="font-bold text-mario-brown mb-2 flex items-center gap-2">
                  📚 今日作業
                </h2>
                <div className="space-y-3">
                  {homeworkTasks.map(t => <TaskCard key={t.rowId} task={t} />)}
                </div>
              </section>
            )}

            {/* 其他任務 */}
            {otherTasks.length > 0 && (
              <section>
                <h2 className="font-bold text-mario-brown mb-2 flex items-center gap-2">
                  ✅ 日常任務
                </h2>
                <div className="space-y-3">
                  {otherTasks.map(t => <TaskCard key={t.rowId} task={t} />)}
                </div>
              </section>
            )}

            {tasks.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-400">
                <div className="text-5xl mb-3">🌟</div>
                <p>還沒有任務！<br/>請爸媽上傳聯絡簿喔</p>
              </div>
            )}
          </>
        )}

        {tab === 'hw'     && <HomeworkUpload />}
        {tab === 'quests' && <SideQuests />}
        {tab === 'shop'   && <StarExchange />}
      </main>

      {/* 底部導航：地板磚風格 */}
      <nav className="bg-mario-ground border-t-4 border-mario-yellowDk px-2 py-2">
        <div className="flex gap-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center py-1.5 rounded-xl border-b-4 transition-all active:border-b-0 active:translate-y-1
                ${tab === t.id
                  ? 'bg-mario-red border-mario-redDark text-white'
                  : 'bg-mario-ground border-mario-yellowDk text-mario-brown'}`}
            >
              <span className="text-xl">{t.icon}</span>
              <span className="text-xs font-black">{t.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
