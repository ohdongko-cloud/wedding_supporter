import { useState, useRef, KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function AuthPage() {
  const [nick, setNick] = useState('')
  const [pins, setPins] = useState<string[]>(Array(6).fill(''))
  const [adminPw, setAdminPw] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const pinRefs = useRef<(HTMLInputElement | null)[]>([])
  const navigate = useNavigate()
  const { register, login, loginAnon } = useAuthStore()

  const isAdmin = nick.trim().toLowerCase() === 'admin'
  const pin = isAdmin ? adminPw : pins.join('')

  async function doSubmit(pinVal: string) {
    if (loading) return
    if (!nick.trim()) { setError('닉네임을 입력해주세요.'); return }
    if (isAdmin && !adminPw) { setError('관리자 비밀번호를 입력해주세요.'); return }
    if (!isAdmin && pinVal.length < 6) { setError('비밀번호 6자리를 모두 입력해주세요.'); return }

    setError('')
    setLoading(true)

    const loginRes = await login(nick.trim(), pinVal)
    if (loginRes.ok) { navigate('/'); return }

    if (loginRes.error?.includes('저장된 데이터가 없어요')) {
      const regRes = await register(nick.trim(), pinVal)
      setLoading(false)
      if (regRes.ok) navigate('/')
      else setError(regRes.error ?? '')
      return
    }

    setLoading(false)
    setError(loginRes.error ?? '')
  }

  function handleSmartSubmit() { doSubmit(pin) }

  function handlePinChange(i: number, val: string) {
    const v = val.replace(/\D/, '').slice(0, 1)
    const next = [...pins]; next[i] = v; setPins(next)
    if (v && i < 5) {
      pinRefs.current[i + 1]?.focus()
    } else if (v && i === 5) {
      // 마지막 자리 입력 시 자동 로그인
      const fullPin = next.join('')
      if (nick.trim().length >= 2 && fullPin.length === 6) {
        doSubmit(fullPin)
      }
    }
  }
  function handlePinKey(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !pins[i] && i > 0) pinRefs.current[i - 1]?.focus()
  }
  function handlePinPaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next = Array(6).fill('')
    text.split('').forEach((c, i) => { next[i] = c })
    setPins(next)
    const fullPin = next.join('')
    pinRefs.current[Math.min(text.length, 5)]?.focus()
    // 6자리 붙여넣기 시 자동 로그인
    if (nick.trim().length >= 2 && fullPin.length === 6) {
      setTimeout(() => doSubmit(fullPin), 50)
    }
  }

  const pinFilled = pins.filter(Boolean).length
  const canSubmit = nick.trim().length >= 2 && (isAdmin ? !!adminPw : pinFilled === 6)

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(145deg,#ff6b9d 0%,#ff8fab 40%,#c77dff 100%)',
      padding: '20px 20px 40px',
    }}>
      {/* Branding */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, margin: '0 auto 14px' }}>💍</div>
        <div style={{ color: '#fff', fontSize: 24, fontWeight: 800, marginBottom: 4 }}>딸깍, 결혼비용 계산기</div>
        <div style={{ color: 'rgba(255,255,255,.75)', fontSize: 13 }}>예산부터 체크리스트까지 한 번에 관리</div>
      </div>

      {/* Card */}
      <div style={{ background: '#fff', borderRadius: 24, padding: '28px 24px 24px', width: '100%', maxWidth: 360, boxShadow: '0 20px 60px rgba(255,107,157,.25)' }}>
        {/* Nickname */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--pk)', marginBottom: 6 }}>닉네임</label>
          <input
            style={{ width: '100%', border: '2px solid var(--gray2)', borderRadius: 12, padding: '12px 14px', fontSize: 15, color: 'var(--text)', outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s' }}
            value={nick}
            onChange={e => { setNick(e.target.value); setError('') }}
            placeholder='예: 민지&준호'
            maxLength={20}
            onKeyDown={e => e.key === 'Enter' && pinRefs.current[0]?.focus()}
            autoFocus
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: 6 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--pk)', marginBottom: 6 }}>
            {isAdmin ? '관리자 비밀번호' : '비밀번호 (숫자 6자리)'}
          </label>
          {isAdmin ? (
            <input
              type='password'
              value={adminPw}
              onChange={e => { setAdminPw(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleSmartSubmit()}
              placeholder='관리자 비밀번호 입력'
              style={{ width: '100%', border: '2px solid var(--pk)', borderRadius: 12, padding: '12px 14px', fontSize: 15, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}
            />
          ) : (
            <div style={{ display: 'flex', gap: 7, justifyContent: 'center' }} onPaste={handlePinPaste}>
              {pins.map((p, i) => (
                <input
                  key={i}
                  ref={el => { pinRefs.current[i] = el }}
                  style={{
                    width: 44, height: 52,
                    border: `2px solid ${p ? 'var(--pk)' : 'var(--gray2)'}`,
                    borderRadius: 12, textAlign: 'center',
                    fontSize: 22, fontWeight: 700,
                    outline: 'none', color: 'var(--text)',
                    transition: 'border-color .15s',
                  }}
                  value={p}
                  inputMode='numeric'
                  maxLength={1}
                  onChange={e => handlePinChange(i, e.target.value)}
                  onKeyDown={e => {
                    handlePinKey(i, e)
                    if (e.key === 'Enter' && pinFilled === 6) handleSmartSubmit()
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Error */}
        <div style={{ fontSize: 12, color: '#e03060', minHeight: 18, marginBottom: 12, whiteSpace: 'pre-line', textAlign: 'center' }}>{error}</div>

        {/* CTA */}
        <button
          onClick={handleSmartSubmit}
          disabled={loading || !canSubmit}
          style={{
            width: '100%', border: 'none', borderRadius: 12, padding: '15px 0',
            fontSize: 16, fontWeight: 800,
            cursor: canSubmit && !loading ? 'pointer' : 'not-allowed',
            background: canSubmit && !loading ? 'linear-gradient(135deg,var(--pk),var(--mn))' : 'var(--gray2)',
            color: '#fff',
            transition: 'all .2s',
            marginBottom: 10,
          }}
        >
          {loading ? '잠시만요...' : '⚡ 로그인 / 가입하기'}
        </button>

        <button
          onClick={() => { loginAnon(); navigate('/') }}
          style={{
            width: '100%', border: '1.5px solid var(--gray2)', borderRadius: 12, padding: '13px 0',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            background: 'var(--gray1)', color: 'var(--text2)',
          }}
        >
          게스트 모드
        </button>

        <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text2)', textAlign: 'center', lineHeight: 1.6 }}>
          기존 계정이면 비밀번호 입력 즉시 로그인 🙂<br />
          <span style={{ opacity: .65 }}>처음이면 자동으로 가입됩니다</span>
        </div>
      </div>
    </div>
  )
}
