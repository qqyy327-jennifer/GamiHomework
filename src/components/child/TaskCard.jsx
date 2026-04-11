import { useState, useRef } from 'react'
import { useApp } from '../../contexts/AppContext'

const TYPE_ICONS = { homework: '📚', chore: '🧹', exercise: '🏃', bag: '🎒' }

export default function TaskCard({ task }) {
  const { completeTask, uploadFile, apiPost, showToast } = useApp()
  const [expanded,  setExpanded]  = useState(false)
  const [preview,   setPreview]   = useState(null)
  const [file,      setFile]      = useState(null)
  const [checking,  setChecking]  = useState(false)
  const [aiResult,  setAiResult]  = useState(null)
  const inputRef = useRef()

  const isDone = task.status !== 'pending'

  // 非作業類：直接點擊完成
  const handleTap = async () => {
    if (isDone) return
    if (task.type !== 'homework') {
      await completeTask(task.rowId)
      return
    }
    setExpanded(e => !e)
  }

  // 直接完成（不拍照）
  const handleDone = async () => {
    await completeTask(task.rowId)
    setExpanded(false)
  }

  // 選照片
  const onFileChange = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setAiResult(null)
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target.result)
    reader.readAsDataURL(f)
  }

  // 上傳並 AI 批改
  const handleAICheck = async () => {
    if (!file) return
    setChecking(true)
    try {
      const uploadRes = await uploadFile(file, `homework`)
      if (!uploadRes.ok) { showToast('上傳失敗', 'error'); return }

      const checkRes = await apiPost({
        action: 'checkHomework',
        fileUrl: uploadRes.fileUrl,
        subject: task.label,
      })

      const result = checkRes.result || {}
      setAiResult(result)
      await completeTask(task.rowId, uploadRes.fileUrl)

      if (result.allCorrect) showToast('全部正確！獎勵加倍！🎉', 'success')
      else showToast('有幾題要再想想喔 🤔', 'info')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className={`card transition-all duration-200 ${isDone ? 'opacity-70' : ''}`}>
      {/* 主列 */}
      <div
        onClick={handleTap}
        className={`flex items-center gap-3 ${!isDone ? 'cursor-pointer active:scale-95' : ''}`}
      >
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0
          ${isDone ? 'bg-mario-green/20' : 'bg-mario-sky'}`}>
          {isDone ? '✅' : TYPE_ICONS[task.type] || '📌'}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-mario-brown truncate ${isDone ? 'line-through' : ''}`}>
            {task.label}
          </p>
          {isDone && (
            <span className="text-xs text-mario-green font-bold">完成！+{task.stars || 1}⭐</span>
          )}
        </div>
        {task.type === 'homework' && !isDone && (
          <span className={`text-mario-brown/40 text-lg transition-transform ${expanded ? 'rotate-90' : ''}`}>›</span>
        )}
      </div>

      {/* 展開區（作業才有）*/}
      {task.type === 'homework' && !isDone && expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">

          {/* 直接完成 */}
          <button
            onClick={handleDone}
            className="btn-mario w-full py-3 bg-mario-green border-mario-greenDk border-b-4 text-base"
          >
            ✅ 寫完了！
          </button>

          {/* AI 批改區 */}
          <div className="bg-mario-sky/20 rounded-2xl p-3 space-y-2">
            <p className="text-xs text-mario-brown font-bold text-center">📸 讓 AI 老師幫我看看有沒有錯</p>

            <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />

            {!preview ? (
              <button
                onClick={() => inputRef.current?.click()}
                className="btn-mario w-full py-2 bg-mario-blue border-mario-blueDark border-b-4 text-sm"
              >
                📷 拍作業照片
              </button>
            ) : (
              <div className="space-y-2">
                <img src={preview} alt="預覽" className="w-full rounded-xl object-contain max-h-40" />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setPreview(null); setFile(null) }}
                    className="btn-mario flex-1 py-2 bg-gray-200 border-gray-300 border-b-4 text-mario-brown text-sm"
                  >重拍</button>
                  <button
                    onClick={handleAICheck}
                    disabled={checking}
                    className={`btn-mario flex-1 py-2 border-b-4 text-sm
                      ${checking ? 'bg-gray-300 border-gray-400' : 'bg-mario-red border-mario-redDark'}`}
                  >
                    {checking ? '批改中...' : '🤖 送出批改'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* AI 結果 */}
          {aiResult && (
            <div className={`rounded-2xl p-3 border-2 ${aiResult.allCorrect ? 'border-mario-green bg-mario-green/10' : 'border-mario-yellow bg-mario-yellow/10'}`}>
              <p className="font-bold text-mario-brown mb-1">
                {aiResult.allCorrect ? '🌟 全部正確！' : '📝 有幾個地方要再看看'}
              </p>
              {aiResult.encouragement && <p className="text-sm text-mario-brown mb-2">{aiResult.encouragement}</p>}
              {(aiResult.errors || []).map((err, i) => (
                <div key={i} className="bg-white rounded-xl p-2 mb-1">
                  <p className="text-xs font-bold text-mario-brown">📍 {err.location}</p>
                  <p className="text-xs text-mario-brown mt-0.5">💡 {err.hint}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
