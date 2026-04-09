export default function Toast({ msg, type = 'info' }) {
  const colors = {
    success: 'bg-mario-green text-white',
    error:   'bg-mario-red text-white',
    info:    'bg-mario-blue text-white',
  }
  return (
    <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50
      ${colors[type]} px-6 py-3 rounded-2xl shadow-xl
      text-sm font-bold animate-starPop whitespace-nowrap`}>
      {msg}
    </div>
  )
}
