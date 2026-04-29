import { useState } from 'react'

interface Props {
  nick: string
  onComplete: (weddingDate: string, budget: number) => void
}

const STEPS = ['결혼 예정일', '총 예산', '시작!']

export default function OnboardingWizard({ nick, onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [weddingDate, setWeddingDate] = useState('')
  const [budget, setBudget] = useState('3000')

  function next() {
    if (step < 2) setStep(s => s + 1)
    else onComplete(weddingDate, parseInt(budget) || 0)
  }

  const canNext = step === 0 ? !!weddingDate : true

  const ddayMs = weddingDate ? new Date(weddingDate).getTime() - Date.now() : null
  const dday = ddayMs !== null ? Math.ceil(ddayMs / 86400000) : null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 360, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,.25)' }}>
        {/* Progress bar */}
        <div style={{ height: 4, background: 'var(--gray1)' }}>
          <div style={{ height: '100%', width: `${((step + 1) / 3) * 100}%`, background: 'linear-gradient(90deg,var(--pk),var(--mn))', transition: 'width .4s' }} />
        </div>

        {/* Step indicators */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, padding: '16px 0 0', marginBottom: 4 }}>
          {STEPS.map((label, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800,
                background: i <= step ? 'var(--pk)' : 'var(--gray1)',
                color: i <= step ? '#fff' : 'var(--text2)',
                transition: 'all .3s',
              }}>
                {i < step ? '✓' : i + 1}
              </div>
              <div style={{ fontSize: 10, color: i === step ? 'var(--pk)' : 'var(--text2)', fontWeight: i === step ? 700 : 400 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: '16px 28px 28px' }}>
          {step === 0 && (
            <div>
              <div style={{ fontSize: 22, textAlign: 'center', marginBottom: 8 }}>💍</div>
              <div style={{ fontSize: 18, fontWeight: 800, textAlign: 'center', marginBottom: 6 }}>
                {nick}님, 반가워요!
              </div>
              <div style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'center', lineHeight: 1.7, marginBottom: 20 }}>
                결혼 예정일을 설정하면<br />D-day와 일정이 자동으로 계산돼요.
              </div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--pk)', marginBottom: 6 }}>결혼 예정일</label>
              <input
                type="date"
                value={weddingDate}
                onChange={e => setWeddingDate(e.target.value)}
                style={{ width: '100%', border: '2px solid var(--gray2)', borderRadius: 12, padding: '12px 14px', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
                autoFocus
              />
              {dday !== null && dday > 0 && (
                <div style={{ marginTop: 12, background: 'var(--pk5)', borderRadius: 10, padding: '10px', textAlign: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--pk)' }}>결혼식까지 D-{dday}!</span>
                </div>
              )}
            </div>
          )}

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
                type="number"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                placeholder="예: 5000 (= 5천만원)"
                style={{ width: '100%', border: '2px solid var(--gray2)', borderRadius: 12, padding: '12px 14px', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
                autoFocus
              />
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text2)', textAlign: 'center' }}>
                {budget ? `입력값: ${parseInt(budget).toLocaleString('ko-KR')}만원` : '건너뛰어도 괜찮아요 →'}
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>준비 완료!</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.8, marginBottom: 20 }}>
                {weddingDate && <div>📅 결혼 예정일 <b style={{ color: 'var(--pk)' }}>{weddingDate}</b></div>}
                {budget && <div>💰 총 예산 목표 <b style={{ color: 'var(--pk)' }}>{parseInt(budget).toLocaleString()}만원</b></div>}
                <div style={{ marginTop: 8, fontSize: 12, opacity: .75 }}>체크리스트, 비용 계산기, 메모장이 기다리고 있어요!</div>
              </div>
            </div>
          )}

          <button
            onClick={next}
            disabled={!canNext}
            style={{
              width: '100%', border: 'none', borderRadius: 12, padding: '14px 0',
              fontSize: 15, fontWeight: 700, cursor: canNext ? 'pointer' : 'not-allowed',
              background: canNext ? 'linear-gradient(135deg,var(--pk),var(--mn))' : 'var(--gray1)',
              color: canNext ? '#fff' : 'var(--text2)',
              transition: 'all .2s', marginTop: 4,
            }}
          >
            {step === 2 ? '대시보드로 이동 →' : step === 1 ? (budget ? '다음 →' : '건너뛰기 →') : '다음 →'}
          </button>
        </div>
      </div>
    </div>
  )
}
