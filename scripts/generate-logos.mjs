/**
 * 결혼 딸깍 앱 로고 5종 생성 스크립트
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
  await sharp(Buffer.from(svg)).png().toFile(`${OUT}/${name}.png`)
  console.log(`✅ ${name}.png`)
}

/* ──────────────────────────────────────────────────────────────
   로고 1 — 그라디언트 원형 + 체크 심볼
   컨셉: 심플하고 명쾌. 핑크~퍼플 그라디언트 원 + 흰색 체크마크
────────────────────────────────────────────────────────────── */
await save('logo1_check', wrap(`
  <defs>
    <radialGradient id="g1" cx="40%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#ff9ec7"/>
      <stop offset="100%" stop-color="#b44fcc"/>
    </radialGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="8" stdDeviation="20" flood-opacity="0.25"/>
    </filter>
  </defs>
  <circle cx="${R}" cy="${R}" r="${R - 30}" fill="url(#g1)" filter="url(#shadow)"/>
  <!-- 체크마크 -->
  <polyline points="280,520 430,670 740,360"
    fill="none" stroke="white" stroke-width="80"
    stroke-linecap="round" stroke-linejoin="round"/>
`))

/* ──────────────────────────────────────────────────────────────
   로고 2 — 하트 + 딸깍 타이포
   컨셉: 하트 실루엣 안에 "딸깍" 텍스트. 따뜻하고 감성적
────────────────────────────────────────────────────────────── */
await save('logo2_heart', wrap(`
  <defs>
    <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff6b9d"/>
      <stop offset="100%" stop-color="#ff4757"/>
    </linearGradient>
  </defs>
  <!-- 하트 -->
  <path d="M512 820
    C512 820 160 600 160 370
    C160 240 260 160 380 180
    C430 188 475 210 512 248
    C549 210 594 188 644 180
    C764 160 864 240 864 370
    C864 600 512 820 512 820Z"
    fill="url(#g2)"/>
  <!-- 딸깍 텍스트 -->
  <text x="512" y="460" text-anchor="middle" font-family="sans-serif"
    font-size="130" font-weight="900" fill="white" letter-spacing="-2">딸깍</text>
  <text x="512" y="570" text-anchor="middle" font-family="sans-serif"
    font-size="52" font-weight="500" fill="rgba(255,255,255,0.85)">결혼 준비 끝</text>
`))

/* ──────────────────────────────────────────────────────────────
   로고 3 — 모던 스퀘어 (앱 아이콘용)
   컨셉: 둥근 모서리 사각형, 그라디언트 배경, "딸" 큰 글씨
────────────────────────────────────────────────────────────── */
await save('logo3_square', wrap(`
  <defs>
    <linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff6b9d"/>
      <stop offset="100%" stop-color="#c77dff"/>
    </linearGradient>
  </defs>
  <rect x="40" y="40" width="944" height="944" rx="220" ry="220" fill="url(#g3)"/>
  <text x="512" y="560" text-anchor="middle" font-family="sans-serif"
    font-size="420" font-weight="900" fill="white">딸</text>
  <text x="512" y="700" text-anchor="middle" font-family="sans-serif"
    font-size="90" font-weight="600" fill="rgba(255,255,255,0.9)"
    letter-spacing="8">깍</text>
`))

/* ──────────────────────────────────────────────────────────────
   로고 4 — 반지 + 체크 조합
   컨셉: 결혼반지 원 심볼 + 체크마크 조합. 클래식하면서 명쾌
────────────────────────────────────────────────────────────── */
await save('logo4_ring', wrap(`
  <defs>
    <radialGradient id="g4" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fff9fe"/>
      <stop offset="100%" stop-color="#ffe0f0"/>
    </radialGradient>
    <linearGradient id="ringG" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff6b9d"/>
      <stop offset="100%" stop-color="#c77dff"/>
    </linearGradient>
  </defs>
  <circle cx="${R}" cy="${R}" r="${R - 20}" fill="url(#g4)"/>
  <!-- 반지 외곽 -->
  <circle cx="${R}" cy="${R}" r="280" fill="none" stroke="url(#ringG)" stroke-width="80"/>
  <!-- 반지 하이라이트 -->
  <circle cx="340" cy="340" r="40" fill="white" opacity="0.6"/>
  <!-- 체크마크 (작게 우측하단) -->
  <circle cx="740" cy="740" r="140" fill="#ff6b9d"/>
  <polyline points="670,740 720,795 820,680"
    fill="none" stroke="white" stroke-width="45"
    stroke-linecap="round" stroke-linejoin="round"/>
`))

/* ──────────────────────────────────────────────────────────────
   로고 5 — 미니멀 타이포 배지
   컨셉: 원형 배지. "결혼" 작게 위, "딸깍" 크게 중앙, 태그라인 아래
────────────────────────────────────────────────────────────── */
await save('logo5_badge', wrap(`
  <defs>
    <linearGradient id="g5" x1="0%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#ff6b9d"/>
      <stop offset="100%" stop-color="#a855f7"/>
    </linearGradient>
  </defs>
  <circle cx="${R}" cy="${R}" r="${R - 20}" fill="url(#g5)"/>
  <!-- 장식 원 -->
  <circle cx="${R}" cy="${R}" r="${R - 55}" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="3"/>
  <!-- 결혼 -->
  <text x="512" y="370" text-anchor="middle" font-family="sans-serif"
    font-size="80" font-weight="400" fill="rgba(255,255,255,0.85)" letter-spacing="20">결혼</text>
  <!-- 딸깍 -->
  <text x="512" y="560" text-anchor="middle" font-family="sans-serif"
    font-size="220" font-weight="900" fill="white" letter-spacing="-4">딸깍</text>
  <!-- 태그라인 -->
  <text x="512" y="650" text-anchor="middle" font-family="sans-serif"
    font-size="48" font-weight="300" fill="rgba(255,255,255,0.75)" letter-spacing="2">비용부터 일정까지</text>
`))

console.log(`\n🎉 5개 로고 생성 완료 → assets/logos/`)
