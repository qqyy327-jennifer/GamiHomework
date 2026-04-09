import { createContext, useContext, useState, useCallback } from 'react'

const GAS_URL = import.meta.env.VITE_GAS_URL || ''

// 孩子設定
export const CHILDREN = {
  jasper: { name: 'Jasper', emoji: '🧒', color: 'mario-blue' },
  terry:  { name: 'Terry',  emoji: '👦', color: 'mario-green' },
}

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [role, setRole]           = useState(null)      // 'jasper' | 'terry' | 'parent' | null
  const [stars, setStars]         = useState(0)
  const [streak, setStreak]       = useState(0)
  const [tasks, setTasks]         = useState([])
  const [config, setConfig]       = useState({})
  const [loading, setLoading]     = useState(false)
  const [toast, setToast]         = useState(null)
  const [starBurst, setStarBurst] = useState(false)

  // 計算屬性
  const isParent = role === 'parent'
  const childId  = isParent ? null : role                     // 'jasper' | 'terry'
  const childInfo = childId ? CHILDREN[childId] : null

  // ── API ─────────────────────────────────────────────────────

  const apiGet = useCallback(async (action, params = {}) => {
    const qs = new URLSearchParams({ action, ...params }).toString()
    const res = await fetch(`${GAS_URL}?${qs}`)
    return res.json()
  }, [])

  const apiPost = useCallback(async (body) => {
    const res = await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return res.json()
  }, [])

  // ── 載入資料（依 childId 過濾）──────────────────────────────

  const loadAll = useCallback(async (cid) => {
    if (!GAS_URL) return
    const id = cid || childId
    if (!id) return
    setLoading(true)
    try {
      const [tasksRes, starsRes, streakRes, configRes] = await Promise.all([
        apiGet('getTodayTasks', { child_id: id }),
        apiGet('getStarBalance', { child_id: id }),
        apiGet('getStreak', { child_id: id }),
        apiGet('getConfig'),
      ])
      setTasks(tasksRes.tasks || [])
      setStars(starsRes.balance || 0)
      setStreak(streakRes.streak || 0)
      setConfig(configRes || {})
    } finally {
      setLoading(false)
    }
  }, [apiGet, childId])

  // ── 家長載入全部兩個孩子的待審核任務 ──────────────────────

  const loadParentTasks = useCallback(async () => {
    if (!GAS_URL) return
    setLoading(true)
    try {
      const [jasperRes, terryRes, configRes] = await Promise.all([
        apiGet('getTodayTasks', { child_id: 'jasper' }),
        apiGet('getTodayTasks', { child_id: 'terry' }),
        apiGet('getConfig'),
      ])
      const combined = [
        ...(jasperRes.tasks || []).map(t => ({ ...t, childId: 'jasper' })),
        ...(terryRes.tasks  || []).map(t => ({ ...t, childId: 'terry'  })),
      ]
      setTasks(combined)
      setConfig(configRes || {})
    } finally {
      setLoading(false)
    }
  }, [apiGet])

  // ── 登入 ────────────────────────────────────────────────────

  const login = useCallback(async (pin, targetRole) => {
    if (!GAS_URL) {
      setRole(targetRole)
      return { ok: true }
    }
    const res = await apiPost({ action: 'checkPin', pin, role: targetRole })
    if (res.ok) {
      setRole(targetRole)
      if (targetRole === 'parent') {
        await loadParentTasks()
      } else {
        await loadAll(targetRole)
      }
    }
    return res
  }, [apiPost, loadAll, loadParentTasks])

  const logout = () => {
    setRole(null)
    setTasks([])
    setStars(0)
    setStreak(0)
  }

  // ── 任務操作 ─────────────────────────────────────────────────

  const completeTask = useCallback(async (rowId, fileUrl) => {
    const res = await apiPost({ action: 'completeTask', rowId, fileUrl, child_id: childId })
    if (res.ok) {
      setStars(s => s + (res.starsAwarded || 0))
      setTasks(prev => prev.map(t => t.rowId === rowId ? { ...t, status: 'done' } : t))
      triggerStarBurst()
      showToast(`獲得 ${res.starsAwarded} 顆星星！⭐`, 'success')
    }
    return res
  }, [apiPost, childId])

  const spendStars = useCallback(async (amount, reason) => {
    const res = await apiPost({ action: 'spendStars', amount, reason, child_id: childId })
    if (res.ok) setStars(res.balance)
    return res
  }, [apiPost, childId])

  const saveSubjects = useCallback(async (subjects) => {
    const res = await apiPost({ action: 'saveSubjects', subjects, child_id: childId })
    if (res.ok) await loadAll()
    return res
  }, [apiPost, childId, loadAll])

  const uploadFile = useCallback(async (file, subfolder) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target.result.split(',')[1]
        const res = await apiPost({
          action: 'uploadFile',
          base64,
          mimeType: file.type,
          filename: file.name,
          subfolder,
        })
        resolve(res)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }, [apiPost])

  // ── UI 輔助 ──────────────────────────────────────────────────

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  const triggerStarBurst = () => {
    setStarBurst(true)
    setTimeout(() => setStarBurst(false), 800)
  }

  const value = {
    role, isParent, childId, childInfo,
    login, logout,
    stars, streak, tasks, config,
    loading, toast, starBurst,
    loadAll, loadParentTasks, completeTask, spendStars, saveSubjects, uploadFile,
    showToast, triggerStarBurst,
    apiGet, apiPost,
    GAS_READY: !!GAS_URL,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
