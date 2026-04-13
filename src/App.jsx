import { AppProvider, useApp } from './contexts/AppContext.jsx'
import PinScreen from './components/PinScreen.jsx'
import ChildDashboard from './components/child/ChildDashboard.jsx'
import ParentDashboard from './components/parent/ParentDashboard.jsx'
import Toast from './components/shared/Toast.jsx'

function Inner() {
  const { role } = useApp()
  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-md min-h-screen flex flex-col">
        {!role && <PinScreen />}
        {role === 'child'  && <ChildDashboard />}
        {role === 'parent' && <ParentDashboard />}
      </div>
      <Toast />
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
