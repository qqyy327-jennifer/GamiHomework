import { useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import { CHILDREN } from '../../contexts/AppContext'

const PRESET_SUBJECTS = ['國語', '數學', '英文']

export default function ContactBookUpload() {
  const { apiPost, showToast } = useApp()
  const [selectedChild, setSelectedChild] = useState('jasper')
  const [checked,    setChecked]    = useState({ 國語: false, 數學: false, 英文: false })
  const [custom,     setCustom]     = useState('')
  const [extras,     setExtras]     = useState([])   // 自訂科目
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)

  const toggle = (s) => {
    setChecked(c => ({ ...c, [s]: !c[s] }))
    setSaved(false)
  }

  const addExtra = () => {
    const t = custom.trim()
    if (!t || extras.includes(t)) return
    setExtras(e => [...e, t])
    setCustom('')
    setSaved(false)
  }

  const removeExtra = (s) => setExtras(e => e.filter(x => x !== s))

  const handleChildChange = (id) => {
    setSelectedChild(id)
    setChecked({ 國語: false, 數學: false, 英文: false })
    setExtras([])
    setSaved(false)
  }

  const save = async () => {
    const subjects = [
      ...PRESET_SUBJECTS.filter(s => checked[s]),
      ...extras,
    ]
    if (subjects.length === 0) { showToast('請至少選一個科目', 'error'); return }
    setSaving(true)
    const res = await apiPost({ action: 'saveSubjects', child_id: selectedChild, subjects })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      showToast(`${CHILDREN[selectedChild].name} 的作業已設定！`, 'success')
    } else {
      showToast(res.error || '儲存失敗', 'error')
    }
  }

  const anySelected = PRESET_SUBJECTS.some(s => checked[s]) || extras.length > 0

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-mario-brown text-lg">📖 設定今日作業</h2>

      {/* 選孩子 */}
      <div className="flex gap-3">
        {Object.entries(CHILDREN).map(([id, info]) => (
          <button
            key={id}
            onClick={() => handleChildChange(id)}
            className={`flex-1 py-3 rounded-xl border-b-4 font-bold transition-all active:border-b-0 active:translate-y-1
              ${selectedChild === id
                ? 'bg-mario-red border-mario-redDark text-white scale-105'
                : 'bg-white border-gray-200 text-mario-brown'}`}
          >
            <span className="text-2xl block">{info.emoji}</span>
            {info.name}
          </button>
        ))}
      </div>

      {/* 科目勾選 */}
      <div className="card space-y-3">
        <p className="font-bold text-mario-brown text-sm">今天有哪些作業？</p>

        {PRESET_SUBJECTS.map(s => (
          <button
            key={s}
            onClick={() => toggle(s)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 font-bold transition-all
              ${checked[s]
                ? 'bg-mario-yellow/30 border-mario-yellow text-mario-brown'
                : 'bg-gray-50 border-gray-200 text-gray-400'}`}
          >
            <span className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center text-lg flex-shrink-0
              ${checked[s] ? 'bg-mario-yellow border-mario-yellowDk' : 'border-gray-300'}`}>
              {checked[s] ? '✓' : ''}
            </span>
            <span className="text-lg">{s}</span>
          </button>
        ))}

        {/* 額外自訂科目標籤 */}
        {extras.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {extras.map(s => (
              <div key={s} className="flex items-center gap-1 bg-mario-blue/10 border border-mario-blue/30 px-3 py-1.5 rounded-xl">
                <span className="text-mario-blue font-bold text-sm">{s}</span>
                <button onClick={() => removeExtra(s)} className="text-gray-400 text-xs ml-1">✕</button>
              </div>
            ))}
          </div>
        )}

        {/* 自訂輸入 */}
        <div className="flex gap-2">
          <input
            value={custom}
            onChange={e => setCustom(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addExtra()}
            placeholder="其他科目（如：日記、閱讀）"
            className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm"
          />
          <button
            onClick={addExtra}
            className="btn-mario bg-mario-blue border-mario-blueDark border-b-4 px-4"
          >＋</button>
        </div>
      </div>

      {/* 儲存按鈕 */}
      <button
        onClick={save}
        disabled={saving || !anySelected}
        className={`btn-mario w-full py-4 text-lg border-b-4 transition-all
          ${saved         ? 'bg-mario-green border-mario-greenDk'
          : !anySelected  ? 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed'
          :                 'bg-mario-red border-mario-redDark'}`}
      >
        {saving ? '儲存中...'
        : saved  ? `✅ ${CHILDREN[selectedChild].name} 的作業已設定！`
        :          `🚀 通知 ${CHILDREN[selectedChild].name}！`}
      </button>
    </div>
  )
}
