import { useState } from 'react'

interface Props {
  nick: string
  onClose: () => void
}

export default function PartnerInviteModal({ nick, onClose }: Props) {
  const [copied, setCopied] = useState(false)

  async function copyNick() {
    const text = `딸깍, 결혼비용 계산기\n공유 닉네임: ${nick}\nhttps://weddingsupporter.vercel.app`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      prompt('아래 내용을 복사해서 파트너에게 보내주세요', text)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 24, padding: '28px 24px', width: '100%', maxWidth: 340, boxShadow: '0 24px 80px rgba(0,0,0,.2)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 10 }}>👫</div>
        <div style={{ fontSize: 17, fontWeight: 800, textAlign: 'center', marginBottom: 6 }}>파트너와 함께 사용하기</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'center', lineHeight: 1.7, marginBottom: 20 }}>
          아래 닉네임으로 파트너도 로그인하면<br />같은 데이터를 함께 관리할 수 있어요.
        </div>

        {/* Nickname display */}
        <div style={{ background: 'var(--pk5)', border: '1.5px solid var(--pk4)', borderRadius: 12, padding: '14px 16px', marginBottom: 10, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>공유 닉네임</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--pk)' }}>{nick}</div>
        </div>

        <button
          onClick={copyNick}
          style={{ width: '100%', background: copied ? '#22c55e' : 'var(--pk)', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'background .2s', marginBottom: 8 }}
        >
          {copied ? '✅ 복사됐어요!' : '📋 닉네임 복사 (링크 포함)'}
        </button>

        {/* PIN notice */}
        <div style={{ background: '#fff8f0', border: '1.5px solid #ffd0a0', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#e67e22', marginBottom: 4 }}>🔑 비밀번호 공유 안내</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
            비밀번호(6자리)는 파트너에게 직접 알려주세요.<br />
            보안을 위해 앱 내에서는 표시되지 않아요.
          </div>
        </div>

        {/* Usage tips */}
        <div style={{ background: 'var(--gray1)', borderRadius: 10, padding: '12px 14px', marginBottom: 18 }}>
          <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.8 }}>
            💡 <b>사용 방법</b><br />
            1. 위 닉네임과 비밀번호를 파트너에게 알려주세요<br />
            2. 파트너가 "저장된 내용 불러오기"로 로그인<br />
            3. 함께 체크리스트·예산을 관리하세요!<br />
            <span style={{ fontSize: 11, opacity: .7 }}>※ 마지막 저장 내용 기준으로 반영돼요</span>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{ width: '100%', background: 'var(--gray1)', color: 'var(--text2)', border: 'none', borderRadius: 10, padding: '12px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          닫기
        </button>
      </div>
    </div>
  )
}
