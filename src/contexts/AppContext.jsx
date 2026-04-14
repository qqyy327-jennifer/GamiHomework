import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'

const GAS_URL = import.meta.env.VITE_GAS_URL || ''
const DEV = !GAS_URL

const CTX = createContext(null)
export const useApp = () => useContext(CTX)

// ── Default tasks for dev/mock mode ───────────────────────────────────────

function mockTasks(child) {
  // 學科由 quick-pick chips 手動新增，defaultTasks 只保留家事
  void child
  return [
    { taskName: '整理書包', taskType: 'daily',  value: 1, status: 'Pending', extra: '' },
    { taskName: '擦桌子',   taskType: 'chore',   value: 1, status: 'Pending', extra: '' },
    { taskName: '摺衣服',   taskType: 'chore',   value: 1, status: 'Pending', extra: '' },
    { taskName: '掃樓梯',   taskType: 'chore',   value: 1, status: 'Pending', extra: '' },
    { taskName: '收玩具',   taskType: 'chore',   value: 1, status: 'Pending', extra: '' },
  ]
}

function todayStr() {
  const d = new Date()
  const mm = d.getMonth() + 1
  const dd = d.getDate()
  return `${d.getFullYear()}-${mm < 10 ? '0'+mm : mm}-${dd < 10 ? '0'+dd : dd}`
}

// ── API helpers ────────────────────────────────────────────────────────────

async function gasGet(params) {
  const qs = new URLSearchParams(params)
  const r = await fetch(`${GAS_URL}?${qs}`)
  const data = await r.json()
  return data ?? {}
}

async function gasPost(body) {
  const r = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await r.json()
  return data ?? {}
}

// ── Provider ──────────────────────────────────────────────────────────────

