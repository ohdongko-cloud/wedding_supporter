/**
 * 결혼 딸깍 앱 로고4 개선안 3종 생성 스크립트
 * 로고4(반지+체크) 기반 변형 버전
 * sharp + SVG → PNG (1024×1024)
 */
import sharp from 'sharp'
import { mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../assets/logos')
mkdirSync(OUT, { recursive: true })

const SIZE = 1024
const R = SIZE / 2

function wrap(content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">${content}</svg>`
}

async function save(name, svg) {
  await sharp(Buffer.from(svg)).png().toFile(`${OUT}/${name}`)
  console.log(`✅ ${name}`)
}

/* ──────────────────────────────────────────────────────────────
   로고 4a — 링 + 텍스트 ("딸깍" 추가)
   컨셉: 기존 반지+체크 유지, 링 아래 "딸깍" 흰색 볼드 텍스트
         배경: 핑크 단색에 가까운 그라디언트 (#ff6b9d → #ff9ec7)
────────────────────────────────────────────────────────────── */
await save('logo4a_ring_text.png', wrap(`
  <defs>
    <radialGradient id="g4a" cx="50%" cy="45%" r="60%">
      <stop offset="0%" stop-color="#ff9ec7"/>
      <stop offset="100%" stop-color="#ff6b9d"/>
    </radialGradient>
    <linearGradient id="ringG4a" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff6b9d"/>
      <stop offset="100%" stop-color="#c77dff"/>
    </linearGradient>
    <filter id="shadow4a">
      <feDropShadow dx="0" dy="8" stdDeviation="18" flood-opacity="0.22"/>
    </filter>
  </defs>
  <!-- 배경 원 -->
  <circle cx="${R}" cy="${R}" r="${R - 20}" fill="url(#g4a)" filter="url(#shadow4a)"/>
  <!-- 반지 링 -->
  <circle cx="${R}" cy="460" r="240" fill="none" stroke="url(#ringG4a)" stroke-width="80"/>
  <!-- 반지 하이라이트 -->
  <circle cx="305" cy="305" r="38" fill="white" opacity="0.55"/>
  <!-- 체크 뱃지 (우하단) -->
  <circle cx="740" cy="720" r="130" fill="#ff6b9d"/>
  <circle cx="740" cy="720" r="118" fill="none" stroke="white" stroke-width="8" opacity="0.4"/>
  <polyline points="675,718 722,768 815,658"
    fill="none" stroke="white" stroke-width="44"
    stroke-linecap="round" stroke-linejoin="round"/>
  <!-- 딸깍 텍스트 (링 아래) -->
  <text x="${R}" y="790" text-anchor="middle"
    font-family="'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif"
    font-size="80" font-weight="700" fill="white"
    letter-spacing="4">딸깍</text>
`))

/* ──────────────────────────────────────────────────────────────
   로고 4b — 다이아몬드 반지 스타일
   컨셉: 링 위 다이아몬드 마름모 추가, 골드 링, 밝은 배경
         배경: 화이트→연핑크 radial gradient (고급스러운 느낌)
────────────────────────────────────────────────────────────── */
await save('logo4b_diamond.png', wrap(`
  <defs>
    <radialGradient id="g4b" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="60%" stop-color="#fff0f7"/>
      <stop offset="100%" stop-color="#ffd6ec"/>
    </radialGradient>
    <linearGradient id="ringG4b" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f0c060"/>
      <stop offset="100%" stop-color="#e8963c"/>
    </linearGradient>
    <linearGradient id="diamondG" x1="0%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="40%" stop-color="#ffe8f4"/>
      <stop offset="100%" stop-color="#f8c0dc"/>
    </linearGradient>
    <filter id="shadow4b">
      <feDropShadow dx="0" dy="10" stdDeviation="22" flood-color="#f0a0c8" flood-opacity="0.30"/>
    </filter>
    <filter id="diamondShadow">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.20"/>
    </filter>
  </defs>
  <!-- 배경 원 -->
  <circle cx="${R}" cy="${R}" r="${R - 20}" fill="url(#g4b)" filter="url(#shadow4b)"/>
  <!-- 장식 원 테두리 -->
  <circle cx="${R}" cy="${R}" r="${R - 45}" fill="none" stroke="#f0c060" stroke-width="3" opacity="0.35"/>
  <!-- 반지 링 (골드) -->
  <circle cx="${R}" cy="530" r="220" fill="none" stroke="url(#ringG4b)" stroke-width="75"/>
  <!-- 링 하이라이트 -->
  <circle cx="335" cy="368" r="32" fill="white" opacity="0.70"/>
  <!-- 다이아몬드 받침(링 상단 연결부) -->
  <rect x="472" y="288" width="80" height="30" rx="8" fill="url(#ringG4b)"/>
  <!-- 다이아몬드 외형 (마름모) -->
  <polygon points="512,145  650,268  512,355  374,268"
    fill="url(#diamondG)" stroke="#e8963c" stroke-width="4"
    filter="url(#diamondShadow)"/>
  <!-- 다이아몬드 내부 면 분할선 -->
  <line x1="512" y1="145" x2="512" y2="355" stroke="#e8c0d0" stroke-width="2" opacity="0.6"/>
  <line x1="374" y1="268" x2="650" y2="268" stroke="#e8c0d0" stroke-width="2" opacity="0.6"/>
  <line x1="374" y1="268" x2="512" y2="355" stroke="#e8c0d0" stroke-width="1.5" opacity="0.5"/>
  <line x1="650" y1="268" x2="512" y2="355" stroke="#e8c0d0" stroke-width="1.5" opacity="0.5"/>
  <!-- 다이아몬드 하이라이트 -->
  <polygon points="512,162  590,240  512,268  434,240"
    fill="white" opacity="0.45"/>
  <polygon points="430,260  512,188  512,260"
    fill="white" opacity="0.25"/>
  <!-- 체크 뱃지 (우하단) -->
  <circle cx="745" cy="745" r="130" fill="#ff6b9d"/>
  <circle cx="745" cy="745" r="118" fill="none" stroke="white" stroke-width="7" opacity="0.35"/>
  <polyline points="680,743 727,793 820,683"
    fill="none" stroke="white" stroke-width="44"
    stroke-linecap="round" stroke-linejoin="round"/>
`))

/* ──────────────────────────────────────────────────────────────
   로고 4c — 미니멀 클린 버전
   컨셉: 핑크 그라디언트 원형 배경, 얇은 흰 링, 체크를 중앙에,
         우상단 "딸깍" 소형 텍스트
────────────────────────────────────────────────────────────── */
await save('logo4c_minimal.png', wrap(`
  <defs>
    <radialGradient id="g4c" cx="40%" cy="38%" r="68%">
      <stop offset="0%" stop-color="#ff9ec7"/>
      <stop offset="100%" stop-color="#e040a0"/>
    </radialGradient>
  </defs>
  <!-- 배경 원 (가득 채움) -->
  <circle cx="${R}" cy="${R}" r="${R}" fill="url(#g4c)"/>
  <!-- 얇은 흰 링 (stroke-width 40) -->
  <circle cx="${R}" cy="${R}" r="300" fill="none" stroke="white" stroke-width="40" opacity="0.92"/>
  <!-- 링 내부 하이라이트 (작은 반사점) -->
  <circle cx="330" cy="330" r="22" fill="white" opacity="0.50"/>
  <!-- 링 중앙 체크마크 (별도 원 없이 흰색만) -->
  <polyline points="390,520 468,610 638,400"
    fill="none" stroke="white" stroke-width="52"
    stroke-linecap="round" stroke-linejoin="round"/>
  <!-- 우상단 "딸깍" 텍스트 (소형, 흰색) -->
  <text x="810" y="160" text-anchor="middle"
    font-family="'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif"
    font-size="60" font-weight="700" fill="white"
    opacity="0.90" letter-spacing="2">딸깍</text>
`))

console.log(`\n🎉 로고4 개선안 3종 생성 완료 → assets/logos/`)
console.log(`   · logo4a_ring_text.png`)
console.log(`   · logo4b_diamond.png`)
console.log(`   · logo4c_minimal.png`)
