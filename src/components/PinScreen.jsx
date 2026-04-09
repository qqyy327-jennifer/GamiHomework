import { useState } from 'react'
import { useApp } from '../contexts/AppContext'

const KEYS = ['1','2','3','4','5','6','7','8','9','⌫','0','✓']

const ROLES = [
  { id: 'jasper', label: 'Jasper', emoji: '🧒' },
  { id: 'terry',  label: 'Terry',  emoji: '👦' },
  { id: 'parent', label: '爸媽',   emoji: '👨‍👩‍👧' },
]

export default function PinScreen() {
  const { login, showToast } = useApp()
  const [pin, setPin]         = useState('')
  const [role, setRole]       = useState('jasper')
  const [shaking, setShaking] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleKey = async (k) => {
    if (k === '⌫') { setPin(p => p.slice(0, -1)); return }
    if (k === '✓') { await submit(); return }
    if (pin.length >= 6) return
    const next = pin + k
    setPin(next)
    if (next.length === 4) await submit(next)
  }

  const submit = async (p = pin) => {
    if (p.length < 4) { showToast('請輸入4位密碼', 'error'); return }
    setLoading(true)
    const res = await login(p, role)
    setLoading(false)
    if (!res.ok) {
      setShaking(true)
      setPin('')
      showToast(res.error || '密碼錯誤！', 'error')
      setTimeout(() => setShaking(false), 500)
    }
  }

  const selected = ROLES.find(r => r.id === role)

  const dots = Array(4).fill(0).map((_, i) => (
    <div
      key={i}
      className={`w-5 h-5 rounded-full border-4 transition-all duration-150
        ${i < pin.length ? 'bg-mario-yellow border-mario-yellow scale-110' : 'bg-transparent border-white/60'}`}
    />
  ))

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-mario-sky">

      {/* 雲朵裝飾 */}
      <div className="absolute top-10 left-4 text-5xl opacity-90 select-none">☁️</div>
      <div className="absolute top-20 right-6 text-3xl opacity-80 select-none">☁️</div>

      {/* 標題 */}
      <div className="text-center mb-6 relative z-10">
        <div className="text-6xl mb-3 animate-bounce2 drop-shadow-lg">⭐</div>
        <h1 className="font-round font-black text-mario-yellow text-3xl tracking-widest drop-shadow-[0_3px_0_#C8860A]">
          作業闖關
        </h1>
      </div>

      {/* 角色選擇 */}
      <div className="flex gap-2 mb-5 relative z-10">
        {ROLES.map(r => (
          <button
            key={r.id}
            onClick={() => { setRole(r.id); setPin('') }}
            className={`flex flex-col items-center px-4 py-2 rounded-xl border-b-4 font-bold text-sm transition-all active:border-b-0 active:translate-y-1
              ${role === r.id
                ? 'bg-mario-red border-mario-redDark text-white scale-105'
                : 'bg-white/30 border-white/20 text-white'}`}
          >
            <span className="text-2xl">{r.emoji}</span>
            <span>{r.label}</span>
          </button>
        ))}
      </div>

      {/* PIN 顯示 */}
      <div
        className={`mb-5 w-full max-w-xs bg-mario-brown/80 rounded-2xl border-4 border-mario-yellowDk px-6 py-4 relative z-10
          ${shaking ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}
        style={shaking ? { animation: 'shake 0.4s ease-in-out' } : {}}
      >
        <p className="text-center text-mario-yellow/80 text-sm mb-3 font-bold">
          {selected?.emoji} {selected?.label} 的密碼
        </p>
        <div className="flex justify-center gap-5">
          {dots}
        </div>
      </div>

      {/* 數字鍵盤 */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs relative z-10">
        {KEYS.map(k => (
          <button
            key={k}
            onClick={() => handleKey(k)}
            disabled={loading}
            className={`h-16 font-black text-xl rounded-xl border-b-4 transition-all
                        active:border-b-0 active:translate-y-1 flex items-center justify-center
              ${k === '✓' ? 'bg-mario-green  border-mario-greenDk  text-white'
              : k === '⌫' ? 'bg-mario-red    border-mario-redDark  text-white'
              :              'bg-mario-yellow border-mario-yellowDk text-mario-brown'}
              ${loading ? 'opacity-50' : ''}`}
          >
            {k}
          </button>
        ))}
      </div>

      {/* 地板裝飾 */}
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-mario-ground border-t-4 border-mario-yellowDk" />

      {!import.meta.env.VITE_GAS_URL && (
        <p className="mt-6 text-white/60 text-xs text-center relative z-10">
          開發模式：任意密碼均可登入
        </p>
      )}

      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-8px)}
          40%{transform:translateX(8px)}
          60%{transform:translateX(-6px)}
          80%{transform:translateX(6px)}
        }
      `}</style>
    </div>
  )
}
