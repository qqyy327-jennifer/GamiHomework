import { useApp } from '../../contexts/AppContext'

export default function StreakBar() {
  const { streak, config } = useApp()
  const target = config.streakTarget || 5

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-mario-brown text-sm">🔥 連續挑戰</span>
        <span className="text-mario-red font-bold">{streak}/{target} 天</span>
      </div>

      {/* 進度格 */}
      <div className="flex gap-2">
        {Array(target).fill(0).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-8 rounded-xl flex items-center justify-center text-lg transition-all duration-300
              ${i < streak
                ? 'bg-mario-yellow shadow-inner scale-105'
                : 'bg-gray-100'}`}
          >
            {i < streak ? '⭐' : '○'}
          </div>
        ))}
      </div>

      {streak >= target && (
        <p className="text-center mt-2 text-mario-red font-bold animate-bounce2">
          🌟 超級星星解鎖！快叫爸媽！
        </p>
      )}
    </div>
  )
}
