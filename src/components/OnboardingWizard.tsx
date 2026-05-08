import { useState, useEffect } from 'react'

type WeddingStyle = 'simple' | 'basic' | 'luxury'
type HoneymoonType = 'simple' | 'basic' | 'luxury'
type HousingType = 'buy' | 'jeonse' | 'rent'

export interface OnboardingResult {
  weddingDate: string
  budget: number
  weddingStyle: WeddingStyle | null
  honeymoonType: HoneymoonType | null
  housingType: HousingType | null
  destination: 'dashboard' | 'calculator'
}

interface Props {
  nick: string
  onComplete: (result: OnboardingResult) => void
}

// 스타일별 예산 힌트
const BUDGET_HINTS: Record<WeddingStyle, { label: string; quick: number[] }> = {
  simple:  { label: '심플 미니멀 기준 약 2,500~3,500만원을 추천해요', quick: [2000, 3000, 3500] },
  basic:   { label: '베이직 스탠다드 기준 약 4,000~6,000만원을 추천해요', quick: [4000, 5000, 6000] },
  luxury:  { label: '럭셔리 프리미엄 기준 약 8,000만원 이상을 추천해요', quick: [8000, 10000, 15000] },
}

// ── 컨페티 컴포넌트 ──────────────────────────────────────────────
function Confetti() {
  const pieces = Array.from({ length: 24 }, (_, i) => i)
  const colors = ['#FF6B9D', '#FFA8C9', '#C084FC', '#A78BFA', '#60A5FA', '#34D399', '#FBBF24', '#F87171']
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 3100, overflow: 'hidden' }}>
      {pieces.map(i => {
        const left = Math.random() * 100
        const delay = Math.random() * 0.8
        const color = colors[i % colors.length]
        const size = 6 + Math.random() * 6
        const dur = 1.8 + Math.random() * 1.2
        return (
          <div key={i} style={{
            position: 'absolute', top: '-20px', left: `${left}%`,
            width: size, height: size,
            background: color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animation: `confettiFall ${dur}s ${delay}s ease-in forwards`,
          }} />
        )
      })}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

// ── 선택 카드 ────────────────────────────────────────────────────
function PickCard({ emoji, title, desc, color, active, onClick }: {
  emoji: string; title: string; desc: string; color: string; active: boolean; onClick: () => void
}) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 14,
      background: active ? `${color}22` : '#fafafa',
      border: `2px solid ${active ? color : 'var(--gray2)'}`,
      borderRadius: 14, padding: '14px 16px', cursor: 'pointer', textAlign: 'left',
      transition: 'all .2s', width: '100%', boxSizing: 'border-box',
    }}>
      <span style={{ fontSize: 26, flexShrink: 0 }}>{emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: active ? color : 'var(--text)', marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.5 }}>{desc}</div>
      </div>
      <div style={{
        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
        border: `2px solid ${active ? color : 'var(--gray2)'}`,
        background: active ? color : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {active && <span style={{ color: '#fff', fontSize: 10, fontWeight: 900 }}>✓</span>}
      </div>
    </button>
  )
}

// ── 스킵 버튼 ───────────────────────────────────────────────────
function SkipBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: 'block', margin: '10px auto 0', background: 'none', border: 'none',
      fontSize: 12, color: 'var(--text2)', cursor: 'pointer', opacity: .65,
      textDecoration: 'underline', padding: '4px 8px',
    }}>건너뛰기</button>
  )
}

// ── 다음 버튼 ───────────────────────────────────────────────────
function NextBtn({ onClick, disabled, label = '다음 →' }: { onClick: () => void; disabled?: boolean; label?: string }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%', border: 'none', borderRadius: 12, padding: '14px 0', marginTop: 16,
      fontSize: 15, fontWeight: 700,
      cursor: disabled ? 'not-allowed' : 'pointer',
      background: disabled ? 'var(--gray2)' : 'linear-gradient(135deg,var(--pk),var(--mn))',
      color: disabled ? 'var(--text2)' : '#fff',
      transition: 'all .2s',
    }}>{label}</button>
  )
}

