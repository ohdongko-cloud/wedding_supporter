/**
 * 앱 아이콘 & 스플래시 소스 이미지 준비
 * logo5_badge.png → resources/icon.png (1024×1024)
 *                 → resources/splash.png (2732×2732, 핑크 배경 + 로고 중앙)
 */
import sharp from 'sharp'
import { mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const SRC  = resolve(ROOT, 'assets/logos/logo5_badge.png')
const OUT  = resolve(ROOT, 'resources')
mkdirSync(OUT, { recursive: true })

// ── 1. 아이콘 (1024×1024) ───────────────────────────────────
await sharp(SRC).resize(1024, 1024).png().toFile(`${OUT}/icon.png`)
console.log('✅ resources/icon.png  (1024×1024)')

// ── 2. 스플래시 (2732×2732, 핑크 배경 + 로고 640px 중앙 배치) ──
const SPLASH = 2732
const LOGO_SIZE = 640

const logoResized = await sharp(SRC).resize(LOGO_SIZE, LOGO_SIZE).png().toBuffer()

const left = Math.round((SPLASH - LOGO_SIZE) / 2)
const top  = Math.round((SPLASH - LOGO_SIZE) / 2)

await sharp({
  create: {
    width: SPLASH, height: SPLASH,
    channels: 4,
    background: { r: 255, g: 107, b: 157, alpha: 1 }, // #ff6b9d
  }
})
  .composite([{ input: logoResized, left, top }])
  .png()
  .toFile(`${OUT}/splash.png`)

console.log('✅ resources/splash.png (2732×2732)')
console.log('\n🎉 소스 이미지 준비 완료!')
