import { useState } from 'react'

declare global { interface Window { Kakao: any } }

// Android WebView에서는 window.location.origin이 localhost가 되므로 항상 실제 도메인 사용
const PROD_ORIGIN = 'https://weddingsupporter.vercel.app'
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.ddalkag.wedding'

interface Props {
  shareUrl: string
  onClose: () => void
}

export default function ShareModal({ shareUrl, onClose }: Props) {
  const [copied, setCopied] = useState(false)
  const [kakaoSent, setKakaoSent] = useState(false)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      prompt('링크를 직접 복사하세요', shareUrl)
    }
  }

  function shareKakao() {
    const kakao = window.Kakao
    const key = (import.meta.env.VITE_KAKAO_APP_KEY as string | undefined)
    // lazy init: SDK가 로드됐지만 아직 초기화 안 된 경우 재시도
    if (kakao && key) {
      try { if (!kakao.isInitialized()) kakao.init(key) } catch { /* ignore */ }
    }
    if (kakao && kakao.isInitialized?.()) {
      kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: '결혼 준비 현황 공유 💍',
          description: '내 결혼 준비 현황을 확인해보세요!',
          // 네이티브에서는 window.location.origin이 localhost → 항상 PROD_ORIGIN 사용
          imageUrl: `${PROD_ORIGIN}/og-image.png`,
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl,
          },
        },
        buttons: [
          {
            // 앱 미설치 사용자 → 웹으로 바로 열기
            title: '웹으로 보기',
            link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
          },
          {
            // 앱 설치로 이동
            title: '앱으로 보기',
            link: {
              mobileWebUrl: PLAY_STORE_URL,
              webUrl: PLAY_STORE_URL,
              androidExecutionParams: `shareUrl=${encodeURIComponent(shareUrl)}`,
              androidDownloadUrl: PLAY_STORE_URL,
            },
          },
        ],
      })
      setKakaoSent(true)
      setTimeout(() => setKakaoSent(false), 2500)
    } else {
      // Kakao SDK 미초기화 시 링크 복사 후 안내
      navigator.clipboard.writeText(shareUrl).catch(() => {})
      alert('카카오톡 앱에서 링크를 붙여넣기 하세요.\n링크가 복사됐어요!')
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 20, padding: '24px 22px', width: 310, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: 28, marginBottom: 10, textAlign: 'center' }}>💌</div>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6, textAlign: 'center' }}>결과 공유하기</div>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16, textAlign: 'center', lineHeight: 1.6 }}>
          공유 링크는 조회 전용이에요.<br />수정하려면 계정 로그인이 필요해요.
        </div>
        <div style={{ background: 'var(--pk5)', borderRadius: 10, padding: '10px 12px', marginBottom: 14, wordBreak: 'break-all', fontSize: 11, color: 'var(--text2)' }}>
          {shareUrl}
        </div>

        {/* 카카오톡 공유 버튼 */}
        <button
          onClick={shareKakao}
          style={{
            width: '100%', background: kakaoSent ? '#22c55e' : '#FEE500',
            color: kakaoSent ? '#fff' : '#3C1E1E',
            border: 'none', borderRadius: 10, padding: 13,
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
            transition: 'background .2s', marginBottom: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          {kakaoSent ? '✅ 카카오톡으로 전송됐어요!' : (
            <>
              <img src="https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_medium.png" alt="kakao" style={{ width: 20, height: 20, borderRadius: 4 }} />
              카카오톡으로 공유하기
            </>
          )}
        </button>

        {kakaoSent && (
          <div style={{ fontSize: 11, color: 'var(--text2)', textAlign: 'center', marginBottom: 8, lineHeight: 1.5 }}>
            받는 분이 <b>웹으로 보기</b> 또는 <b>앱으로 보기</b>를 선택할 수 있어요
          </div>
        )}

        <button
          onClick={copyLink}
          style={{ width: '100%', background: copied ? '#22c55e' : 'var(--pk)', color: '#fff', border: 'none', borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'background .2s', marginBottom: 8 }}
        >
          {copied ? '✅ 링크가 복사됐어요!' : '🔗 링크 복사'}
        </button>
        <button
          onClick={onClose}
          style={{ width: '100%', background: 'var(--gray1)', color: 'var(--text2)', border: 'none', borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >닫기</button>
      </div>
    </div>
  )
}
