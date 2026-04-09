import { useState, useRef } from 'react'
import { useApp } from '../../contexts/AppContext'

export default function ContactBookUpload() {
  const { uploadFile, apiPost, saveSubjects, showToast } = useApp()
  const [photos,    setPhotos]    = useState([])   // [{ file, preview }]
  const [subjects,  setSubjects]  = useState([])   // ['國語', '數學', ...]
  const [analyzing, setAnalyzing] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [newSubject, setNewSubject] = useState('')
  const inputRef = useRef()

  const onFileChange = (e) => {
    const files = Array.from(e.target.files)
    const newPhotos = files.map(f => {
      const preview = URL.createObjectURL(f)
      return { file: f, preview }
    })
    setPhotos(p => [...p, ...newPhotos].slice(0, 2))
    setSubjects([])
    setConfirmed(false)
  }

  const analyze = async () => {
    if (photos.length === 0) return
    setAnalyzing(true)
    try {
      // 上傳第一張照片
      const uploadRes = await uploadFile(photos[0].file, 'contact_book')
      if (!uploadRes.ok) { showToast('上傳失敗', 'error'); return }

      // 讓 Gemini 辨識科目
      const res = await apiPost({
        action: 'checkHomework',
        fileUrl: uploadRes.fileUrl,
        subject: '聯絡簿',
        prompt: `
你是一位識別聯絡簿的助理。請從這張聯絡簿照片中，找出今日有哪些科目的作業。
只列出有作業的科目，用繁體中文回應。
JSON格式：{ "subjects": ["國語", "數學", "英文"] }
如果看不清楚，也盡量猜測，subjects 最少給 ["國語"]。
`,
      })

      const result = res.result || {}
      const found = result.subjects || ['國語', '數學']
      setSubjects(found)
    } finally {
      setAnalyzing(false)
    }
  }

  const removeSubject = (i) => setSubjects(s => s.filter((_, idx) => idx !== i))
  const addSubject    = () => {
    if (!newSubject.trim()) return
    setSubjects(s => [...s, newSubject.trim()])
    setNewSubject('')
  }

  const confirm = async () => {
    const res = await saveSubjects(subjects)
    if (res.ok) {
      setConfirmed(true)
      showToast('今日作業科目已儲存！', 'success')
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-mario-brown text-lg">📖 上傳聯絡簿</h2>
      <p className="text-sm text-gray-500">最多上傳 2 張（正反面），AI 會辨識今日作業科目。</p>

      {/* 上傳區 */}
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={onFileChange} />
      <div className="grid grid-cols-2 gap-3">
        {photos.map((p, i) => (
          <div key={i} className="relative rounded-2xl overflow-hidden h-36 bg-gray-100">
            <img src={p.preview} alt="" className="w-full h-full object-cover" />
            <button
              onClick={() => setPhotos(arr => arr.filter((_, idx) => idx !== i))}
              className="absolute top-1 right-1 bg-mario-red text-white rounded-full w-6 h-6 text-xs"
            >✕</button>
          </div>
        ))}
        {photos.length < 2 && (
          <button
            onClick={() => inputRef.current?.click()}
            className="h-36 rounded-2xl border-4 border-dashed border-mario-brown/30 flex flex-col items-center justify-center gap-2 text-mario-brown/50"
          >
            <span className="text-3xl">📷</span>
            <span className="text-xs">新增照片</span>
          </button>
        )}
      </div>

      {photos.length > 0 && subjects.length === 0 && (
        <button
          onClick={analyze}
          disabled={analyzing}
          className={`btn-mario w-full py-4 text-lg ${analyzing ? 'bg-gray-300' : 'bg-mario-blue'}`}
        >
          {analyzing ? '🔍 AI 辨識中...' : '🤖 AI 辨識科目'}
        </button>
      )}

      {/* 科目編輯 */}
      {subjects.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-mario-brown mb-3">📚 今日作業科目</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {subjects.map((s, i) => (
              <div key={i} className="flex items-center gap-1 bg-mario-blue/10 px-3 py-1.5 rounded-xl">
                <span className="text-mario-blue font-bold">{s}</span>
                <button onClick={() => removeSubject(i)} className="text-gray-400 text-xs ml-1">✕</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newSubject}
              onChange={e => setNewSubject(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addSubject()}
              placeholder="新增科目..."
              className="flex-1 border-2 border-mario-blue/30 rounded-xl px-3 py-2 text-sm"
            />
            <button onClick={addSubject} className="btn-mario bg-mario-blue px-4">＋</button>
          </div>

          {!confirmed ? (
            <button onClick={confirm} className="btn-mario w-full py-3 bg-mario-green mt-3 text-lg">
              ✅ 確認，通知小朋友！
            </button>
          ) : (
            <div className="text-center py-3 text-mario-green font-bold">✅ 已儲存！</div>
          )}
        </div>
      )}
    </div>
  )
}
