import { useState, useRef } from 'react'
import { LogOut, Star, Gift, FlaskConical, Plus, Minus, Upload, Loader } from 'lucide-react'
import { useApp } from '../../contexts/AppContext.jsx'

// ── Rewards catalogue ──────────────────────────────────────────────────────

const REWARDS = [
  { name: '玩桌遊',       cost: 5,  emoji: '🎲' },
  { name: '打電動 20分',  cost: 8,  emoji: '🎮' },
  { name: '買書',         cost: 6,  emoji: '📚' },
  { name: '吃糖',         cost: 3,  emoji: '🍬' },
  { name: '看電視 20分',  cost: 5,  emoji: '📺' },
]

// ── Tab bar ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'supply', label: '補給站',  Icon: Star },
  { id: 'shop',   label: '兌換所',  Icon: Gift },
  { id: 'ai',     label: 'AI 實驗室', Icon: FlaskConical },
]

// ── Star Supply ────────────────────────────────────────────────────────────

function StarSupply() {
  const { balance, addManualStar } = useApp()
  const [child,  setChild]  = useState('jasper')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [sign,   setSign]   = useState(1)   // 1 = add, -1 = subtract

  async function submit() {
    const n = parseInt(amount, 10)
    if (!n || n <= 0) return
    if (!reason.trim()) return
    await addManualStar(child, sign * n, reason.trim())
    setAmount(''); setReason('')
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Balances */}
      <div className="grid grid-cols-2 gap-3">
        {['jasper','terry'].map(c => (
          <div key={c} className="bg-amber-50 rounded-2xl p-4 text-center shadow-sm">
            <div className="text-3xl mb-1">{c === 'jasper' ? '👦' : '🧒'}</div>
            <div className="font-bold capitalize">{c}</div>
            <div className="text-2xl font-black text-amber-500">{balance[c]}⭐</div>
          </div>
        ))}
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
        <div className="font-bold text-gray-700">手動補給</div>

        {/* Child selector */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200">
          {[['jasper','👦 Jasper'],['terry','🧒 Terry']].map(([id,label]) => (
            <button
              key={id}
              onClick={() => setChild(id)}
              className={`flex-1 py-2 font-bold text-sm
                ${child === id ? 'bg-amber-400 text-white' : 'text-gray-400'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* +/- toggle */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200">
          {[[1,'+','bg-green-400'],[-1,'-','bg-red-400']].map(([s,label,color]) => (
            <button
              key={s}
              onClick={() => setSign(s)}
              className={`flex-1 py-2 font-bold text-sm
                ${sign === s ? `${color} text-white` : 'text-gray-400'}`}
            >
              {label} 星星
            </button>
          ))}
        </div>

        <input
          type="number" min="1" placeholder="數量"
          value={amount} onChange={e => setAmount(e.target.value)}
          className="border-2 border-gray-200 rounded-xl px-4 py-3 font-bold text-center text-lg"
        />

        <input
          type="text" placeholder="補給原因（必填）"
          value={reason} onChange={e => setReason(e.target.value)}
          className="border-2 border-gray-200 rounded-xl px-4 py-3"
        />

        <button
          onClick={submit}
          disabled={!amount || !reason.trim()}
          className="btn-child bg-amber-400 text-white disabled:opacity-40"
        >
          確認送出
        </button>
      </div>
    </div>
  )
}

// ── Reward Shop ────────────────────────────────────────────────────────────

function RewardShop() {
  const { balance, redeemReward } = useApp()
  const [child, setChild] = useState('jasper')

  async function handleRedeem(reward) {
    await redeemReward(child, reward.name, reward.cost)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Child selector */}
      <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-white">
        {[['jasper','👦 Jasper'],['terry','🧒 Terry']].map(([id,label]) => (
          <button
            key={id}
            onClick={() => setChild(id)}
            className={`flex-1 py-3 font-bold text-sm
              ${child === id ? 'bg-amber-400 text-white' : 'text-gray-400'}`}
          >
            {label} ({balance[id]}⭐)
          </button>
        ))}
      </div>

      {/* Reward cards */}
      {REWARDS.map(r => {
        const canAfford = balance[child] >= r.cost
        return (
          <div
            key={r.name}
            className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4"
          >
            <span className="text-4xl">{r.emoji}</span>
            <div className="flex-1">
              <div className="font-bold text-gray-700">{r.name}</div>
              <div className="text-amber-500 font-bold">{r.cost}⭐</div>
            </div>
            <button
              onClick={() => handleRedeem(r)}
              disabled={!canAfford}
              className={`btn-child px-4 text-white text-sm
                ${canAfford ? 'bg-amber-400' : 'bg-gray-200 text-gray-400'}`}
            >
              兌換
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ── AI Lab ─────────────────────────────────────────────────────────────────

// 壓縮圖片：最大 1024px，JPEG 0.75 品質，避免大圖 POST 失敗
function compressImage(dataUrl, maxPx = 1024, quality = 0.75) {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
      const w = Math.round(img.width  * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.src = dataUrl
  })
}

function AILab() {
  const { parseContactBook } = useApp()
  const fileRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [fileSize, setFileSize] = useState(null)

  async function onFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setResult(null)
    const reader = new FileReader()
    reader.onload = async ev => {
      const compressed = await compressImage(ev.target.result)
      setPreview(compressed)
      // 顯示壓縮後大小（KB）
      const kb = Math.round((compressed.length * 0.75) / 1024)
      setFileSize(kb)
    }
    reader.readAsDataURL(file)
  }

  async function analyze() {
    if (!preview) return
    setLoading(true)
    try {
      const base64 = preview.split(',')[1]
      const res = await parseContactBook(base64)
      setResult(res)
    } catch (e) {
      setResult({ error: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl p-4 shadow-sm text-sm text-gray-500 leading-relaxed">
        上傳聯絡簿照片，AI（Gemini）自動辨識今日作業內容。
      </div>

      {/* Upload area */}
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-amber-300 rounded-2xl p-6 flex flex-col items-center gap-2
          text-gray-400 cursor-pointer hover:border-amber-400 transition-colors bg-white"
      >
        {preview
          ? <>
              <img src={preview} alt="preview" className="max-h-48 rounded-xl object-contain" />
              {fileSize && <span className="text-xs text-gray-400">壓縮後約 {fileSize} KB</span>}
            </>
          : <><Upload size={32} className="text-amber-300" /><span>點擊上傳照片</span></>}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      </div>

      <button
        onClick={analyze}
        disabled={!preview || loading}
        className="btn-child bg-purple-500 text-white disabled:opacity-40 gap-2"
      >
        {loading ? <><Loader size={18} className="animate-spin" /> 辨識中…</> : '🔍 AI 解析'}
      </button>

      {/* Result */}
      {result && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="font-bold text-gray-700 mb-2">解析結果</div>
          {result.error
            ? <div className="text-red-500 text-sm">{result.error}</div>
            : result.tasks
              ? (
                <div className="flex flex-col gap-2">
                  {result.tasks.map((t, i) => (
                    <div key={i} className="bg-blue-50 rounded-xl px-3 py-2">
                      <span className="font-bold text-blue-700">{t.subject}</span>
                      <span className="text-gray-600 ml-2 text-sm">{t.description}</span>
                    </div>
                  ))}
                </div>
              )
              : <pre className="text-xs text-gray-500 whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>}
        </div>
      )}
    </div>
  )
}

// ── Parent Dashboard ───────────────────────────────────────────────────────

export default function ParentDashboard() {
  const { logout } = useApp()
  const [tab, setTab] = useState('supply')

  return (
    <div className="flex flex-col flex-1 pb-8">
      {/* Header */}
      <div className="bg-slate-400 px-4 pt-6 pb-4 rounded-b-3xl shadow-md flex items-center justify-between">
        <div>
          <div className="text-white font-black text-xl">🔐 家長專區</div>
          <div className="text-gray-400 text-xs">Hero's Quest 管理後台</div>
        </div>
        <button onClick={logout} className="text-gray-400 p-2">
          <LogOut size={20} />
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-200 bg-white shadow-sm">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-bold transition-colors
              ${tab === id ? 'text-amber-500 border-b-2 border-amber-400' : 'text-gray-400'}`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-4 pt-4">
        {tab === 'supply' && <StarSupply />}
        {tab === 'shop'   && <RewardShop />}
        {tab === 'ai'     && <AILab />}
      </div>
    </div>
  )
}
