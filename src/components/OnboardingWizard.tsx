import { useState } from 'react'

interface Props {
  nick: string
  onComplete: (weddingDate: string, budget: number, destination: 'dashboard' | 'calculator') => void
}

export default function OnboardingWizard({ nick, onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [weddingDate, setWeddingDate] = useState('')
  const [budget, setBudget] = useState('')

  const ddayMs = weddingDate ? new Date(weddingDate).getTime() - Date.now() : null
  const dday = ddayMs !== null ? Math.ceil(ddayMs / 86400000) : null

  const progress = step === 0 ? 33 : step === 1 ? 66 : 100

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 3000,
      background: 'rgba(0,0,0,.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
      boxSizing: 'border-box',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 24,
        width: '100%',
        maxWidth: 400,
        overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,.25)',
        maxHeight: 'calc(100vh - 32px)',
        overflowY: 'auto',
      }}>
        {/* Progress bar */}
        <div style={{ height: 4, background: 'var(--gray1)' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,var(--pk),var(--mn))', transition: 'width .4s' }} />
        </div>

        <div style={{ padding: '28px 24px 28px' }}>

          {/* Step 0: 결혼 예정일 */}
          {step === 0 && (
            <div>
              <div style={{ fontSize: 26, textAlign: 'center', marginBottom: 10 }}>💍</div>
              <div style={{ fontSize: 19, fontWeight: 800, textAlign: 'center', marginBottom: 6 }}>{nick}님, 반가워요!</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'center', lineHeight: 1.7, marginBottom: 22 }}>
                결혼 예정일을 설정하면<br />D-day와 일정이 자동으로 계산돼요.
              </div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--pk)', marginBottom: 8 }}>
                📅 결혼 예정일을 선택해주세요
              </label>
              <input
                type="date"
                value={weddingDate}
                onChange={e => setWeddingDate(e.target.value)}
                style={{
                  width: '100%', border: '2px solid var(--gray2)', borderRadius: 12,
                  padding: '13px 14px', fontSize: 16, outline: 'none', boxSizing: 'border-box',
                  color: weddingDate ? 'var(--text1)' : 'var(--text2)',
                }}
              />
              <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text2)', textAlign: 'center', opacity: .7 }}>
                날짜를 탭해서 연도·월·일을 선택하세요
              </div>
              {dday !== null && dday > 0 && (
                <div style={{ marginTop: 10, background: 'var(--pk5)', borderRadius: 10, padding: '10px', textAlign: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--pk)' }}>결혼식까지 D-{dday}!</span>
                </div>
              )}
              <button
                onClick={() => setStep(1)}
                disabled={!weddingDate}
                style={{
                  width: '100%', border: 'none', borderRadius: 12, padding: '14px 0', marginTop: 20,
                  fontSize: 15, fontWeight: 700,
                  cursor: weddingDate ? 'pointer' : 'not-allowed',
                  background: weddingDate ? 'linear-gradient(135deg,var(--pk),var(--mn))' : 'var(--gray2)',
                  color: weddingDate ? '#fff' : 'var(--text2)',
                  transition: 'all .2s',
                }}
              >다음 →</button>
              <button
                onClick={() => setStep(1)}
                style={{
                  display: 'block', margin: '10px auto 0', background: 'none', border: 'none',
                  fontSize: 12, color: 'var(--text2)', cursor: 'pointer', opacity: .65,
                  textDecoration: 'underline', padding: '4px 8px',
                }}
              >건너뛰기</button>
            </div>
          )}

          {/* Step 1: 결혼식 목표예산 */}
          {step === 1 && (
            <div>
              <div style={{ fontSize: 26, textAlign: 'center', marginBottom: 10 }}>💰</div>
              <div style={{ fontSize: 19, fontWeight: 800, textAlign: 'center', marginBottom: 6 }}>결혼식 목표예산</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'center', lineHeight: 1.7, marginBottom: 22 }}>
                결혼식에 사용할 예산을 입력해주세요.<br />
                <span style={{ fontSize: 11, opacity: .7 }}>나중에 언제든 수정할 수 있어요.</span>
              </div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--pk)', marginBottom: 8 }}>총 예산 (만원)</label>
              <input
                type="number"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                placeholder="예: 3000 (= 3천만원)"
                style={{
                  width: '100%', border: '2px solid var(--gray2)', borderRadius: 12,
                  padding: '13px 14px', fontSize: 16, outline: 'none', boxSizing: 'border-box',
                }}
              />
              <button
                onClick={() => setStep(2)}
                style={{
                  width: '100%', border: 'none', borderRadius: 12, padding: '14px 0', marginTop: 20,
                  fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  background: 'linear-gradient(135deg,var(--pk),var(--mn))', color: '#fff',
                  transition: 'all .2s',
                }}
              >다음 →</button>
              <button
                onClick={() => setStep(2)}
                style={{
                  display: 'block', margin: '10px auto 0', background: 'none', border: 'none',
                  fontSize: 12, color: 'var(--text2)', cursor: 'pointer', opacity: .65,
                  textDecoration: 'underline', padding: '4px 8px',
                }}
              >건너뛰기</button>
            </div>
          )}

          {/* Step 2: 어디로 이동할까요? */}
          {step === 2 && (
            <div>
              <div style={{ fontSize: 26, textAlign: 'center', marginBottom: 10 }}>🎉</div>
              <div style={{ fontSize: 19, fontWeight: 800, textAlign: 'center', marginBottom: 6 }}>준비 완료!</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'center', lineHeight: 1.8, marginBottom: 22 }}>
                {weddingDate && <div>📅 결혼 예정일 <b style={{ color: 'var(--pk)' }}>{weddingDate}</b></div>}
                {budget && <div>💰 목표 예산 <b style={{ color: 'var(--pk)' }}>{parseInt(budget).toLocaleString()}만원</b></div>}
                <div style={{ marginTop: 10, fontSize: 14, fontWeight: 700, color: 'var(--text1)' }}>결혼비용 바로 보러 가실래요?</div>
              </div>

              <button
                onClick={() => onComplete(weddingDate, parseInt(budget) || 0, 'calculator')}
                style={{
                  width: '100%', border: 'none', borderRadius: 14, padding: '18px 16px',
                  marginBottom: 10, fontSize: 15, fontWeight: 800, cursor: 'pointer',
                  background: 'linear-gradient(135deg,var(--pk),var(--mn))', color: '#fff',
                  textAlign: 'center', lineHeight: 1.5,
                }}
              >
                <div>💍 딸깍, 결혼비용 설계하기</div>
                <div style={{ fontSize: 12, fontWeight: 400, opacity: .85, marginTop: 4 }}>내 스타일에 맞게 결혼 비용을 바로 계산해요</div>
              </button>

              <button
                onClick={() => onComplete(weddingDate, parseInt(budget) || 0, 'dashboard')}
                style={{
                  width: '100%', border: '2px solid var(--gray2)', borderRadius: 14, padding: '16px',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer', background: '#fff',
                  color: 'var(--text2)', textAlign: 'center',
                }}
              >
                🗺️ 혼자 시작하기
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
