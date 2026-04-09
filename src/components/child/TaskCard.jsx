import { useApp } from '../../contexts/AppContext'

const TYPE_ICONS = {
  homework: '📚',
  chore:    '🧹',
  exercise: '🏃',
  bag:      '🎒',
}

const STATUS_LABELS = {
  pending:  { label: '還沒做',   color: 'bg-gray-100 text-gray-500' },
  done:     { label: '完成啦！', color: 'bg-mario-green/20 text-mario-green' },
  approved: { label: '爸媽認可', color: 'bg-mario-yellow/30 text-mario-brown' },
}

export default function TaskCard({ task }) {
  const { completeTask } = useApp()
  const isDone = task.status !== 'pending'
  const status = STATUS_LABELS[task.status] || STATUS_LABELS.pending

  const handleTap = async () => {
    if (isDone) return
    // 簡單任務（家事、書包）直接完成；作業請到「上傳作業」頁面
    if (task.type === 'homework') return
    await completeTask(task.rowId)
  }

  return (
    <div
      onClick={handleTap}
      className={`card flex items-center gap-3 cursor-pointer transition-all duration-200
        ${isDone ? 'opacity-70' : 'active:scale-95 hover:shadow-lg'}`}
    >
      {/* 圖示 */}
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0
        ${isDone ? 'bg-mario-green/20' : 'bg-mario-sky'}`}>
        {isDone ? '✅' : (TYPE_ICONS[task.type] || '📌')}
      </div>

      {/* 文字 */}
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-mario-brown truncate ${isDone ? 'line-through' : ''}`}>
          {task.label}
        </p>
        <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
          {status.label}
        </span>
      </div>

      {/* 星星獎勵 */}
      <div className="flex-shrink-0 text-sm text-mario-coin font-bold">
        {isDone ? `+${task.stars || 1}⭐` : ''}
      </div>

      {/* 作業提示箭頭 */}
      {task.type === 'homework' && !isDone && (
        <span className="text-gray-300 text-lg">›</span>
      )}
    </div>
  )
}
