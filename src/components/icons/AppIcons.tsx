/**
 * AppIcons.tsx
 * 앱 전용 SVG 아이콘 시스템
 * 컬러: 핑크(#ff6b9d) → 퍼플(#c77dff) 그라데이션 / 비활성 회색 #c9a0ac
 * 로고 컨셉: 다이아몬드 반지 + 커서, 심플·미니멀·웨딩
 */

const PK = '#ff6b9d'
const MN = '#c77dff'
const GRAY = '#c9a0ac'

interface IconProps {
  size?: number
  active?: boolean
  color?: string  // 단색 override (미지정 시 active/inactive 자동)
}

// ── 그라데이션 def (각 SVG 내부에 고유 ID로 삽입) ─────────────────
function Grad({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={PK} />
        <stop offset="100%" stopColor={MN} />
      </linearGradient>
    </defs>
  )
}

function fill(id: string, active?: boolean, color?: string) {
  if (color) return color
  return active ? `url(#${id})` : GRAY
}


// ══════════════════════════════════════════════════════════════════════
// 탭바 아이콘 (하단 네비게이션)
// ══════════════════════════════════════════════════════════════════════

/** 홈 — 심플 하우스 */
export function HomeIcon({ size = 24, active, color }: IconProps) {
  const f = fill('ig_home', active, color)
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {active && !color && <Grad id="ig_home" />}
      {/* 지붕 */}
      <path d="M12 2.5L2 10.5V21h7v-6h6v6h7V10.5L12 2.5z" fill={f} />
      {/* 문 (흰색) */}
      <rect x="9.5" y="15" width="5" height="6" rx="1" fill="white" opacity={active ? 0.85 : 0.5} />
    </svg>
  )
}

/** 체크리스트 — 클립보드 + 체크마크 */
export function ChecklistIcon({ size = 24, active, color }: IconProps) {
  const f = fill('ig_cl', active, color)
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {active && !color && <Grad id="ig_cl" />}
      {/* 배경 카드 */}
      <rect x="3" y="5" width="18" height="17" rx="2.5" fill={f} />
      {/* 클립 */}
      <rect x="8" y="2" width="8" height="5" rx="1.5" fill={f} />
      <rect x="9.5" y="2.5" width="5" height="4" rx="1" fill="white" opacity="0.7" />
      {/* 체크 라인 */}
      <path d="M7.5 12h4M7.5 15.5h6" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
      {/* 체크마크 */}
      <path d="M14 11.5l2 2 3-2.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** 계산기 — 그리드 + 다이아몬드 포인트 */
export function CalculatorIcon({ size = 24, active, color }: IconProps) {
  const f = fill('ig_calc', active, color)
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {active && !color && <Grad id="ig_calc" />}
      {/* 본체 */}
      <rect x="3" y="3" width="18" height="18" rx="3" fill={f} />
      {/* 디스플레이 */}
      <rect x="5.5" y="5.5" width="13" height="4" rx="1.5" fill="white" opacity="0.85" />
      {/* 버튼 그리드 3×2 */}
      {[0, 1, 2].map(col =>
        [0, 1].map(row => (
          <rect
            key={`${col}-${row}`}
            x={5.5 + col * 4.5}
            y={12 + row * 4}
            width={3.5}
            height={3}
            rx="0.8"
            fill="white"
            opacity={active ? 0.75 : 0.4}
          />
        ))
      )}
    </svg>
  )
}

/** 게시판 — 말풍선 + 라인 */
export function BoardIcon({ size = 24, active, color }: IconProps) {
  const f = fill('ig_board', active, color)
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {active && !color && <Grad id="ig_board" />}
      {/* 말풍선 */}
      <path
        d="M20 3H4C2.9 3 2 3.9 2 5v11c0 1.1.9 2 2 2h3l3 3 3-3h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"
        fill={f}
      />
      {/* 라인 3개 */}
      <path d="M6 8h12M6 11.5h9M6 15h7" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

/** 설정 — 점 세 개 (···) 모양이 아닌 슬라이더/설정 아이콘 */
export function SettingsIcon({ size = 24, active, color }: IconProps) {
  const f = fill('ig_set', active, color)
  const dot = active ? 'white' : '#fff'
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {active && !color && <Grad id="ig_set" />}
      {/* 원형 배경 */}
      <circle cx="12" cy="12" r="10" fill={f} />
      {/* 가로 슬라이더 3개 */}
      <path d="M6 8h12M6 12h12M6 16h12" stroke={dot} strokeWidth="1.8" strokeLinecap="round" />
      {/* 슬라이더 노브 */}
      <circle cx="10" cy="8"  r="1.5" fill={f} stroke={dot} strokeWidth="1.5" />
      <circle cx="15" cy="12" r="1.5" fill={f} stroke={dot} strokeWidth="1.5" />
      <circle cx="9"  cy="16" r="1.5" fill={f} stroke={dot} strokeWidth="1.5" />
    </svg>
  )
}


// ══════════════════════════════════════════════════════════════════════
// 계산기 탭 서브 아이콘 (CalculatorTabPage)
// ══════════════════════════════════════════════════════════════════════

/** 결혼비용 — 다이아몬드 반지 (로고 모티프) */
export function RingIcon({ size = 24, active, color }: IconProps) {
  const f = fill('ig_ring', active, color)
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {active && !color && <Grad id="ig_ring" />}
      {/* 반지 원 */}
      <circle cx="12" cy="14" r="7" fill="none" stroke={f} strokeWidth="2.8" />
      {/* 다이아몬드 상단 */}
      <polygon points="12,2 8.5,6.5 12,8.5 15.5,6.5" fill={f} />
      {/* 다이아몬드 하단 삼각형 */}
      <polygon points="8.5,6.5 12,8.5 15.5,6.5 12,11" fill={f} opacity="0.7" />
    </svg>
  )
}

