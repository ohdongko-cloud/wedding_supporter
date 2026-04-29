interface Props {
  onOverwrite: () => void
  onLoadServer: () => void
}

export default function ConflictModal({ onOverwrite, onLoadServer }: Props) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '24px 22px', width: 310, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 28, marginBottom: 10, textAlign: 'center' }}>⚠️</div>
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>다른 기기에서 수정된 내용이 있어요.</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 20, textAlign: 'center' }}>
          내 변경사항으로 덮어쓰면<br />다른 기기의 수정사항이 사라질 수 있어요.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onLoadServer} style={{ flex: 1, background: 'var(--gray1)', color: 'var(--text)', border: 'none', borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>서버 내용 불러오기</button>
          <button onClick={onOverwrite} style={{ flex: 1, background: '#e03060', color: '#fff', border: 'none', borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>내 내용으로 덮어쓰기</button>
        </div>
      </div>
    </div>
  )
}
