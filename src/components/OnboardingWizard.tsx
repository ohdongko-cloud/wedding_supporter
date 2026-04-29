import { useState } from 'react'

interface Props {
  nick: string
  onComplete: (weddingDate: string, budget: number, destination: 'dashboard' | 'calculator') => void
}

export default function OnboardingWizard({ nick, onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [weddingDate, setWeddingDate] = useState('')
  const [budget, setBudget] = useState('3000')

  const ddayMs = weddingDate ? new Date(weddingDate).getTime() - Date.now() : null
  const dday = ddayMs !== null ? Math.ceil(ddayMs / 86400000) : null

  const progress = step === 0 ? 33 : step === 1 ? 66 : 100

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 360, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,.25)' }}>
        {/* Progress bar */}
        <div style={{ height: 4, background: 'var(--gray1)' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,var(--pk),var(--mn))', transition: 'width .4s' }} />
        </div>

        <div style={{ padding: '24px 28px 28px' }}>

          {/* Step 0: 결혼 예정일 */}
          {step === 0 && (
            <div>
              <div style={{ fontSize: 22, textAlign: 'center', marginBottom: 8 }}>💍</div>
              <div style={{ fontSize: 18, fontWeight: 800, textAlign: 'center', marginBottom: 6 }}>{nick}님, 반가워요!</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'center', lineHeight: 1.7, marginBottom: 20 }}>
                결혼 예정일을 설정하면<br />D-day와 일정이 자동으로 계산돼요.
              </div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--pk)', marginBottom: 6 }}>결혼 예정일</label>
              <input
                type="date" value={weddingDate} onChange={e => setWeddingDate(e.target.value)}
                style={{ width: '100%', border: '2px solid var(--gray2)', borderRadius: 12, padding: '12px 14px', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
                autoFocus
              />
              {dday !== null && dday > 0 && (
                <div style={{ marginTop: 12, background: 'var(--pk5)', borderRadius: 10, padding: '10px', textAlign: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--pk)' }}>결혼식까지 D-{dday}!</span>
                </div>
              )}
              <button
                onClick={() => setStep(1)} disabled={!weddingDate}
                style={{ width: '100%', border: 'none', borderRadius: 12, padding: '14px 0', marginTop: 20, fontSize: 15, fontWeight: 700, cursor: weddingDate ? 'pointer' : 'not-allowed', background: weddingDate ? 'linear-gradient(135deg,var(--pk),var(--mn))' : 'var(--gray2)', color: weddingDate ? '#fff' : 'var(--text2)', transition: 'all .2s' }}
              >다음 →</button>
            </div>
          )}

          {/* Step 1: 총 예산 */}
          {step === 1 && (
            <div>
              <div style={{ fontSize: 22, textAlign: 'center', marginBottom: 8 }}>💰</div>
              <div style={{ fontSize: 18, fontWeight: 800, textAlign: 'center', marginBottom: 6 }}>총 예산 목표</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'center', lineHeight: 1.7, marginBottom: 20 }}>
                결혼식 + 신혼여행 + 신혼집을 합친<br />전체 예산 목표를 입력해주세요.<br />
                <span style={{ fontSize: 11, opacity: .7 }}>나중에 언제든 수정할 수 있어요.</span>
              </div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--pk)', marginBottom: 6 }}>총 예산 (만원)</label>
              <input
                type="number" value={budget} onChange={e => setBudget(e.target.value)}
                placeholder="예: 5000 (= 5천만원)"
                style={{ width: '100%', border: '2px solid var(--gray2)', borderRadius: 12, padding: '12px 14px', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
                autoFocus
              />
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text2)', textAlign: 'center' }}>
                {budget ? `입력값: ${parseInt(budget).toLocaleString('ko-KR')}만원` : '건너뛰어도 괜찮아요 →'}
              </div>
              <button
                onClick={() => setStep(2)}
                style={{ width: '100%', border: 'none', borderRadius: 12, padding: '14px 0', marginTop: 16, fontSize: 15, fontWeight: 700, cursor: 'pointer', background: 'linear-gradient(135deg,var(--pk),var(--mn))', color: '#fff', transition: 'all .2s' }}
              >{budget ? '다음 →' : '건너뛰기 →'}</button>
            </div>
          )}

          {/* Step 2: 어디로 이동할까요? */}
          {step === 2 && (
            <div>
              <div style={{ fontSize: 22, textAlign: 'center', marginBottom: 8 }}>🎉</div>
              <div style={{ fontSize: 18, fontWeight: 800, textAlign: 'center', marginBottom: 6 }}>준비 완료!</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'center', lineHeight: 1.7, marginBottom: 24 }}>
                {weddingDate && <div>📅 결혼 예정일 <b style={{ color: 'var(--pk)' }}>{weddingDate}</b></div>}
                {budget && <div>💰 총 예산 <b style={{ color: 'var(--pk)' }}>{parseInt(budget).toLocaleString()}만원</b></div>}
                <div style={{ marginTop: 10, fontSize: 13 }}>지금 뭐 할까요?</div>
              </div>

              <button
                onClick={() => onComplete(weddingDate, parseInt(budget) || 0, 'calculator')}
                style={{ width: '100%', border: 'none', borderRadius: 14, padding: '18px 16px', marginBottom: 10, fontSize: 15, fontWeight: 800, cursor: 'pointer', background: 'linear-gradient(135deg,var(--pk),var(--mn))', color: '#fff', textAlign: 'left', lineHeight: 1.5 }}
              >
                <div>💍 딸깍, 결혼비용 계산하러 가기</div>
                <div style={{ fontSize: 12, fontWeight: 400, opacity: .85, marginTop: 4 }}>내 스타일에 맞게 결혼 비용을 바로 계산해요</div>
              </button>

              <button
                onClick={() => onComplete(weddingDate, parseInt(budget) || 0, 'dashboard')}
                style={{ width: '100%', border: '2px solid var(--gray2)', borderRadius: 14, padding: '16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', background: '#fff', color: 'var(--text2)', textAlign: 'left' }}
              >
                🗺️ 혼자 둘러보기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
