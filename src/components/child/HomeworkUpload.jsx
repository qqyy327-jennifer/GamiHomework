import { useState, useRef } from 'react'
import { useApp } from '../../contexts/AppContext'

export default function HomeworkUpload() {
  const { tasks, uploadFile, apiPost, completeTask, showToast } = useApp()
  const hwTasks = tasks.filter(t => t.type === 'homework' && t.status === 'pending')

  const [selected, setSelected] = useState(null)   // task
  const [preview,  setPreview]  = useState(null)   // data URL
  const [file,     setFile]     = useState(null)
  const [checking, setChecking] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const inputRef = useRef()

  const pickImage = () => inputRef.current?.click()

  const onFileChange = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setAiResult(null)
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target.result)
    reader.readAsDataURL(f)
  }

  const handleSubmit = async () => {
    if (!file || !selected) return
    setChecking(true)
    try {
      // 1. 上傳到 Drive
      const uploadRes = await uploadFile(file, `homework/${new Date().toLocaleDateString('zh-TW')}`)
      if (!uploadRes.ok) { showToast('上傳失敗', 'error'); return }

      // 2. 讓 Gemini 批改
      const checkRes = await apiPost({
        action: 'checkHomework',
        fileUrl: uploadRes.fileUrl,
        subject: selected.label,
      })

      const result = checkRes.result || {}
      setAiResult(result)

      // 3. 完成任務
      await completeTask(selected.rowId, uploadRes.fileUrl)

      if (result.allCorrect) {
        showToast('全部正確！獎勵加倍！🎉', 'success')
      } else {
        showToast('有幾題需要再想想喔 🤔', 'info')
      }
    } finally {
      setChecking(false)
    }
  }

  if (hwTasks.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <div className="text-5xl mb-3">🎉</div>
        <p className="font-bold text-lg text-mario-green">作業全部完成啦！</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-mario-brown text-lg">📸 上傳作業照片</h2>

      {/* 選擇科目 */}
      <div>
        <p className="text-sm text-gray-500 mb-2">選哪一科？</p>
        <div className="flex flex-wrap gap-2">
          {hwTasks.map(t => (
            <button
              key={t.rowId}
              onClick={() => { setSelected(t); setPreview(null); setFile(null); setAiResult(null) }}
              className={`btn-mario px-4 py-2 text-sm
                ${selected?.rowId === t.rowId ? 'bg-mario-red' : 'bg-mario-blue'}`}
            >
              📚 {t.label}
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <>
          {/* 拍照/選圖 */}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={onFileChange}
          />
          <button
            onClick={pickImage}
            className="btn-mario w-full h-40 bg-mario-sky text-mario-blue border-4 border-dashed border-mario-blue/40 flex-col text-xl"
          >
            {preview
              ? <img src={preview} alt="預覽" className="w-full h-full object-contain rounded-2xl" />
              : <><span className="text-5xl">📷</span><span className="text-sm mt-2">點我拍照 / 選圖</span></>
            }
          </button>

          {/* 送出批改 */}
          {file && !aiResult && (
            <button
              onClick={handleSubmit}
              disabled={checking}
              className={`btn-mario w-full py-4 text-lg ${checking ? 'bg-gray-300' : 'bg-mario-green'}`}
            >
              {checking ? '🔍 AI 老師批改中...' : '🚀 交給 AI 老師批改！'}
            </button>
          )}
        </>
      )}

      {/* AI 結果 */}
      {aiResult && (
        <div className={`card border-4 ${aiResult.allCorrect ? 'border-mario-green' : 'border-mario-yellow'}`}>
          <p className={`font-bold text-lg mb-2 ${aiResult.allCorrect ? 'text-mario-green' : 'text-mario-brown'}`}>
            {aiResult.allCorrect ? '🌟 全部正確！' : '📝 有幾個地方要再看看'}
          </p>
          {aiResult.encouragement && (
            <p className="text-mario-brown mb-3 text-sm">{aiResult.encouragement}</p>
          )}
          {(aiResult.errors || []).map((err, i) => (
            <div key={i} className="bg-mario-yellow/20 rounded-xl p-3 mb-2">
              <p className="font-bold text-mario-brown text-sm">📍 {err.location}</p>
              <p className="text-mario-brown text-sm mt-1">💡 {err.hint}</p>
            </div>
          ))}
          <button
            onClick={() => { setSelected(null); setPreview(null); setFile(null); setAiResult(null) }}
            className="btn-mario w-full py-3 bg-mario-blue mt-2"
          >
            繼續下一科 →
          </button>
        </div>
      )}
    </div>
  )
}
