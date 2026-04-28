import { useState, useRef, KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
type Mode = 'splash' | 'register' | 'login'
export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('splash')
  const [nick, setNick] = useState('')
  const [pins, setPins] = useState<string[]>(Array(6).fill(''))
  const [adminPw, setAdminPw] = useState('')
  const [error, setError] = useState('')
  const pinRefs = useRef<(HTMLInputElement | null)[]>([])
  const navigate = useNavigate()
  const { register, login, loginAnon } = useAuthStore()
  const isAdmin = nick.trim().toLowerCase() === 'admin'
  const pin = isAdmin ? adminPw : pins.join('')
  function resetForm(m: Mode) { setNick(''); setPins(Array(6).fill('')); setAdminPw(''); setError(''); setMode(m); setTimeout(() => pinRefs.current[0]?.focus(), 100) }
  function handlePinChange(i: number, val: string) { const v = val.replace(/\D/, '').slice(0, 1); const next = [...pins]; next[i] = v; setPins(next); if (v && i < 5) pinRefs.current[i + 1]?.focus() }
  function handlePinKey(i: number, e: KeyboardEvent<HTMLInputElement>) { if (e.key === 'Backspace' && !pins[i] && i > 0) pinRefs.current[i - 1]?.focus() }
  function handlePinPaste(e: React.ClipboardEvent) { e.preventDefault(); const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6); const next = Array(6).fill(''); text.split('').forEach((c, i) => { next[i] = c }); setPins(next); pinRefs.current[Math.min(text.length, 5)]?.focus() }
  function submit() { setError(''); const res = mode === 'register' ? register(nick.trim(), pin) : login(nick.trim(), pin); if (res.ok) navigate('/'); else setError(res.error ?? '') }
  const base: React.CSSProperties = { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(145deg,#ff6b9d 0%,#ff8fab 40%,#c77dff 100%)', padding: 20 }
  const card: React.CSSProperties = { background: '#fff', borderRadius: 24, padding: '32px 28px', width: 340, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(255,107,157,.2)' }
  if (mode === 'splash') return (
    <div style={base}>
      <div style={{ width: 96, height: 96, borderRadius: '50%', border: '3px solid rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, marginBottom: 16 }}>💍</div>
      <div style={{ color: '#fff', fontSize: 26, fontWeight: 800, marginBottom: 6 }}>나만의 결혼 서포터</div>
      <div style={{ color: 'rgba(255,255,255,.75)', fontSize: 13, marginBottom: 40 }}>결혼 준비의 모든 것을 한 곳에서 💕</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 300 }}>
        <button style={{ background: '#fff', color: 'var(--pk)', border: 'none', borderRadius: 16, padding: '17px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer' }} onClick={() => resetForm('register')}>✨ 처음 시작하기</button>
        <button style={{ background: 'rgba(255,255,255,.2)', color: '#fff', border: '1.5px solid rgba(255,255,255,.4)', borderRadius: 16, padding: '17px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer' }} onClick={() => resetForm('login')}>🔐 저장된 내용 불러오기</button>
        <button style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: '1.5px solid rgba(255,255,255,.3)', borderRadius: 16, padding: '17px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: .8 }} onClick={() => { loginAnon(); navigate('/') }}>둘러보기 (저장 안 됨)</button>
      </div>
    </div>
  )
  return (
    <div style={base}>
      <div style={card}>
        <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 6 }}>{mode === 'register' ? '👋 처음 오셨군요!' : '🔐 저장된 내용 불러오기'}</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 22, lineHeight: 1.6 }}>{mode === 'register' ? '닉네임과 숫자 6자리 비밀번호로 저장할 수 있어요 💾' : '저장할 때 입력한 닉네임과 비밀번호를 입력해주세요.'}</div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--pk)', marginBottom: 6 }}>닉네임{mode === 'register' ? ' (2~20자)' : ''}</label>
          <input style={{ width: '100%', border: '2px solid var(--gray2)', borderRadius: 12, padding: '11px 14px', fontSize: 15, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }} value={nick} onChange={e => { setNick(e.target.value); setError('') }} placeholder={mode === 'register' ? '예: 민지&준호' : '닉네임 입력'} maxLength={20} onKeyDown={e => e.key === 'Enter' && submit()} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--pk)', marginBottom: 6 }}>
            {isAdmin ? '관리자 비밀번호' : '비밀번호 (숫자 6자리)'}
          </label>
          {isAdmin ? (
            <input
              type='password'
              value={adminPw}
              onChange={e => { setAdminPw(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder='관리자 비밀번호 입력'
              style={{ width: '100%', border: '2px solid var(--pk)', borderRadius: 12, padding: '11px 14px', fontSize: 15, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}
            />
          ) : (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }} onPaste={handlePinPaste}>
              {pins.map((p, i) => (
                <input key={i} ref={el => { pinRefs.current[i] = el }} style={{ width: 44, height: 52, border: '2px solid var(--gray2)', borderRadius: 12, textAlign: 'center', fontSize: 20, fontWeight: 700, outline: 'none', color: 'var(--text)' }} value={p} inputMode='numeric' maxLength={1} onChange={e => handlePinChange(i, e.target.value)} onKeyDown={e => handlePinKey(i, e)} />
              ))}
            </div>
          )}
        </div>
        <div style={{ fontSize: 12, color: '#e03060', minHeight: 16, marginBottom: 8 }}>{error}</div>
        <button style={{ width: '100%', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', background: 'linear-gradient(135deg,var(--pk),var(--mn))', color: '#fff' }} onClick={submit}>{mode === 'register' ? '시작하기 →' : '불러오기 →'}</button>
        <button style={{ width: '100%', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', background: 'var(--gray1)', color: 'var(--text2)', marginTop: 8 }} onClick={() => setMode('splash')}>← 돌아가기</button>
      </div>
    </div>
  )
}
