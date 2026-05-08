// src/components/ScoreShareModal.tsx
import { useState, useEffect, useRef } from 'react'
import { getScoreLabel } from '../utils/scoreCalc'

declare global { interface Window { Kakao: any } }

const PROD_ORIGIN = 'https://weddingsupporter.vercel.app'

interface Props {
  score: number
  weddingAreaPct: number
  houseAreaPct: number
  honeymoonAreaPct: number
  dday: number | null
  totalCost: number
  isGuest: boolean
  onClose: () => void
  onGuestBlock: () => void
}

// ── Canvas 유틸: roundRect 폴리필 ────────────────────────────────
function fillRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
  ctx.fill()
}

// ── 프로그레스 바 그리기 ──────────────────────────────────────────
function drawProgressBar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  pct: number, color: string, bgColor: string
) {
  // 배경
  ctx.fillStyle = bgColor
  fillRoundRect(ctx, x, y, w, h, h / 2)
  // 전경
  const fw = Math.max(0, w * pct / 100)
  if (fw > 0) {
    ctx.fillStyle = color
    fillRoundRect(ctx, x, y, fw, h, h / 2)
  }
}

// ── 메인 이미지 생성 함수 ────────────────────────────────────────
async function generateScoreImage(params: {
  score: number
  label: string
  labelEmoji: string
  weddingPct: number
  housePct: number
  honeymoonPct: number
  dday: number | null
  totalCost: number
}): Promise<Blob> {
  const { score, label, labelEmoji, weddingPct, housePct, honeymoonPct, dday, totalCost } = params

  const W = 390, H = 560
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!

  // ── 1. 상단 그라디언트 배경 (0~240px) ──────────────────────────
  const topGrad = ctx.createLinearGradient(0, 0, W, 240)
  topGrad.addColorStop(0, '#FF6B9D')
  topGrad.addColorStop(1, '#FF8CC8')
  ctx.fillStyle = topGrad
  fillRoundRect(ctx, 0, 0, W, H, 20)

  // ── 2. 흰색 하단 (240~560px) — sharp top edge ──────────────────
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 240, W, H - 240)

  // ── 3. 앱 이름 ──────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  ctx.font = 'bold 16px -apple-system, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('💍 결혼딸깍', 24, 44)

  // ── 4. 점수 원형 ────────────────────────────────────────────────
  const cx = W / 2, cy = 140, cr = 56
  // 원 그림자 효과 (흰색 링)
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.arc(cx, cy, cr + 5, 0, Math.PI * 2)
  ctx.stroke()
  // 원 배경
  ctx.fillStyle = 'rgba(255,255,255,0.25)'
  ctx.beginPath()
  ctx.arc(cx, cy, cr, 0, Math.PI * 2)
  ctx.fill()

  // ── 5. 점수 숫자 ────────────────────────────────────────────────
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 42px -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(String(score), cx, cy + 14)

  // 점 / 점수
  ctx.font = '500 12px -apple-system, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  ctx.fillText('점수', cx, cy + 32)

  // ── 6. 레이블 텍스트 ────────────────────────────────────────────
  ctx.font = 'bold 17px -apple-system, sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.fillText(`${labelEmoji} ${label}`, cx, 215)

  // ── 7. 구분선 ───────────────────────────────────────────────────
  ctx.strokeStyle = '#f0f0f0'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(24, 258); ctx.lineTo(W - 24, 258)
  ctx.stroke()

  // ── 8. 3개 영역 프로그레스 바 ───────────────────────────────────
  const barX = 70, barW = W - barX - 80, barH = 10, barY0 = 280

  const areas = [
    { emoji: '💍', label: '결혼식', pct: weddingPct, color: '#FF6B9D' },
    { emoji: '🏡', label: '신혼집', pct: housePct,   color: '#5B8DEF' },
    { emoji: '✈️', label: '신혼여행', pct: honeymoonPct, color: '#C084FC' },
  ]

  areas.forEach(({ emoji, label: aLabel, pct, color }, i) => {
    const y = barY0 + i * 48

    // emoji + label
    ctx.font = '500 14px -apple-system, sans-serif'
    ctx.fillStyle = '#555'
    ctx.textAlign = 'left'
    ctx.fillText(emoji, 22, y + barH / 2 + 5)

    ctx.font = '600 12px -apple-system, sans-serif'
    ctx.fillStyle = '#666'
    ctx.fillText(aLabel, 46, y + barH / 2 + 5)

    // bar
    drawProgressBar(ctx, barX, y, barW, barH, pct, color, '#f0f0f0')

    // pct text
    ctx.font = 'bold 11px -apple-system, sans-serif'
    ctx.fillStyle = '#888'
    ctx.textAlign = 'right'
    ctx.fillText(`${pct}%`, W - 22, y + barH / 2 + 5)
  })

  // ── 9. D-day / 총 비용 칩 ────────────────────────────────────────
  ctx.strokeStyle = '#efefef'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(24, 426); ctx.lineTo(W - 24, 426)
  ctx.stroke()

  const chipY = 450
  const fmt = (n: number) => n >= 10000 ? `${(n / 10000).toFixed(1)}억원` : `${n.toLocaleString()}만원`

  // D-day 칩
  ctx.fillStyle = '#fff0f6'
  fillRoundRect(ctx, 24, chipY - 18, 150, 36, 10)
  ctx.font = 'bold 13px -apple-system, sans-serif'
  ctx.fillStyle = '#FF6B9D'
  ctx.textAlign = 'center'
  if (dday !== null && dday > 0) {
    ctx.fillText(`📅 D-${dday}`, 99, chipY + 5)
  } else {
    ctx.fillText('📅 D-day 미설정', 99, chipY + 5)
  }

  // 예산 칩
  ctx.fillStyle = '#f0f4ff'
  fillRoundRect(ctx, 186, chipY - 18, 180, 36, 10)
  ctx.font = 'bold 12px -apple-system, sans-serif'
  ctx.fillStyle = '#5B8DEF'
  ctx.textAlign = 'center'
  ctx.fillText(`💰 ${totalCost > 0 ? fmt(totalCost) : '미설정'}`, 276, chipY + 5)

  // ── 10. 하단 소개 문구 ────────────────────────────────────────────
  ctx.strokeStyle = '#efefef'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(24, 500); ctx.lineTo(W - 24, 500)
  ctx.stroke()

  ctx.font = '500 12px -apple-system, sans-serif'
  ctx.fillStyle = '#aaa'
  ctx.textAlign = 'center'
  ctx.fillText('결혼딸깍으로 함께 준비하고 있어요', cx, 525)

  ctx.font = '500 11px -apple-system, sans-serif'
  ctx.fillStyle = '#ccc'
  ctx.fillText(PROD_ORIGIN, cx, 545)

  return new Promise(resolve => canvas.toBlob(blob => resolve(blob!), 'image/png'))
}

