import { useState, useEffect } from 'react'
import { useApp } from '../../contexts/AppContext'

export default function StarExchange() {
  const { stars, spendStars, apiGet, showToast } = useApp()
  const [rewards, setRewards]     = useState([])
  const [confirming, setConfirming] = useState(null)  // reward object

  useEffect(() => {
    apiGet('getRewards').then(res => setRewards(res.rewards || []))
  }, [])

  const handleRedeem = async (reward) => {
    if (stars < reward.cost) {
      showToast(`還差 ${reward.cost - stars} 顆星星！繼續加油！`, 'error')
      return
    }
    setConfirming(reward)
  }

  const confirmRedeem = async () => {
    if (!confirming) return
    const res = await spendStars(confirming.cost, `兌換：${confirming.label}`)
    if (res.ok) {
      showToast(`成功兌換「${confirming.label}」！記得叫爸媽確認喔～`, 'success')
    } else {
      showToast(res.error || '兌換失敗', 'error')
    }
    setConfirming(null)
  }

  return (
    <div className="space-y-4">
      <div className="card flex items-center gap-3 bg-mario-yellow/20 border-2 border-mario-yellow">
        <span className="text-4xl animate-float">⭐</span>
        <div>
          <p className="text-xs text-mario-brown">我的星星</p>
          <p className="font-mario text-mario-red text-2xl">{stars}</p>
        </div>
      </div>

      <h2 className="font-bold text-mario-brown text-lg">🛒 星星商店</h2>

      <div className="space-y-3">
        {rewards.map(r => (
          <div key={r.id} className="card flex items-center gap-4">
            <span className="text-4xl">{r.icon}</span>
            <div className="flex-1">
              <p className="font-bold text-mario-brown">{r.label}</p>
              <p className="text-mario-coin font-bold text-sm">{r.cost} ⭐</p>
            </div>
            <button
              onClick={() => handleRedeem(r)}
              disabled={stars < r.cost}
              className={`btn-mario px-4 py-2 text-sm
                ${stars >= r.cost ? 'bg-mario-red' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              {stars >= r.cost ? '兌換！' : '不夠'}
            </button>
          </div>
        ))}
      </div>

      {/* 確認 Dialog */}
      {confirming && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 px-6">
          <div className="card w-full max-w-xs text-center">
            <div className="text-5xl mb-3">{confirming.icon}</div>
            <h3 className="font-bold text-mario-brown text-xl mb-1">{confirming.label}</h3>
            <p className="text-mario-coin font-bold mb-4">花費 {confirming.cost} ⭐</p>
            <p className="text-gray-500 text-sm mb-5">要叫爸媽確認後才算喔！</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirming(null)} className="btn-mario flex-1 py-3 bg-gray-200 text-gray-600">取消</button>
              <button onClick={confirmRedeem} className="btn-mario flex-1 py-3 bg-mario-red">確定！</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
