import { useApp } from '../../contexts/AppContext'
import { CHILDREN } from '../../contexts/AppContext'

export default function TaskReview() {
  const { tasks, apiPost, loadParentTasks, showToast } = useApp()
  const pending = tasks.filter(t => t.status === 'done')

  const approve = async (task, bonus = 0) => {
    await apiPost({ action: 'approveTask', taskRowId: task.rowId, stars: bonus, child_id: task.childId })
    showToast(`已核准「${task.label}」${bonus > 0 ? ` +${bonus}⭐` : ''}`, 'success')
    await loadParentTasks()
  }

  if (pending.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <div className="text-5xl mb-3">🎉</div>
        <p>目前沒有待審核的任務</p>
      </div>
    )
  }

  // 依孩子分組
  const grouped = Object.entries(CHILDREN).map(([id, info]) => ({
    id, info,
    tasks: pending.filter(t => t.childId === id),
  })).filter(g => g.tasks.length > 0)

  return (
    <div className="space-y-5">
      <h2 className="font-bold text-mario-brown text-lg">✅ 待審核 ({pending.length})</h2>

      {grouped.map(({ id, info, tasks: childTasks }) => (
        <div key={id}>
          {/* 孩子名稱標籤 */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{info.emoji}</span>
            <span className="font-black text-mario-brown text-base">{info.name}</span>
            <span className="bg-mario-blue/10 text-mario-blue text-xs font-bold px-2 py-0.5 rounded-full">
              {childTasks.length} 項
            </span>
          </div>

          <div className="space-y-3">
            {childTasks.map(task => (
              <div key={task.rowId} className="card border-l-4"
                style={{ borderLeftColor: id === 'jasper' ? '#0058F8' : '#43B047' }}>
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">{task.type === 'homework' ? '📚' : '🧹'}</span>
                  <div className="flex-1">
                    <p className="font-bold text-mario-brown">{task.label}</p>
                    <p className="text-xs text-gray-400">{task.type === 'homework' ? '作業' : '家事/其他'}</p>
                  </div>
                </div>

                {task.fileUrl && (
                  <a href={task.fileUrl} target="_blank" rel="noopener noreferrer"
                     className="block rounded-2xl overflow-hidden mb-3 border-2 border-mario-blue/20">
                    <div className="bg-mario-sky/30 text-center py-3 text-sm text-mario-blue font-bold">
                      📷 點擊查看照片
                    </div>
                  </a>
                )}

                {task.aiResult?.encouragement && (
                  <div className="bg-mario-yellow/10 rounded-xl p-3 mb-3 text-sm text-mario-brown">
                    🤖 {task.aiResult.encouragement}
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => approve(task, 0)} className="btn-mario flex-1 py-2 bg-mario-green border-mario-greenDk text-sm">✅ 核准</button>
                  <button onClick={() => approve(task, 1)} className="btn-mario flex-1 py-2 bg-mario-yellow border-mario-yellowDk text-mario-brown text-sm">⭐ +1</button>
                  <button onClick={() => approve(task, 2)} className="btn-mario flex-1 py-2 bg-mario-star border-mario-yellowDk text-mario-brown text-sm">🌟 +2</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
