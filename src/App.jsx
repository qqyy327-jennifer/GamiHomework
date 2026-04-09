import { useEffect } from 'react'
import { AppProvider, useApp } from './contexts/AppContext'
import PinScreen     from './components/PinScreen'
import ChildDashboard  from './components/child/ChildDashboard'
import ParentDashboard from './components/parent/ParentDashboard'
import Toast         from './components/shared/Toast'
import StarBurstFX   from './components/shared/StarBurstFX'

function Inner() {
  const { role, loadAll, loadParentTasks, toast, starBurst } = useApp()

  useEffect(() => {
    if (role === 'parent') loadParentTasks()
    else if (role) loadAll()
  }, [role])

  return (
    <div className="min-h-screen bg-mario-sky">
      {/* 全域動畫 */}
      {starBurst && <StarBurstFX />}
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* 路由邏輯 */}
      {!role                                    && <PinScreen />}
      {(role === 'jasper' || role === 'terry')  && <ChildDashboard />}
      {role === 'parent'                        && <ParentDashboard />}
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Inner />
    </AppProvider>
  )
}
