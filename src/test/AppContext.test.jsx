import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { AppProvider, useApp } from '../contexts/AppContext.jsx'

const wrapper = ({ children }) => <AppProvider>{children}</AppProvider>

// ── 初始狀態 ───────────────────────────────────────────────────────────────

describe('初始狀態', () => {
  it('role 預設為 null', () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    expect(result.current.role).toBeNull()
  })

  it('currentChild 預設為 jasper', () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    expect(result.current.currentChild).toBe('jasper')
  })

  it('jasper 和 terry 星星餘額初始為 0', () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    expect(result.current.balance.jasper).toBe(0)
    expect(result.current.balance.terry).toBe(0)
  })

  it('DEV 模式為 true（測試環境強制空 GAS URL）', () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    expect(result.current.DEV).toBe(true)
  })
})

// ── 任務載入 ───────────────────────────────────────────────────────────────

describe('任務載入（DEV 模式）', () => {
  it('設定 role=child 後載入 jasper 任務', async () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    await act(async () => { result.current.setRole('child') })
    expect(result.current.tasks.jasper.length).toBeGreaterThan(0)
  })

  it('jasper defaultTasks 只包含家事，不包含學科（學科由 chips 新增）', async () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    await act(async () => { result.current.setRole('child') })
    const names = result.current.tasks.jasper.map(t => t.taskName)
    expect(names).not.toContain('國語')
    expect(names).not.toContain('數學')
    expect(names).not.toContain('英文')
    expect(names).not.toContain('跳繩')
  })

  it('jasper 任務包含家事項目', async () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    await act(async () => { result.current.setRole('child') })
    const names = result.current.tasks.jasper.map(t => t.taskName)
    expect(names).toContain('整理書包')
    expect(names).toContain('擦桌子')
  })

  it('terry 任務不包含學科', async () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    await act(async () => {
      result.current.setRole('child')
      result.current.setCurrentChild('terry')
    })
    await act(async () => {})
    const names = result.current.tasks.terry.map(t => t.taskName)
    expect(names).not.toContain('國語')
    expect(names).not.toContain('數學')
    expect(names).not.toContain('英文')
    expect(names).not.toContain('跳繩')
  })

  it('terry 任務包含家事項目', async () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    await act(async () => {
      result.current.setRole('child')
      result.current.setCurrentChild('terry')
    })
    await act(async () => {})
    const names = result.current.tasks.terry.map(t => t.taskName)
    expect(names).toContain('整理書包')
    expect(names).toContain('擦桌子')
  })

  it('所有任務初始狀態為 Pending', async () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    await act(async () => { result.current.setRole('child') })
    const allPending = result.current.tasks.jasper.every(t => t.status === 'Pending')
    expect(allPending).toBe(true)
  })
})

// ── completeTask ────────────────────────────────────────────────────────────

describe('completeTask', () => {
  it('完成家事任務後餘額增加 1', async () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    await act(async () => { result.current.setRole('child') })
    await act(async () => {
      await result.current.completeTask('jasper', '2026-04-13', '整理書包')
    })
    expect(result.current.balance.jasper).toBe(1)
  })

  it('每個任務固定 +1 顆星', async () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    await act(async () => { result.current.setRole('child') })
    await act(async () => {
      await result.current.completeTask('jasper', '2026-04-13', '擦桌子')
    })
    expect(result.current.balance.jasper).toBe(1)
  })

  it('任務狀態更新為 Completed', async () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    await act(async () => { result.current.setRole('child') })
    await act(async () => {
      await result.current.completeTask('jasper', '2026-04-13', '整理書包')
    })
    const task = result.current.tasks.jasper.find(t => t.taskName === '整理書包')
    expect(task.status).toBe('Completed')
  })

  it('重複完成同一任務不會重複加星', async () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    await act(async () => { result.current.setRole('child') })
    await act(async () => { await result.current.completeTask('jasper', '2026-04-13', '整理書包') })
    const bal = result.current.balance.jasper
    await act(async () => { await result.current.completeTask('jasper', '2026-04-13', '整理書包') })
    expect(result.current.balance.jasper).toBe(bal)
  })

  it('完成多個任務累加星星', async () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    await act(async () => { result.current.setRole('child') })
    await act(async () => { await result.current.completeTask('jasper', '2026-04-13', '整理書包') })
    await act(async () => { await result.current.completeTask('jasper', '2026-04-13', '擦桌子') })
    await act(async () => { await result.current.completeTask('jasper', '2026-04-13', '摺衣服') })
    expect(result.current.balance.jasper).toBe(3)
  })

  it('jasper 完成任務不影響 terry 餘額', async () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    await act(async () => { result.current.setRole('child') })
    await act(async () => { await result.current.completeTask('jasper', '2026-04-13', '整理書包') })
    expect(result.current.balance.terry).toBe(0)
  })
})

// ── uncompleteTask ──────────────────────────────────────────────────────────

describe('uncompleteTask', () => {
  it('取消完成後餘額減少', async () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    await act(async () => { result.current.setRole('child') })
    await act(async () => { await result.current.completeTask('jasper', '2026-04-13', '整理書包') })
    const balAfter = result.current.balance.jasper
    await act(async () => { await result.current.uncompleteTask('jasper', '2026-04-13', '整理書包') })
    expect(result.current.balance.jasper).toBe(balAfter - 1)
  })

  it('取消完成後狀態回到 Pending', async () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    await act(async () => { result.current.setRole('child') })
    await act(async () => { await result.current.completeTask('jasper', '2026-04-13', '整理書包') })
    await act(async () => { await result.current.uncompleteTask('jasper', '2026-04-13', '整理書包') })
    const task = result.current.tasks.jasper.find(t => t.taskName === '整理書包')
    expect(task.status).toBe('Pending')
  })

  it('對 Pending 任務呼叫 uncomplete 不改變餘額', async () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    await act(async () => { result.current.setRole('child') })
    const balBefore = result.current.balance.jasper
    await act(async () => { await result.current.uncompleteTask('jasper', '2026-04-13', '整理書包') })
    expect(result.current.balance.jasper).toBe(balBefore)
  })
})

