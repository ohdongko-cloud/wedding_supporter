import { useState } from 'react'

interface Props {
  shareUrl: string
  onClose: () => void
}

export default function ShareModal({ shareUrl, onClose }: Props) {
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      prompt('링크를 직접 복사하세요', shareUrl)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '24px 22px', width: 310, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 28, marginBottom: 10, textAlign: 'center' }}>💌</div>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6, textAlign: 'center' }}>결과 공유하기</div>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16, textAlign: 'center', lineHeight: 1.6 }}>
          공유 링크는 조회 전용이에요.<br />수정하려면 계정 로그인이 필요해요.
        </div>
        <div style={{ background: 'var(--pk5)', borderRadius: 10, padding: '10px 12px', marginBottom: 14, wordBreak: 'break-all', fontSize: 11, color: 'var(--text2)' }}>
          {shareUrl}
        </div>
        <button
          onClick={copyLink}
          style={{ width: '100%', background: copied ? 'var(--gr)' : 'var(--pk)', color: '#fff', border: 'none', borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'background .2s', marginBottom: 8 }}
        >
          {copied ? '✅ 링크가 복사됐어요!' : '🔗 링크 복사'}
        </button>
        <button onClick={onClose} style={{ width: '100%', background: 'var(--gray1)', color: 'var(--text2)', border: 'none', borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>닫기</button>
      </div>
    </div>
  )
}
