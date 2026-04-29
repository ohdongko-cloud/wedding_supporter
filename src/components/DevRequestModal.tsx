import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { DevRequestService } from '../services/devRequests'

interface Props { onClose: () => void }

export default function DevRequestModal({ onClose }: Props) {
  const user = useAuthStore(s => s.user)
  const [content, setContent] = useState('')
  const [toast, setToast] = useState(false)

  function submit() {
    if (content.trim().length < 10) return
    DevRequestService.add(user?.nick ?? '게스트', content.trim())
    setToast(true)
    setTimeout(() => { setToast(false); onClose() }, 2000)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 360, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}
        onClick={e => e.stopPropagation()}
      >
        {toast ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>✅</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gr)' }}>요청이 전달됐어요!</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 6 }}>소중한 의견 감사합니다 💕</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>💬 개발 요청</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 14, lineHeight: 1.6 }}>
              불편한 점, 추가됐으면 하는 기능, 버그 등<br />
              무엇이든 자유롭게 남겨주세요.
            </div>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              maxLength={500}
              placeholder='내용을 입력해주세요. (최소 10자)'
              style={{
                width: '100%', minHeight: 120, border: '1.5px solid var(--gray2)', borderRadius: 10,
                padding: '10px 12px', fontSize: 13, resize: 'none', outline: 'none',
                fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box',
              }}
            />
            <div style={{ fontSize: 11, color: 'var(--text2)', textAlign: 'right', marginBottom: 14 }}>
              {content.length}/500
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={onClose} style={{ flex: 1, background: 'var(--gray1)', color: 'var(--text)', border: 'none', borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>취소</button>
              <button
                onClick={submit}
                disabled={content.trim().length < 10}
                style={{
                  flex: 2, background: content.trim().length >= 10 ? 'var(--pk)' : 'var(--gray2)',
                  color: '#fff', border: 'none', borderRadius: 10, padding: 12,
                  fontSize: 14, fontWeight: 700, cursor: content.trim().length >= 10 ? 'pointer' : 'default',
                }}
              >
                전송하기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