// ── 메인 모달 컴포넌트 ────────────────────────────────────────────
export default function ScoreShareModal({
  score, weddingAreaPct, houseAreaPct, honeymoonAreaPct,
  dday, totalCost, isGuest, onClose, onGuestBlock,
}: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageBlob, setImageBlob] = useState<Blob | null>(null)
  const [generating, setGenerating] = useState(true)
  const [kakaoSent, setKakaoSent] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sharing, setSharing] = useState(false)
  const blobUrlRef = useRef<string | null>(null)

  const { text: label, emoji: labelEmoji } = getScoreLabel(score)

  useEffect(() => {
    let alive = true
    setGenerating(true)
    generateScoreImage({
      score, label, labelEmoji,
      weddingPct: weddingAreaPct,
      housePct: houseAreaPct,
      honeymoonPct: honeymoonAreaPct,
      dday, totalCost,
    }).then(blob => {
      if (!alive) return
      const url = URL.createObjectURL(blob)
      blobUrlRef.current = url
      setImageBlob(blob)
      setImageUrl(url)
      setGenerating(false)
    })
    return () => {
      alive = false
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
    }
  }, []) // eslint-disable-line

  function shareKakao() {
    if (isGuest) { onGuestBlock(); return }
    const kakao = window.Kakao
    const key = (import.meta.env.VITE_KAKAO_APP_KEY as string | undefined)
    if (kakao && key) {
      try { if (!kakao.isInitialized()) kakao.init(key) } catch { /* ignore */ }
    }
    if (kakao && kakao.isInitialized?.()) {
      const shareUrl = `${PROD_ORIGIN}`
      kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: `딸깍 스코어 ${score}점 💍`,
          description: `${labelEmoji} ${label}\n결혼딸깍으로 함께 준비 중이에요!`,
          imageUrl: `${PROD_ORIGIN}/og-image.png`,
          link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
        },
        buttons: [
          { title: '웹으로 보기', link: { mobileWebUrl: shareUrl, webUrl: shareUrl } },
        ],
      })
      setKakaoSent(true)
      setTimeout(() => setKakaoSent(false), 2500)
    } else {
      navigator.clipboard.writeText(PROD_ORIGIN).catch(() => {})
      alert('카카오톡 앱에서 링크를 붙여넣기 하세요.\n링크가 복사됐어요!')
    }
  }

  async function saveImage() {
    if (!imageBlob) return
    setSaving(true)
    try {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(imageBlob)
      a.download = 'ddalkak-score.png'
      a.click()
      URL.revokeObjectURL(a.href)
    } finally {
      setTimeout(() => setSaving(false), 1500)
    }
  }

  async function shareNative() {
    if (!imageBlob) return
    setSharing(true)
    try {
      const file = new File([imageBlob], 'ddalkak-score.png', { type: 'image/png' })
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: '우리 결혼 준비 현황 💍' })
      } else {
        // fallback: 이미지 저장
        await saveImage()
      }
    } catch (e) {
      // 취소 또는 미지원
      if ((e as Error)?.name !== 'AbortError') await saveImage()
    } finally {
      setSharing(false)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 2100, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: '24px 24px 0 0',
          padding: '20px 20px 32px', width: '100%', maxWidth: 480,
          boxShadow: '0 -8px 32px rgba(0,0,0,.18)',
          maxHeight: '90vh', overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 핸들 바 */}
        <div style={{ width: 40, height: 4, background: '#e0e0e0', borderRadius: 2, margin: '0 auto 16px' }} />

        <div style={{ fontSize: 16, fontWeight: 800, textAlign: 'center', marginBottom: 14 }}>
          📊 딸깍 스코어 공유
        </div>

        {/* 카드 미리보기 */}
        <div style={{
          borderRadius: 16, overflow: 'hidden', border: '1px solid #f0f0f0',
          marginBottom: 16, background: '#f8f8f8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: 220,
        }}>
          {generating ? (
            <div style={{ textAlign: 'center', color: '#aaa', padding: 24 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🎨</div>
              <div style={{ fontSize: 13 }}>카드 생성 중...</div>
            </div>
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt="딸깍 스코어 카드"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          ) : null}
        </div>

        {/* 공유 버튼들 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* 카카오톡 */}
          <button
            onClick={shareKakao}
            disabled={generating}
            style={{
              width: '100%', border: 'none', borderRadius: 12, padding: '14px 0',
              fontSize: 14, fontWeight: 700, cursor: generating ? 'not-allowed' : 'pointer',
              background: kakaoSent ? '#22c55e' : '#FEE500',
              color: kakaoSent ? '#fff' : '#3C1E1E',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background .2s', opacity: generating ? .5 : 1,
            }}
          >
            {kakaoSent ? '✅ 카카오톡으로 전송됐어요!' : (
              <>
                <img
                  src="https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_medium.png"
                  alt="kakao"
                  style={{ width: 20, height: 20, borderRadius: 4 }}
                />
                💛 카카오톡으로 공유
              </>
            )}
          </button>

          {/* 이미지 저장 */}
          <button
            onClick={saveImage}
            disabled={generating || saving}
            style={{
              width: '100%', border: '1.5px solid var(--pk)', borderRadius: 12, padding: '13px 0',
              fontSize: 14, fontWeight: 700, cursor: generating ? 'not-allowed' : 'pointer',
              background: '#fff', color: saving ? '#22c55e' : 'var(--pk)',
              transition: 'color .2s', opacity: generating ? .5 : 1,
            }}
          >
            {saving ? '✅ 저장됐어요!' : '💾 이미지로 저장'}
          </button>

          {/* 다른 앱으로 공유 */}
          <button
            onClick={shareNative}
            disabled={generating || sharing}
            style={{
              width: '100%', border: '1.5px solid var(--gray2)', borderRadius: 12, padding: '13px 0',
              fontSize: 14, fontWeight: 700, cursor: generating ? 'not-allowed' : 'pointer',
              background: '#fff', color: 'var(--text2)',
              opacity: generating ? .5 : 1,
            }}
          >
            {sharing ? '공유 중...' : '📤 다른 앱으로 공유'}
          </button>

          {/* 닫기 */}
          <button
            onClick={onClose}
            style={{
              width: '100%', background: 'var(--gray1)', border: 'none',
              borderRadius: 12, padding: '12px 0',
              fontSize: 14, fontWeight: 600, cursor: 'pointer', color: 'var(--text2)',
            }}
          >닫기</button>
        </div>
      </div>
    </div>
  )
}