export default function OnboardingWizard({ nick, onComplete }: Props) {
  const TOTAL_STEPS = 6

  const [step, setStep] = useState(0)
  const [weddingDate, setWeddingDate] = useState('')
  const [budget, setBudget] = useState('')
  const [weddingStyle, setWeddingStyle] = useState<WeddingStyle | null>(null)
  const [honeymoonType, setHoneymoonType] = useState<HoneymoonType | null>(null)
  const [housingType, setHousingType] = useState<HousingType | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)

  const ddayMs = weddingDate ? new Date(weddingDate).getTime() - Date.now() : null
  const dday = ddayMs !== null ? Math.ceil(ddayMs / 86400000) : null

  const progress = Math.round((step / (TOTAL_STEPS - 1)) * 100)

  useEffect(() => {
    if (step === TOTAL_STEPS - 1) {
      setShowConfetti(true)
      const t = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(t)
    }
  }, [step])

  function finish(destination: 'dashboard' | 'calculator') {
    onComplete({
      weddingDate,
      budget: parseInt(budget) || 0,
      weddingStyle,
      honeymoonType,
      housingType,
      destination,
    })
  }

  return (
    <>
      {showConfetti && <Confetti />}
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
          {/* ── 프로그레스 바 */}
          <div style={{ height: 5, background: 'var(--gray1)' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,var(--pk),var(--mn))', transition: 'width .4s' }} />
          </div>

          {/* 스텝 인디케이터 */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 5, padding: '10px 0 0' }}>
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div key={i} style={{
                width: i <= step ? 20 : 6, height: 6, borderRadius: 3,
                background: i <= step ? 'var(--pk)' : 'var(--gray2)',
                transition: 'all .3s',
              }} />
            ))}
          </div>

          <div style={{ padding: '20px 24px 28px' }}>

            {/* ══ STEP 0: 결혼 예정일 ══════════════════════════ */}
            {step === 0 && (
              <div>
                <div style={{ fontSize: 28, textAlign: 'center', marginBottom: 8 }}>💍</div>
                <div style={{ fontSize: 19, fontWeight: 800, textAlign: 'center', marginBottom: 5 }}>{nick}님, 반가워요!</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'center', lineHeight: 1.7, marginBottom: 20 }}>
                  결혼 예정일을 설정하면<br />D-day와 일정이 자동으로 계산돼요.
                </div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--pk)', marginBottom: 8 }}>
                  📅 결혼 예정일
                </label>
                <input
                  type="date"
                  value={weddingDate}
                  onChange={e => setWeddingDate(e.target.value)}
                  style={{
                    width: '100%', border: '2px solid var(--gray2)', borderRadius: 12,
                    padding: '13px 14px', fontSize: 16, outline: 'none', boxSizing: 'border-box',
                    color: weddingDate ? 'var(--text)' : 'var(--text2)',
                  }}
                />
                {dday !== null && dday > 0 && (
                  <div style={{ marginTop: 10, background: 'var(--pk5)', borderRadius: 10, padding: '10px', textAlign: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--pk)' }}>결혼식까지 D-{dday}! 🎉</span>
                  </div>
                )}
                <NextBtn onClick={() => setStep(1)} disabled={!weddingDate} />
                <SkipBtn onClick={() => setStep(1)} />
              </div>
            )}

            {/* ══ STEP 1: 결혼 스타일 ══════════════════════════ */}
            {step === 1 && (
              <div>
                <div style={{ fontSize: 28, textAlign: 'center', marginBottom: 8 }}>💒</div>
                <div style={{ fontSize: 18, fontWeight: 800, textAlign: 'center', marginBottom: 5 }}>어떤 결혼식을 원하세요?</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', textAlign: 'center', marginBottom: 18 }}>
                  스타일을 고르면 비용이 자동으로 설정돼요 ✨
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <PickCard
                    emoji="💚" title="심플 미니멀"
                    desc="꼭 필요한 것만 · 150명 규모 · 가성비 집중"
                    color="#22c55e" active={weddingStyle === 'simple'}
                    onClick={() => setWeddingStyle('simple')}
                  />
                  <PickCard
                    emoji="💛" title="베이직 스탠다드"
                    desc="전국 평균 수준 · 200명 규모 · 알찬 구성"
                    color="#f59e0b" active={weddingStyle === 'basic'}
                    onClick={() => setWeddingStyle('basic')}
                  />
                  <PickCard
                    emoji="❤️" title="럭셔리 프리미엄"
                    desc="최고급 서비스 · 350명 규모 · 풀 구성"
                    color="#ec4899" active={weddingStyle === 'luxury'}
                    onClick={() => setWeddingStyle('luxury')}
                  />
                </div>
                <NextBtn onClick={() => setStep(2)} disabled={!weddingStyle} />
                <SkipBtn onClick={() => setStep(2)} />
              </div>
            )}

            {/* ══ STEP 2: 결혼식 목표예산 ══════════════════════════ */}
            {step === 2 && (
              <div>
                <div style={{ fontSize: 28, textAlign: 'center', marginBottom: 8 }}>💰</div>
                <div style={{ fontSize: 18, fontWeight: 800, textAlign: 'center', marginBottom: 5 }}>결혼식 목표 예산</div>
                {weddingStyle && (
                  <div style={{ background: 'var(--pk5)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: 'var(--pk)', fontWeight: 600, lineHeight: 1.6 }}>
                    💡 {BUDGET_HINTS[weddingStyle].label}
                  </div>
                )}
                {/* 빠른 설정 버튼 */}
                {weddingStyle && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6 }}>빠른 설정</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {BUDGET_HINTS[weddingStyle].quick.map(q => (
                        <button key={q} onClick={() => setBudget(String(q))} style={{
                          flex: 1, padding: '7px 4px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                          border: `1.5px solid ${budget === String(q) ? 'var(--pk)' : 'var(--gray2)'}`,
                          background: budget === String(q) ? 'var(--pk5)' : '#fff',
                          color: budget === String(q) ? 'var(--pk)' : 'var(--text2)',
                        }}>{(q).toLocaleString()}만</button>
                      ))}
                    </div>
                  </div>
                )}
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
                <NextBtn onClick={() => setStep(3)} />
                <SkipBtn onClick={() => setStep(3)} />
              </div>
            )}

            {/* ══ STEP 3: 신혼여행 유형 ══════════════════════════ */}
            {step === 3 && (
              <div>
                <div style={{ fontSize: 28, textAlign: 'center', marginBottom: 8 }}>✈️</div>
                <div style={{ fontSize: 18, fontWeight: 800, textAlign: 'center', marginBottom: 5 }}>신혼여행은 어디로?</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', textAlign: 'center', marginBottom: 18 }}>
                  여행 유형별로 예산이 자동으로 설정돼요 (4박5일 기준)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <PickCard
                    emoji="🏝️" title="국내 · 제주"
                    desc="가성비 국내 여행 · 예산 약 200만원"
                    color="#22c55e" active={honeymoonType === 'simple'}
                    onClick={() => setHoneymoonType('simple')}
                  />
                  <PickCard
                    emoji="🌴" title="동남아 (발리·다낭·방콕)"
                    desc="인기 해외 허니문 · 예산 약 450만원"
                    color="#f59e0b" active={honeymoonType === 'basic'}
                    onClick={() => setHoneymoonType('basic')}
                  />
                  <PickCard
                    emoji="🗼" title="하와이 · 유럽 · 장거리"
                    desc="프리미엄 허니문 · 예산 약 1,000만원"
                    color="#ec4899" active={honeymoonType === 'luxury'}
                    onClick={() => setHoneymoonType('luxury')}
                  />
                </div>
                <NextBtn onClick={() => setStep(4)} disabled={!honeymoonType} />
                <SkipBtn onClick={() => setStep(4)} />
              </div>
            )}

            {/* ══ STEP 4: 신혼집 거주 형태 ══════════════════════════ */}
            {step === 4 && (
              <div>
                <div style={{ fontSize: 28, textAlign: 'center', marginBottom: 8 }}>🏠</div>
                <div style={{ fontSize: 18, fontWeight: 800, textAlign: 'center', marginBottom: 5 }}>신혼집은 어떤 형태?</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', textAlign: 'center', marginBottom: 18 }}>
                  거주 형태에 따라 신혼집 계산기가 자동으로 설정돼요
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <PickCard
                    emoji="🏠" title="월세"
                    desc="보증금 + 매달 월세 · 초기 비용 최소화"
                    color="#f97316" active={housingType === 'rent'}
                    onClick={() => setHousingType('rent')}
                  />
                  <PickCard
                    emoji="🔑" title="전세"
                    desc="목돈 한 번에 · 월세 부담 없이 · 가장 일반적"
                    color="#3b82f6" active={housingType === 'jeonse'}
                    onClick={() => setHousingType('jeonse')}
                  />
                  <PickCard
                    emoji="🏡" title="매매 (내 집 마련)"
                    desc="대출·취득세·부대비용 포함 · 장기 자산"
                    color="#22c55e" active={housingType === 'buy'}
                    onClick={() => setHousingType('buy')}
                  />
                </div>
                <NextBtn onClick={() => setStep(5)} disabled={!housingType} />
                <SkipBtn onClick={() => setStep(5)} />
              </div>
            )}

            {/* ══ STEP 5: 완료 요약 ══════════════════════════ */}
            {step === 5 && (
              <div>
                <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 8 }}>🎉</div>
                <div style={{ fontSize: 20, fontWeight: 800, textAlign: 'center', marginBottom: 6 }}>설정 완료!</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'center', marginBottom: 20, lineHeight: 1.7 }}>
                  입력하신 정보를 바탕으로<br />맞춤 결혼 준비를 시작해요 💕
                </div>

                {/* 요약 카드 */}
                <div style={{ background: 'var(--pk5)', borderRadius: 14, padding: '14px 16px', marginBottom: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {weddingDate && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--text2)' }}>📅 결혼 예정일</span>
                      <span style={{ fontWeight: 800, color: 'var(--pk)' }}>{weddingDate}</span>
                    </div>
                  )}
                  {weddingStyle && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--text2)' }}>💒 결혼 스타일</span>
                      <span style={{ fontWeight: 800, color: 'var(--pk)' }}>
                        {weddingStyle === 'simple' ? '💚 심플 미니멀' : weddingStyle === 'basic' ? '💛 베이직 스탠다드' : '❤️ 럭셔리 프리미엄'}
                      </span>
                    </div>
                  )}
                  {budget && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--text2)' }}>💰 결혼식 예산</span>
                      <span style={{ fontWeight: 800, color: 'var(--pk)' }}>{parseInt(budget).toLocaleString()}만원</span>
                    </div>
                  )}
                  {honeymoonType && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--text2)' }}>✈️ 신혼여행</span>
                      <span style={{ fontWeight: 800, color: 'var(--pk)' }}>
                        {honeymoonType === 'simple' ? '🏝️ 국내·제주' : honeymoonType === 'basic' ? '🌴 동남아' : '🗼 하와이·유럽'}
                      </span>
                    </div>
                  )}
                  {housingType && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--text2)' }}>🏠 신혼집</span>
                      <span style={{ fontWeight: 800, color: 'var(--pk)' }}>
                        {housingType === 'rent' ? '🏠 월세' : housingType === 'jeonse' ? '🔑 전세' : '🏡 매매'}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => finish('calculator')}
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
                  onClick={() => finish('dashboard')}
                  style={{
                    width: '100%', border: '2px solid var(--gray2)', borderRadius: 14, padding: '16px',
                    fontSize: 14, fontWeight: 700, cursor: 'pointer', background: '#fff',
                    color: 'var(--text2)', textAlign: 'center',
                  }}
                >
                  🗺️ 대시보드에서 시작하기
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  )
}
