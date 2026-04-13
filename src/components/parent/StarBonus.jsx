import { useState } from 'react'
import { useApp, CHILDREN } from '../../contexts/AppContext'

const QUICK_AMOUNTS = [1, 2, 3, 5]

export default function StarBonus() {
  const { apiPost, showToast } = useApp()

  const todayLocal = () => new Date().toLocaleDateString('sv-SE')   // yyyy-MM-dd

  const [child,  setChild]  = useState('jasper')
  const [date,   setDate]   = useState(todayLocal)
  const [amount, setAmount] = useState(1)
  const [custom, setCustom] = useState('')     // 自訂顆數輸入框
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [log, setLog] = useState([])           // 本次 session 的補給紀錄

  const finalAmount = custom !== '' ? Number(custom) : amount

  const handleSubmit = async () => {
    if (finalAmount <= 0 || isNaN(finalAmount)) {
      showToast('請輸入有效的星星數！', 'error')
      return
    }
    if (!reason.trim()) {
      showToast('請填寫補給原因！', 'error')
      return
    }
    setLoading(true)
    try {
      const res = await apiPost({
        action: 'addStarBonus',
        child_id: child,
        amount:     finalAmount,
        reason:     reason.trim(),
        bonusDate:  date,
      })
      if (res.ok) {
        setLog(prev => [{
          child, date, amount: finalAmount, reason: reason.trim(),
          balance: res.balance,
        }, ...prev].slice(0, 10))
        showToast(`已補給 ${CHILDREN[child].name} ${finalAmount} 顆星星 ⭐`, 'success')
        setReason('')
        setCustom('')
        setAmount(1)
        setDate(todayLocal())
      } else {
        showToast(res.error || '補給失敗', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <h2 className="font-bold text-mario-brown text-lg">⭐ 手動補給星星</h2>

      {/* 選孩子 */}
      <div className="flex gap-2">
        {Object.entries(CHILDREN).map(([id, info]) => (
          <button
            key={id}
            onClick={() => setChild(id)}
            className={`flex-1 btn-mario py-3 text-base transition-all
              ${child === id
                ? id === 'jasper'
                  ? 'bg-mario-blue border-mario-blueDark text-white scale-105'
                  : 'bg-mario-green border-mario-greenDk text-white scale-105'
                : 'bg-white border-gray-300 text-gray-500'}`}
          >
            {info.emoji} {info.name}
          </button>
        ))}
      </div>

      {/* 日期 */}
      <div>
        <label className="block text-sm font-bold text-mario-brown mb-1">📅 日期</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-round text-sm focus:outline-none focus:border-mario-blue"
        />
      </div>

      {/* 星星數 */}
      <div>
        <label className="block text-sm font-bold text-mario-brown mb-2">⭐ 補給顆數</label>
        <div className="flex gap-2 mb-2">
          {QUICK_AMOUNTS.map(n => (
            <button
              key={n}
              onClick={() => { setAmount(n); setCustom('') }}
              className={`flex-1 btn-mario py-2 text-base
                ${custom === '' && amount === n
                  ? 'bg-mario-yellow border-mario-yellowDk text-mario-brown scale-105'
                  : 'bg-white border-gray-300 text-gray-600'}`}
            >
              {n}
            </button>
          ))}
        </div>
        <input
          type="number"
          min="1"
          placeholder="自訂顆數…"
          value={custom}
          onChange={e => setCustom(e.target.value)}
          className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-round text-sm focus:outline-none focus:border-mario-yellow"
        />
      </div>

      {/* 原因 */}
      <div>
        <label className="block text-sm font-bold text-mario-brown mb-1">📝 原因</label>
        <input
          type="text"
          placeholder="例：幫忙洗碗、考試進步…"
          value={reason}
          onChange={e => setReason(e.target.value)}
          className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-round text-sm focus:outline-none focus:border-mario-blue"
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />
      </div>

      {/* 送出 */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="btn-mario w-full py-4 bg-mario-yellow border-mario-yellowDk text-mario-brown text-base font-black"
      >
        {loading ? '補給中…' : `✨ 補給 ${finalAmount} 顆給 ${CHILDREN[child].name}`}
      </button>

      {/* 本次補給紀錄 */}
      {log.length > 0 && (
        <div className="mt-2">
          <h3 className="text-sm font-bold text-mario-brown mb-2">本次補給紀錄</h3>
          <div className="space-y-2">
            {log.map((entry, i) => (
              <div key={i} className="card py-2 px-3 flex items-center gap-2 text-sm">
                <span>{CHILDREN[entry.child].emoji}</span>
                <span className="flex-1 text-mario-brown">{entry.reason}</span>
                <span className="text-gray-400 text-xs">{entry.date}</span>
                <span className="font-black text-mario-yellow">+{entry.amount}⭐</span>
                <span className="text-xs text-gray-400">餘{entry.balance}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
