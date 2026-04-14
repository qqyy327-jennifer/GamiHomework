import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AppProvider } from '../contexts/AppContext.jsx'
import PinScreen from '../components/PinScreen.jsx'

const renderPin = () => render(
  <AppProvider><PinScreen /></AppProvider>
)

// ── 畫面渲染 ───────────────────────────────────────────────────────────────

describe('PinScreen 渲染', () => {
  it('顯示小英雄 / 家長切換按鈕', () => {
    renderPin()
    expect(screen.getByText('小英雄')).toBeInTheDocument()
    expect(screen.getByText('家長')).toBeInTheDocument()
  })

  it('顯示數字 0–9', () => {
    renderPin()
    for (let i = 0; i <= 9; i++) {
      expect(screen.getByText(String(i))).toBeInTheDocument()
    }
  })

  it('顯示退格按鈕', () => {
    renderPin()
    expect(screen.getByText('⌫')).toBeInTheDocument()
  })

  it('初始 PIN 顯示 4 個空白圓點', () => {
    renderPin()
    // 空白 dot = border-gray-300
    const dots = document.querySelectorAll('.border-gray-300')
    expect(dots.length).toBe(4)
  })
})

// ── PIN 輸入互動 ───────────────────────────────────────────────────────────

describe('PinScreen 輸入互動', () => {
  it('點擊數字後填滿一個圓點', () => {
    renderPin()
    fireEvent.click(screen.getByText('1'))
    const filled = document.querySelectorAll('.bg-amber-400.border-amber-400')
    expect(filled.length).toBe(1)
  })

  it('連續輸入 3 個數字後填滿 3 個圓點', () => {
    renderPin()
    fireEvent.click(screen.getByText('1'))
    fireEvent.click(screen.getByText('2'))
    fireEvent.click(screen.getByText('3'))
    const filled = document.querySelectorAll('.bg-amber-400.border-amber-400')
    expect(filled.length).toBe(3)
  })

  it('退格後圓點減少一個', () => {
    renderPin()
    fireEvent.click(screen.getByText('1'))
    fireEvent.click(screen.getByText('2'))
    fireEvent.click(screen.getByText('⌫'))
    const filled = document.querySelectorAll('.bg-amber-400.border-amber-400')
    expect(filled.length).toBe(1)
  })

  it('空白時退格不報錯', () => {
    renderPin()
    expect(() => fireEvent.click(screen.getByText('⌫'))).not.toThrow()
  })

  it('最多只能輸入 4 位數字', () => {
    renderPin()
    ;['1','2','3','4','5','6'].forEach(d => fireEvent.click(screen.getByText(d)))
    const filled = document.querySelectorAll('.bg-amber-400.border-amber-400')
    expect(filled.length).toBe(4)
  })
})

// ── 模式切換 ───────────────────────────────────────────────────────────────

describe('PinScreen 模式切換', () => {
  it('預設顯示小英雄的歡迎訊息', () => {
    renderPin()
    expect(screen.getByText('歡迎回來，小英雄！')).toBeInTheDocument()
  })

  it('切換到家長模式顯示家長標題', () => {
    renderPin()
    fireEvent.click(screen.getByText('家長'))
    expect(screen.getByText('家長專區')).toBeInTheDocument()
  })

  it('切換模式後 PIN 輸入被清空', () => {
    renderPin()
    fireEvent.click(screen.getByText('1'))
    fireEvent.click(screen.getByText('2'))
    fireEvent.click(screen.getByText('家長'))
    const filled = document.querySelectorAll('.bg-amber-400.border-amber-400')
    expect(filled.length).toBe(0)
  })
})
