import { useApp } from '../../contexts/AppContext.jsx'

export default function Toast() {
  const { toast } = useApp()
  if (!toast) return null

  const bg = toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl
        text-white font-bold text-sm shadow-lg pointer-events-none
        animate-bounce ${bg}`}
    >
      {toast.msg}
    </div>
  )
}
