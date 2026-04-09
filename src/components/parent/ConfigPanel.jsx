import { useState, useEffect } from 'react'
import { useApp } from '../../contexts/AppContext'

export default function ConfigPanel() {
  const { apiGet, apiPost, showToast } = useApp()
  const [rewards, setRewards]   = useState([])
  const [gasUrl,  setGasUrl]    = useState(import.meta.env.VITE_GAS_URL || '')
  const [saved,   setSaved]     = useState(false)

  useEffect(() => {
    apiGet('getRewards').then(res => setRewards(res.rewards || []))
  }, [])

  const updateRewardCost = async (id, cost) => {
    await apiPost({ action: 'updateReward', id, cost: Number(cost) })
    setRewards(rs => rs.map(r => r.id === id ? { ...r, cost: Number(cost) } : r))
  }

  const toggleReward = async (id, active) => {
    await apiPost({ action: 'updateReward', id, active })
    setRewards(rs => rs.map(r => r.id === id ? { ...r, active } : r))
  }

  return (
    <div className="space-y-5">
      <h2 className="font-bold text-mario-brown text-lg">⚙️ 設定</h2>

      {/* 獎勵管理 */}
      <div className="card">
        <h3 className="font-bold text-mario-brown mb-3">🛒 獎勵設定</h3>
        <div className="space-y-3">
          {rewards.map(r => (
            <div key={r.id} className="flex items-center gap-3">
              <span className="text-2xl w-8">{r.icon}</span>
              <span className="flex-1 text-mario-brown font-bold text-sm">{r.label}</span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400">⭐</span>
                <input
                  type="number"
                  defaultValue={r.cost}
                  onBlur={e => updateRewardCost(r.id, e.target.value)}
                  className="w-14 border-2 border-mario-yellow/40 rounded-lg px-2 py-1 text-center text-sm font-bold"
                  min="1"
                />
              </div>
              <button
                onClick={() => toggleReward(r.id, !r.active)}
                className={`w-10 h-6 rounded-full transition-colors ${r.active ? 'bg-mario-green' : 'bg-gray-200'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5
                  ${r.active ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* GAS URL 設定說明 */}
      <div className="card bg-mario-blue/5 border-2 border-mario-blue/20">
        <h3 className="font-bold text-mario-brown mb-2">🔗 後端 API 設定</h3>
        <p className="text-xs text-gray-500 mb-3">
          在專案根目錄建立 <code className="bg-gray-100 px-1 rounded">.env</code> 檔案，加入：
        </p>
        <code className="block bg-gray-100 rounded-xl p-3 text-xs text-mario-brown break-all">
          VITE_GAS_URL=https://script.google.com/macros/s/你的部署ID/exec
        </code>
        <p className="text-xs text-gray-400 mt-2">
          部署 GAS 後，將 Web App URL 填入即可。
        </p>
      </div>

      {/* 初始化說明 */}
      <div className="card bg-mario-yellow/10 border-2 border-mario-yellow/30">
        <h3 className="font-bold text-mario-brown mb-2">📋 Google Sheets 初始化</h3>
        <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
          <li>打開 Google Apps Script 編輯器</li>
          <li>貼上 <code>gas/Code.gs</code> 的程式碼</li>
          <li>手動執行 <code>initializeSheets()</code> 一次</li>
          <li>在 Config 工作表填入 <code>drive_folder_id</code> 與 <code>gemini_api_key</code></li>
          <li>部署為 Web App，將 URL 填入 .env 檔案</li>
        </ol>
      </div>
    </div>
  )
}
