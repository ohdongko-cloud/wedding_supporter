import { useState, useRef, KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

type Mode = 'login' | 'register'

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [nick, setNick] = useState('')
  const [pins, setPins] = useState<string[]>(Array(6).fill(''))
  const [adminPw, setAdminPw] = useState('')
  const [hintInput, setHintInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loginFailCount, setLoginFailCount] = useState(0)
  const [shownHint, setShownHint] = useState('')
  const pinRefs = useRef<(HTMLInputElement | null)[]>([])
  const navigate = useNavigate()
  const { register, login, loginAnon } = useAuthStore()

  const isAdmin = nick.trim().toLowerCase() === 'admin'
  const pin = isAdmin ? adminPw : pins.join('')
  const pinFilled = pins.filter(Boolean).length
  const canSubmit = nick.trim().length >= 2 && (isAdmin ? !!adminPw : pinFilled === 6)

  function switchMode(m: Mode) {
    setMode(m)
    setError('')
    setShownHint('')
    setLoginFailCount(0)
    setPins(Array(6).fill(''))
    setHintInput('')
  }

  /* ── 로그인 ── */
  async function doLogin(pinVal?: string) {
    const p = pinVal ?? pin
    if (loading) return
    if (!nick.trim()) { setError('닉네임을 입력해주세요.'); return }
    if (isAdmin && !adminPw) { setError('관리자 비밀번호를 입력해주세요.'); return }
    if (!isAdmin && p.length < 6) { setError('비밀번호 6자리를 모두 입력해주세요.'); return }

    setError(''); setShownHint(''); setLoading(true)
    const res = await login(nick.trim(), p)
    setLoading(false)

    if (res.ok) { navigate('/'); return }

    const newFail = loginFailCount + 1
    setLoginFailCount(newFail)

    if (newFail >= 2 && res.hint) {
      setShownHint(res.hint)
    }
    setError(res.error ?? '로그인에 실패했어요.')
  }

  /* ── 간편가입 ── */
  async function doRegister() {
    if (loading) return
    if (!nick.trim()) { setError('닉네임을 입력해주세요.'); return }
    if (pin.length < 6) { setError('비밀번호 6자리를 모두 입력해주세요.'); return }

    setError(''); setLoading(true)
    const res = await register(nick.trim(), pin, hintInput.trim() || undefined)
    setLoading(false)

    if (res.ok) navigate('/')
    else setError(res.error ?? '')
  }

  /* ── PIN 핸들러 ── */
  function handlePinChange(i: number, val: string) {
    const v = val.replace(/\D/, '').slice(0, 1)
    const next = [...pins]; next[i] = v; setPins(next)
    if (v && i < 5) {
      pinRefs.current[i + 1]?.focus()
    } else if (v && i === 5 && mode === 'login') {
      const fullPin = next.join('')
      if (nick.trim().length >= 2 && fullPin.length === 6) doLogin(fullPin)
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
    pinRefs.current[Math.min(text.length, 5)]?.focus()
    if (mode === 'login' && nick.trim().length >= 2 && text.length === 6) {
      setTimeout(() => doLogin(text), 50)
    }
  }

  /* ── 공통 스타일 ── */
  const pinBoxStyle = (filled: boolean): React.CSSProperties => ({
    width: 44, height: 52,
    border: `2px solid ${filled ? 'var(--pk)' : 'var(--gray2)'}`,
    borderRadius: 12, textAlign: 'center',
    fontSize: 22, fontWeight: 700,
    outline: 'none', color: 'var(--text)',
    transition: 'border-color .15s',
  })

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
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

        {/* 모드 탭 */}
        {!isAdmin && (
          <div style={{ display: 'flex', marginBottom: 20, border: '1.5px solid var(--gray2)', borderRadius: 12, overflow: 'hidden' }}>
            {(['login', 'register'] as Mode[]).map(m => (
              <button key={m} onClick={() => switchMode(m)} style={{
                flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 700,
                background: mode === m ? 'var(--pk)' : 'transparent',
                color: mode === m ? '#fff' : 'var(--text2)',
                transition: 'all .15s',
              }}>
                {m === 'login' ? '로그인' : '간편가입'}
              </button>
            ))}
          </div>
        )}

        {/* 닉네임 */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--pk)', marginBottom: 6 }}>닉네임</label>
          <input
            style={{ width: '100%', border: '2px solid var(--gray2)', borderRadius: 12, padding: '12px 14px', fontSize: 15, color: 'var(--text)', outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s' }}
            value={nick}
            onChange={e => { setNick(e.target.value); setError(''); setShownHint(''); setLoginFailCount(0) }}
            placeholder='예: 민지&준호'
            maxLength={20}
            onKeyDown={e => e.key === 'Enter' && pinRefs.current[0]?.focus()}
            autoFocus
          />
        </div>

        {/* 비밀번호 */}
        <div style={{ marginBottom: 6 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--pk)', marginBottom: 6 }}>
            {isAdmin ? '관리자 비밀번호' : '비밀번호 (숫자 6자리)'}
          </label>
          {isAdmin ? (
            <input
              type='password'
              value={adminPw}
              onChange={e => { setAdminPw(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && doLogin()}
              placeholder='관리자 비밀번호 입력'
              style={{ width: '100%', border: '2px solid var(--pk)', borderRadius: 12, padding: '12px 14px', fontSize: 15, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}
            />
          ) : (
            <div style={{ display: 'flex', gap: 7, justifyContent: 'center' }} onPaste={handlePinPaste}>
              {pins.map((p, i) => (
                <input
                  key={i}
                  ref={el => { pinRefs.current[i] = el }}
                  style={pinBoxStyle(!!p)}
                  value={p}
                  inputMode='numeric'
                  maxLength={1}
                  onChange={e => handlePinChange(i, e.target.value)}
                  onKeyDown={e => {
                    handlePinKey(i, e)
                    if (e.key === 'Enter' && pinFilled === 6) {
                      mode === 'login' ? doLogin() : doRegister()
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* 비밀번호 힌트 입력 (가입 모드) */}
        {mode === 'register' && !isAdmin && (
          <div style={{ marginTop: 12, marginBottom: 4 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--pk)', marginBottom: 6 }}>
              비밀번호 힌트 <span style={{ fontWeight: 400, color: 'var(--text2)' }}>(선택 · 비밀번호 분실 시 도움이 돼요)</span>
            </label>
            <input
              value={hintInput}
              onChange={e => setHintInput(e.target.value)}
              placeholder='예: 우리가 처음 만난 날 🗓️'
              maxLength={40}
              style={{ width: '100%', border: '2px solid var(--gray2)', borderRadius: 12, padding: '11px 14px', fontSize: 13, color: 'var(--text)', outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s' }}
            />
          </div>
        )}

        {/* 에러 */}
        <div style={{ fontSize: 12, color: '#e03060', minHeight: 18, marginTop: 10, marginBottom: 4, textAlign: 'center' }}>{error}</div>

        {/* 힌트 박스 (로그인 2회 실패 시) */}
        {shownHint && (
          <div style={{ background: '#fff8e1', border: '1.5px solid #ffe082', borderRadius: 10, padding: '10px 14px', marginBottom: 10, fontSize: 13, color: '#7c5c00', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
            <span><b>비밀번호 힌트</b><br />{shownHint}</span>
          </div>
        )}

        {/* 버튼 영역 */}
        {mode === 'login' ? (
          <>
            <button
              onClick={() => doLogin()}
              disabled={loading || !canSubmit}
              style={{
                width: '100%', border: 'none', borderRadius: 12, padding: '15px 0',
                fontSize: 16, fontWeight: 800, marginBottom: 8,
                cursor: canSubmit && !loading ? 'pointer' : 'not-allowed',
                background: canSubmit && !loading ? 'linear-gradient(135deg,var(--pk),var(--mn))' : 'var(--gray2)',
                color: '#fff', transition: 'all .2s',
              }}
            >
              {loading ? '잠시만요...' : '⚡ 로그인'}
            </button>
            <button
              onClick={() => switchMode('register')}
              style={{
                width: '100%', border: '1.5px solid var(--pk)', borderRadius: 12, padding: '13px 0',
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                background: '#fff', color: 'var(--pk)', marginBottom: 8,
                transition: 'all .2s',
              }}
            >
              ✨ 간편가입
            </button>
          </>
        ) : (
          <button
            onClick={doRegister}
            disabled={loading || !canSubmit}
            style={{
              width: '100%', border: 'none', borderRadius: 12, padding: '15px 0',
              fontSize: 16, fontWeight: 800, marginBottom: 8,
              cursor: canSubmit && !loading ? 'pointer' : 'not-allowed',
              background: canSubmit && !loading ? 'linear-gradient(135deg,#c77dff,var(--pk))' : 'var(--gray2)',
              color: '#fff', transition: 'all .2s',
            }}
          >
            {loading ? '잠시만요...' : '✨ 간편가입'}
          </button>
        )}

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

        {/* 하단 안내 */}
        <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text2)', textAlign: 'center', lineHeight: 1.7 }}>
          {mode === 'login' ? (
            <>기존 계정 비밀번호 입력 시 로그인됩니다 🙂</>
          ) : (
            <>닉네임 + 비밀번호로 데이터가 저장돼요<br />
              <span style={{ opacity: .65 }}>다른 기기에서도 같은 계정으로 접속 가능해요</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
