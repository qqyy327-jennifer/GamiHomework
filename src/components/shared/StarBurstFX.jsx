// 全螢幕星星爆炸特效
const STARS = ['⭐','🌟','✨','💫']

export default function StarBurstFX() {
  const particles = Array(12).fill(0).map((_, i) => {
    const angle  = (i / 12) * 360
    const dist   = 80 + Math.random() * 60
    const size   = 20 + Math.floor(Math.random() * 24)
    const delay  = Math.random() * 0.2
    const icon   = STARS[i % STARS.length]
    return { angle, dist, size, delay, icon }
  })

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute animate-starPop"
          style={{
            fontSize: p.size,
            animationDelay: `${p.delay}s`,
            transform: `rotate(${p.angle}deg) translateY(-${p.dist}px)`,
          }}
        >
          {p.icon}
        </div>
      ))}
      <div className="text-5xl animate-bounce2">⭐</div>
    </div>
  )
}