export function AppProvider({ children }) {
  const [role, setRole] = useState(null)
  const [currentChild, setCurrentChild] = useState('jasper')
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [tasks, setTasks] = useState({ jasper: [], terry: [] })
  const [balance, setBalance] = useState({ jasper: 0, terry: 0 })
  const [streak, setStreak] = useState({ jasper: 0, terry: 0 })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  // ── Toast ────────────────────────────────────────────────────────────────

  const showToast = useCallback((msg, type = 'success') => {
    clearTimeout(toastTimer.current)
    setToast({ msg, type })
    toastTimer.current = setTimeout(() => setToast(null), 2500)
  }, [])

  // ── Load tasks ───────────────────────────────────────────────────────────

  const loadTasks = useCallback(async (child, date) => {
    if (DEV) {
      setTasks(prev => ({ ...prev, [child]: mockTasks(child) }))
      return
    }
    setLoading(true)
    try {
      const res = await gasGet({ action: 'getTasks', child, date })
      if (res?.tasks) setTasks(prev => ({ ...prev, [child]: res.tasks }))
    } catch (e) {
      showToast('載入失敗', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  // ── Load balance + streak ─────────────────────────────────────────────────

  const loadBalance = useCallback(async (child) => {
    if (DEV) return
    try {
      const [b, s] = await Promise.all([
        gasGet({ action: 'getBalance', child }),
        gasGet({ action: 'getStreak', child }),
      ])
      if (b?.balance !== undefined) setBalance(prev => ({ ...prev, [child]: b.balance }))
      if (s?.streak  !== undefined) setStreak(prev =>  ({ ...prev, [child]: s.streak  }))
    } catch (_) {}
  }, [])

  // ── Complete task ─────────────────────────────────────────────────────────

  const completeTask = useCallback(async (child, date, taskName, extra) => {
    const childTasks = tasks[child] || []
    const task = childTasks.find(t => t.taskName === taskName)
    if (!task || task.status === 'Completed') return null

    // Optimistic update
    setTasks(prev => ({
      ...prev,
      [child]: prev[child].map(t =>
        t.taskName === taskName ? { ...t, status: 'Completed', extra: extra || '' } : t
      ),
    }))
    setBalance(prev => ({ ...prev, [child]: prev[child] + task.value }))

    if (DEV) return { stars: task.value, streakBonus: 0 }

    try {
      const res = await gasPost({
        action: 'completeTask', child, date,
        taskName: task.taskName, taskType: task.taskType,
        value: task.value, extra: extra || '',
      })
      if (res?.streakBonus > 0) {
        setBalance(prev => ({ ...prev, [child]: prev[child] + res.streakBonus }))
        setStreak(prev => ({ ...prev, [child]: 5 }))
        showToast(`🎉 連續5天達成！+${res.streakBonus}⭐`, 'success')
      }
      await loadBalance(child)
      return res
    } catch (_) {
      return { stars: task.value, streakBonus: 0 }
    }
  }, [tasks, loadBalance, showToast])

  // ── Uncomplete task ────────────────────────────────────────────────────────

  const uncompleteTask = useCallback(async (child, date, taskName) => {
    const task = (tasks[child] || []).find(t => t.taskName === taskName)
    if (!task || task.status === 'Pending') return

    setTasks(prev => ({
      ...prev,
      [child]: prev[child].map(t =>
        t.taskName === taskName ? { ...t, status: 'Pending', extra: '' } : t
      ),
    }))
    setBalance(prev => ({ ...prev, [child]: Math.max(0, prev[child] - task.value) }))

    if (!DEV) {
      await gasPost({ action: 'uncompleteTask', child, date, taskName })
      await loadBalance(child)
    }
  }, [tasks, loadBalance])

  // ── Add custom task ────────────────────────────────────────────────────────

  const addCustomTask = useCallback(async (child, date, taskName) => {
    const newTask = { taskName, taskType: 'custom', value: 1, status: 'Pending', extra: '' }
    setTasks(prev => ({ ...prev, [child]: [...prev[child], newTask] }))

    if (!DEV) {
      await gasPost({ action: 'addCustomTask', child, date, taskName })
    }
    return newTask
  }, [])

  // ── Parent: manual star ────────────────────────────────────────────────────

  const addManualStar = useCallback(async (child, amount, reason) => {
    setBalance(prev => ({ ...prev, [child]: Math.max(0, prev[child] + amount) }))
    if (!DEV) await gasPost({ action: 'addManualStar', child, amount, reason })
    showToast(`${amount > 0 ? '+' : ''}${amount}⭐ 已記錄`, 'success')
  }, [showToast])

  // ── Parent: redeem reward ─────────────────────────────────────────────────

  const redeemReward = useCallback(async (child, rewardName, cost) => {
    if (balance[child] < cost) {
      showToast('星星不足', 'error')
      return false
    }
    setBalance(prev => ({ ...prev, [child]: prev[child] - cost }))
    if (!DEV) await gasPost({ action: 'redeemReward', child, rewardName, cost })
    showToast(`🎁 兌換成功：${rewardName}`, 'success')
    return true
  }, [balance, showToast])

  // ── Parent: AI contact book parse ─────────────────────────────────────────

  const parseContactBook = useCallback(async (imageBase64) => {
    if (DEV) return { tasks: [{ subject: '國語', description: '第12頁寫生字' }, { subject: '數學', description: '第8頁計算' }] }
    const res = await gasPost({ action: 'parseContactBook', imageBase64 })
    return res
  }, [])

  // ── Load on child/date change ─────────────────────────────────────────────

  useEffect(() => {
    if (role === 'child') {
      loadTasks(currentChild, selectedDate)
      loadBalance(currentChild)
    }
  }, [role, currentChild, selectedDate, loadTasks, loadBalance])

  const logout = useCallback(() => {
    setRole(null)
    setCurrentChild('jasper')
    setSelectedDate(todayStr())
  }, [])

  const value = {
    role, setRole,
    currentChild, setCurrentChild,
    selectedDate, setSelectedDate,
    tasks, balance, streak, loading,
    toast, showToast,
    completeTask, uncompleteTask, addCustomTask,
    addManualStar, redeemReward, parseContactBook,
    loadTasks, loadBalance,
    logout,
    DEV,
  }

  return <CTX.Provider value={value}>{children}</CTX.Provider>
}
