interface Props {
  onOverwrite: () => void
  onLoadServer: () => void
}

export default function ConflictModal({ onOverwrite, onLoadServer }: Props) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '28px 22px 22px', width: 310, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 30, marginBottom: 10, textAlign: 'center' }}>🔄</div>
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8, textAlign: 'center', color: 'var(--text)' }}>
          다른 기기에서도 수정이 있었어요
        </div>
        <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.75, marginBottom: 22, textAlign: 'center' }}>
          이 기기의 내용과 다른 기기의 내용이<br />
          서로 달라요. 어느 쪽을 저장할까요?
        </div>

        {/* 선택지 카드 2개 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <button
            onClick={onLoadServer}
            style={{
              flex: 1,
              background: 'var(--gray1)',
              color: 'var(--text)',
              border: '1.5px solid var(--gray2)',
              borderRadius: 12,
              padding: '12px 8px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              lineHeight: 1.5,
            }}
          >
            📱 다른 기기<br />
            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text2)' }}>내용 가져오기</span>
          </button>
          <button
            onClick={onOverwrite}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, var(--pk), var(--mn))',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '12px 8px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              lineHeight: 1.5,
            }}
          >
            💾 지금 이 기기<br />
            <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.85 }}>내용으로 저장</span>
          </button>
        </div>

        <div style={{ fontSize: 11, color: 'var(--text2)', textAlign: 'center', lineHeight: 1.6 }}>
          선택하지 않은 쪽의 내용은 사라져요
        </div>
      </div>
    </div>
  )
}
