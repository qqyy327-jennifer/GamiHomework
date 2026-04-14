import { useState } from 'react'
import { useApp } from '../contexts/AppContext.jsx'
import { Star, Shield } from 'lucide-react'
import { JasperAvatar, TerryAvatar } from './shared/Avatars.jsx'

const CHILD_PIN  = import.meta.env.VITE_CHILD_PIN  || '1234'
const PARENT_PIN = import.meta.env.VITE_PARENT_PIN || '5678'

export default function PinScreen() {
  const { setRole, DEV } = useApp()
  const [mode, setMode] = useState('child')   // 'child' | 'parent'
  const [pin, setPin]   = useState('')
  const [shake, setShake] = useState(false)

  function press(digit) {
    if (pin.length >= 4) return
    const next = pin + digit
    setPin(next)
    if (next.length === 4) verify(next)
  }

  function verify(entered) {
    const correct = mode === 'child' ? CHILD_PIN : PARENT_PIN
    // Dev mode: any PIN works
    if (DEV || entered === correct) {
      setRole(mode)
    } else {
      setShake(true)
      setTimeout(() => { setShake(false); setPin('') }, 600)
    }
  }

  function del() { setPin(p => p.slice(0, -1)) }

  const digits = [1,2,3,4,5,6,7,8,9,'',0,'⌫']

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-8 px-6 py-12">
      {/* Mode toggle */}
      <div className="flex rounded-2xl overflow-hidden shadow-sm bg-white">
        {['child','parent'].map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setPin('') }}
            className={`flex items-center gap-2 px-6 py-3 font-bold text-sm transition-colors
              ${mode === m ? 'bg-amber-400 text-white' : 'text-gray-400'}`}
          >
            {m === 'child'
              ? <><Star size={16} /> 小英雄</>
              : <><Shield size={16} /> 家長</>}
          </button>
        ))}
      </div>

      {/* Title */}
      <div className="text-center">
        <div className="flex justify-center gap-3 mb-2">
          {mode === 'child'
            ? <><JasperAvatar size={52} /><TerryAvatar size={52} /></>
            : <span className="text-5xl">🔐</span>}
        </div>
        <div className="text-xl font-bold text-gray-700">
          {mode === 'child' ? '歡迎回來，小英雄！' : '家長專區'}
        </div>
        {DEV && <div className="text-xs text-orange-400 mt-1">DEV 模式（任意 PIN 可進入）</div>}
      </div>

      {/* PIN dots */}
      <div className={`flex gap-4 ${shake ? 'animate-bounce' : ''}`}>
        {[0,1,2,3].map(i => (
          <div
            key={i}
            className={`w-5 h-5 rounded-full border-2 transition-colors
              ${i < pin.length
                ? 'bg-amber-400 border-amber-400'
                : 'border-gray-300 bg-white'}`}
          />
        ))}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {digits.map((d, i) => {
          if (d === '') return <div key={i} />
          const isBack = d === '⌫'
          return (
            <button
              key={i}
              onClick={() => isBack ? del() : press(String(d))}
              className={`btn-child text-2xl font-bold
                ${isBack
                  ? 'bg-gray-100 text-gray-500'
                  : 'bg-white text-gray-700 shadow-sm active:bg-amber-50'}`}
            >
              {d}
            </button>
          )
        })}
      </div>
    </div>
  )
}