/** 신혼집 — 하트 있는 집 */
export function HouseHeartIcon({ size = 24, active, color }: IconProps) {
  const f = fill('ig_house', active, color)
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {active && !color && <Grad id="ig_house" />}
      <path d="M12 3L3 10v11h7v-5h4v5h7V10L12 3z" fill={f} />
      {/* 하트 */}
      <path
        d="M12 16.5c0 0-4-2.8-4-5.2A2.2 2.2 0 0112 10a2.2 2.2 0 014 1.3c0 2.4-4 5.2-4 5.2z"
        fill="white"
        opacity={active ? 0.9 : 0.5}
      />
    </svg>
  )
}

/** 신혼여행 — 비행기 */
export function PlaneIcon({ size = 24, active, color }: IconProps) {
  const f = fill('ig_plane', active, color)
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {active && !color && <Grad id="ig_plane" />}
      <path
        d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0011.5 2h0A1.5 1.5 0 0010 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5L21 16z"
        fill={f}
      />
    </svg>
  )
}


// ══════════════════════════════════════════════════════════════════════
// 설정 탭 행 아이콘 (SettingsPage)
// ══════════════════════════════════════════════════════════════════════

const ROW_COLOR = '#ff6b9d'  // 설정 행은 단색 핑크 사용 (그라데이션 없이도 브랜드 컬러)
const ROW_C2 = '#c77dff'

/** 메모 — 연필 + 종이 */
export function NoteIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <rect x="3" y="2" width="13" height="16" rx="2" fill={ROW_COLOR} opacity="0.15" stroke={ROW_COLOR} strokeWidth="1.5" />
      <path d="M6 7h7M6 10h7M6 13h5" stroke={ROW_COLOR} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M16 14l3-3-2-2-3 3v2h2z" fill={ROW_COLOR} />
    </svg>
  )
}

/** 파트너 — 두 사람 */
export function PartnerIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <circle cx="8" cy="7" r="3" fill={ROW_COLOR} />
      <path d="M2 18c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke={ROW_COLOR} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="15.5" cy="7" r="2.5" fill={ROW_C2} opacity="0.8" />
      <path d="M12.5 18c0-2.5 1.3-4.7 3-5.7" stroke={ROW_C2} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

/** 링크/공유 */
export function LinkIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <path d="M9 11a4 4 0 005.66 0l2.83-2.83a4 4 0 00-5.66-5.66L10 4.34" stroke={ROW_COLOR} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M13 11a4 4 0 00-5.66 0L4.51 13.83a4 4 0 005.66 5.66L12 17.66" stroke={ROW_C2} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

/** 채팅/개선요청 */
export function ChatIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <path d="M18 3H4C2.9 3 2 3.9 2 5v10c0 1.1.9 2 2 2h3l4 4 4-4h3c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" fill={ROW_COLOR} opacity="0.15" stroke={ROW_COLOR} strokeWidth="1.5" />
      <path d="M6 9h10M6 13h6" stroke={ROW_COLOR} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

/** 자물쇠 */
export function LockIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <rect x="4" y="10" width="14" height="10" rx="2.5" fill={ROW_COLOR} opacity="0.2" stroke={ROW_COLOR} strokeWidth="1.5" />
      <path d="M7 10V7a4 4 0 018 0v3" stroke={ROW_COLOR} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="11" cy="15" r="1.5" fill={ROW_COLOR} />
    </svg>
  )
}

/** 정보 */
export function InfoIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="9" fill={ROW_COLOR} opacity="0.12" stroke={ROW_COLOR} strokeWidth="1.5" />
      <path d="M11 10v6" stroke={ROW_COLOR} strokeWidth="2" strokeLinecap="round" />
      <circle cx="11" cy="7" r="1.2" fill={ROW_COLOR} />
    </svg>
  )
}

/** 로그아웃 — 문 + 화살표 */
export function LogoutIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <path d="M9 20H4a2 2 0 01-2-2V4a2 2 0 012-2h5" stroke={GRAY} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M15 16l5-5-5-5M20 11H8" stroke={GRAY} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** 삭제/초기화 */
export function TrashIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <path d="M3 6h16M8 6V4h6v2M19 6l-1 14H4L3 6" stroke="#e03060" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 10v6M13 10v6" stroke="#e03060" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

/** 로그인 — 키 */
export function KeyIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <circle cx="8" cy="9" r="4.5" fill={ROW_COLOR} opacity="0.15" stroke={ROW_COLOR} strokeWidth="1.5" />
      <path d="M11.5 11.5l8 8M15.5 16l2-2" stroke={ROW_COLOR} strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="8" cy="9" r="2" fill={ROW_COLOR} />
    </svg>
  )
}

/** 관리자 — 렌치 */
export function WrenchIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <path
        d="M14.5 3a5 5 0 00-4.8 6.2L3 16.5 3 19l2.5 0 6.3-6.7A5 5 0 1014.5 3z"
        fill={ROW_COLOR} opacity="0.15" stroke={ROW_COLOR} strokeWidth="1.5" strokeLinejoin="round"
      />
      <circle cx="14.5" cy="7.5" r="1.5" fill={ROW_COLOR} />
    </svg>
  )
}

/** 개인정보 처리방침 — 방패 */
export function PrivacyIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <path
        d="M11 2L3 5.5v5.5c0 4.4 3.4 8.5 8 9.5 4.6-1 8-5.1 8-9.5V5.5L11 2z"
        fill={ROW_COLOR} opacity="0.12" stroke={ROW_COLOR} strokeWidth="1.5" strokeLinejoin="round"
      />
      <path d="M7.5 11l2.5 2.5 4.5-4.5" stroke={ROW_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
