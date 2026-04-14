import '@testing-library/jest-dom'
import { vi, beforeAll, afterAll } from 'vitest'

// canvas-confetti（jsdom 無 canvas）
vi.mock('canvas-confetti', () => ({ default: vi.fn() }))

// 攔截所有 fetch，不發出真實 API 請求
beforeAll(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({ json: () => Promise.resolve({}) })
  )
})
afterAll(() => {
  vi.restoreAllMocks()
})

// Web Audio API
global.AudioContext = vi.fn(() => ({
  createOscillator: vi.fn(() => ({
    connect: vi.fn(), start: vi.fn(), stop: vi.fn(),
    type: 'sine', frequency: { value: 0 },
  })),
  createGain: vi.fn(() => ({
    connect: vi.fn(),
    gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
  })),
  currentTime: 0,
  destination: {},
}))
global.webkitAudioContext = global.AudioContext

// Speech API
global.SpeechSynthesisUtterance = vi.fn()
global.speechSynthesis = { speak: vi.fn() }
