interface Props {
  onSave: () => void
  onDiscard: () => void
  onCancel: () => void
}

export default function LeaveConfirmModal({ onSave, onDiscard, onCancel }: Props) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onCancel}
    >
      <div
        style={{ background: '#fff', borderRadius: 20, padding: '28px 22px 22px', width: 300, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: 30, marginBottom: 10, textAlign: 'center' }}>💾</div>
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8, textAlign: 'center', color: 'var(--text)' }}>
          수정한 내용이 있어요
        </div>
        <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.75, marginBottom: 22, textAlign: 'center' }}>
          저장하지 않으면 변경사항이 사라져요.<br />
          저장하고 이동할까요?
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* 추천 액션: 저장 후 이동 */}
          <button
            onClick={onSave}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, var(--pk), var(--mn))',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: 13,
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            💾 저장하고 이동
          </button>

          {/* 저장 없이 이동 */}
          <button
            onClick={onDiscard}
            style={{
              width: '100%',
              background: 'var(--gray1)',
              color: 'var(--text2)',
              border: 'none',
              borderRadius: 12,
              padding: 13,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            저장 없이 이동
          </button>

          {/* 취소 */}
          <button
            onClick={onCancel}
            style={{
              width: '100%',
              background: 'none',
              color: 'var(--text2)',
              border: '1.5px solid var(--gray2)',
              borderRadius: 12,
              padding: 13,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            계속 수정하기
          </button>
        </div>
      </div>
    </div>
  )
}
