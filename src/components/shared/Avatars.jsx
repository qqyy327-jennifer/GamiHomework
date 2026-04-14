// Jasper — 哥哥，微捲髮（棕色）
export function JasperAvatar({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 捲髮：用多個小圓弧堆疊 */}
      <circle cx="10" cy="16" r="6" fill="#92400e"/>
      <circle cx="16" cy="10" r="6" fill="#92400e"/>
      <circle cx="24" cy="10" r="6" fill="#92400e"/>
      <circle cx="30" cy="16" r="6" fill="#92400e"/>
      <circle cx="20" cy="8"  r="6" fill="#92400e"/>
      {/* 臉 */}
      <circle cx="20" cy="25" r="13" fill="#fcd34d"/>
      {/* 眼睛 */}
      <circle cx="15" cy="23" r="2.2" fill="#1e293b"/>
      <circle cx="25" cy="23" r="2.2" fill="#1e293b"/>
      {/* 眼睛亮點 */}
      <circle cx="16" cy="22" r="0.8" fill="white"/>
      <circle cx="26" cy="22" r="0.8" fill="white"/>
      {/* 笑容 */}
      <path d="M14 29 Q20 35 26 29" stroke="#92400e" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

// Terry — 弟弟，直髮（深棕色）
export function TerryAvatar({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 直髮蓋頂 */}
      <rect x="7" y="8" width="26" height="13" rx="5" fill="#78350f"/>
      {/* 兩側瀏海垂下 */}
      <rect x="7"  y="14" width="5" height="11" rx="2.5" fill="#78350f"/>
      <rect x="28" y="14" width="5" height="11" rx="2.5" fill="#78350f"/>
      {/* 臉 */}
      <circle cx="20" cy="26" r="13" fill="#fcd34d"/>
      {/* 眼睛 */}
      <circle cx="15" cy="24" r="2.2" fill="#1e293b"/>
      <circle cx="25" cy="24" r="2.2" fill="#1e293b"/>
      {/* 眼睛亮點 */}
      <circle cx="16" cy="23" r="0.8" fill="white"/>
      <circle cx="26" cy="23" r="0.8" fill="white"/>
      {/* 笑容 */}
      <path d="M14 30 Q20 36 26 30" stroke="#92400e" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

// 根據 child 名稱選頭像
export function Avatar({ child, size = 40 }) {
  return child === 'jasper'
    ? <JasperAvatar size={size} />
    : <TerryAvatar size={size} />
}
