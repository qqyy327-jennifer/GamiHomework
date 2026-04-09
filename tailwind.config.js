/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        mario: {
          red:     '#E52521',   // 經典 Mario 紅
          redDark: '#B81C18',   // 紅色陰影（按鈕底部）
          blue:    '#0058F8',   // NES 深藍
          blueDark:'#0040C0',
          yellow:  '#FBD000',   // 問號磚黃
          yellowDk:'#C8860A',   // 磚塊陰影
          green:   '#43B047',   // Luigi 綠
          greenDk: '#2D7A30',
          brown:   '#7A4A2C',   // 磚塊棕
          ground:  '#E09040',   // 地板土黃
          sky:     '#5C94FC',   // NES 天空藍（最重要！）
          coin:    '#F8B800',   // 金幣金
          star:    '#FFE033',
          cloud:   '#FFFFFF',
          pipe:    '#58A840',   // 水管綠
        }
      },
      fontFamily: {
        mario: ['"Press Start 2P"', 'cursive'],
        round: ['"Microsoft JhengHei"', '"微軟正黑體"', 'sans-serif'],
      },
      keyframes: {
        starPop: {
          '0%':   { transform: 'scale(0) rotate(-10deg)', opacity: '0' },
          '60%':  { transform: 'scale(1.3) rotate(5deg)',  opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)',    opacity: '1' },
        },
        bounce2: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':       { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        starPop:  'starPop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
        bounce2:  'bounce2 0.8s ease-in-out infinite',
        shimmer:  'shimmer 2s linear infinite',
        float:    'float 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