// ── addManualStar ───────────────────────────────────────────────────────────

describe('addManualStar（家長補給）', () => {
  it('增加星星', async () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    await act(async () => { await result.current.addManualStar('jasper', 5, '表現很棒') })
    expect(result.current.balance.jasper).toBe(5)
  })

  it('扣除星星（負數）', async () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    await act(async () => { await result.current.addManualStar('jasper', 10, '獎勵') })
    await act(async () => { await result.current.addManualStar('jasper', -3, '扣除') })
    expect(result.current.balance.jasper).toBe(7)
  })

  it('只影響指定孩子', async () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    await act(async () => { await result.current.addManualStar('jasper', 5, '給 Jasper') })
    expect(result.current.balance.terry).toBe(0)
  })

  it('可以分別給兩個孩子加星', async () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    await act(async () => { await result.current.addManualStar('jasper', 3, '給 Jasper') })
    await act(async () => { await result.current.addManualStar('terry', 7, '給 Terry') })
    expect(result.current.balance.jasper).toBe(3)
    expect(result.current.balance.terry).toBe(7)
  })
})

// ── redeemReward ────────────────────────────────────────────────────────────

describe('redeemReward（兌換獎勵）', () => {
  it('星星不足時回傳 false', async () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    let ok
    await act(async () => { ok = await result.current.redeemReward('jasper', '玩桌遊', 5) })
    expect(ok).toBe(false)
    expect(result.current.balance.jasper).toBe(0)
  })

  it('星星足夠時回傳 true 並扣除', async () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    await act(async () => { await result.current.addManualStar('jasper', 10, '充值') })
    let ok
    await act(async () => { ok = await result.current.redeemReward('jasper', '玩桌遊', 5) })
    expect(ok).toBe(true)
    expect(result.current.balance.jasper).toBe(5)
  })

  it('星星恰好差一顆時失敗', async () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    await act(async () => { await result.current.addManualStar('jasper', 4, '充值') })
    let ok
    await act(async () => { ok = await result.current.redeemReward('jasper', '玩桌遊', 5) })
    expect(ok).toBe(false)
    expect(result.current.balance.jasper).toBe(4)
  })

  it('星星恰好夠時成功', async () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    await act(async () => { await result.current.addManualStar('jasper', 5, '充值') })
    let ok
    await act(async () => { ok = await result.current.redeemReward('jasper', '玩桌遊', 5) })
    expect(ok).toBe(true)
    expect(result.current.balance.jasper).toBe(0)
  })

  it('兌換不影響另一個孩子', async () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    await act(async () => { await result.current.addManualStar('jasper', 10, 'J') })
    await act(async () => { await result.current.addManualStar('terry', 8, 'T') })
    await act(async () => { await result.current.redeemReward('jasper', '玩桌遊', 5) })
    expect(result.current.balance.terry).toBe(8)
  })
})

// ── addCustomTask ───────────────────────────────────────────────────────────

describe('addCustomTask（自訂任務）', () => {
  it('新增自訂任務到清單', async () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    await act(async () => { result.current.setRole('child') })
    const countBefore = result.current.tasks.jasper.length
    await act(async () => { await result.current.addCustomTask('jasper', '2026-04-13', '幫忙洗碗') })
    expect(result.current.tasks.jasper.length).toBe(countBefore + 1)
  })

  it('自訂任務屬性正確（value=1）', async () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    await act(async () => { result.current.setRole('child') })
    await act(async () => { await result.current.addCustomTask('jasper', '2026-04-13', '幫忙洗碗') })
    const task = result.current.tasks.jasper.find(t => t.taskName === '幫忙洗碗')
    expect(task).toBeDefined()
    expect(task.taskType).toBe('custom')
    expect(task.value).toBe(1)
    expect(task.status).toBe('Pending')
  })

  it('自訂任務完成後得 1 顆星', async () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    await act(async () => { result.current.setRole('child') })
    await act(async () => { await result.current.addCustomTask('jasper', '2026-04-13', '幫忙洗碗') })
    await act(async () => { await result.current.completeTask('jasper', '2026-04-13', '幫忙洗碗') })
    expect(result.current.balance.jasper).toBe(1)
  })
})

// ── removeTask ──────────────────────────────────────────────────────────────

describe('removeTask（移除任務）', () => {
  it('移除後任務從清單消失', async () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    await act(async () => { result.current.setRole('child') })
    await act(async () => { await result.current.addCustomTask('jasper', '2026-04-13', '測試任務') })
    const countBefore = result.current.tasks.jasper.length
    await act(async () => { await result.current.removeTask('jasper', '2026-04-13', '測試任務') })
    expect(result.current.tasks.jasper.length).toBe(countBefore - 1)
    expect(result.current.tasks.jasper.find(t => t.taskName === '測試任務')).toBeUndefined()
  })
})

// ── logout ──────────────────────────────────────────────────────────────────

describe('logout', () => {
  it('登出後 role 回到 null', async () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    await act(async () => { result.current.setRole('child') })
    await act(async () => { result.current.logout() })
    expect(result.current.role).toBeNull()
  })

  it('登出後 currentChild 重置為 jasper', async () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    await act(async () => {
      result.current.setRole('child')
      result.current.setCurrentChild('terry')
    })
    await act(async () => { result.current.logout() })
    expect(result.current.currentChild).toBe('jasper')
  })
})
