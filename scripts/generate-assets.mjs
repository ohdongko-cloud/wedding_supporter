import sharp from 'sharp'
import { mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const root = join(__dir, '..')
const assetsDir = join(root, 'assets')
if (!existsSync(assetsDir)) mkdirSync(assetsDir)

// Ring + diamond SVG — ring band (circle outline) + diamond top (polygon)
function ringIcon(size) {
  const cx = size / 2
  const cy = size * 0.52
  const r = size * 0.185
  const sw = size * 0.052
  // diamond points
  const dtop = size * 0.26
  const dmid = size * 0.36
  const dbot = size * 0.40
  const dw = size * 0.085
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff6b9d"/>
      <stop offset="100%" stop-color="#c77dff"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#g)"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="white" stroke-width="${sw}" stroke-opacity="0.95"/>
  <polygon points="${cx},${dtop} ${cx - dw},${dmid} ${cx},${dbot} ${cx + dw},${dmid}" fill="white"/>
  <polygon points="${cx},${dtop} ${cx - dw},${dmid} ${cx},${(dtop + dmid) / 2}" fill="rgba(255,255,255,0.55)"/>
</svg>`
}

async function generate() {
  // icon.png — 1024×1024 (Play Store requires exactly this)
  await sharp(Buffer.from(ringIcon(1024)))
    .png({ compressionLevel: 9, palette: false })
    .toFile(join(assetsDir, 'icon.png'))
  console.log('✓ assets/icon.png  (1024×1024)')

  // splash.png — 2732×2732 (capacitor-assets requirement)
  await sharp(Buffer.from(ringIcon(2732)))
    .png({ compressionLevel: 9, palette: false })
    .toFile(join(assetsDir, 'splash.png'))
  console.log('✓ assets/splash.png (2732×2732)')

  console.log('\n다음 명령어로 Android 아이콘을 생성하세요:')
  console.log('  npx capacitor-assets generate --android')
}

generate().catch(e => { console.error('❌', e.message); process.exit(1) })
