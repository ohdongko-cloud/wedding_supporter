import { useMemo, useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import type { HouseDetail, HouseDetailBuy, HouseDetailJeonse, HouseDetailRent, InteriorData, InteriorProfile, InteriorCategoryItem } from '../types'
import BannerAd from '../components/ads/BannerAd'

// ── Interior Calculator ───────────────────────────────────────────────────────

type BelongLevel = 'none' | 'basic' | 'full'
type HomeCondition = 'empty' | 'partial' | 'full'
type InteriorStyle = 'practical' | 'standard' | 'premium'

interface CatDef {
  id: string; name: string; emoji: string; required: boolean
  costs: Record<InteriorStyle, [number, number]>   // [min, max] in 만원
  conditionMult: Record<HomeCondition, number>      // multiplier based on home condition
}

const CAT_DEFS: CatDef[] = [
  { id: 'floor',     name: '바닥재 (장판·마루)',    emoji: '🪵', required: true,
    costs: { practical: [50,100],  standard: [100,200], premium: [200,400] },
    conditionMult: { empty: 1.0, partial: 0.6, full: 0.3 } },
  { id: 'wallpaper', name: '도배·벽지',            emoji: '🎨', required: true,
    costs: { practical: [30,70],   standard: [70,150],  premium: [150,300] },
    conditionMult: { empty: 1.0, partial: 0.6, full: 0.3 } },
  { id: 'kitchen',   name: '주방 시공 (싱크대·타일)', emoji: '🍳', required: false,
    costs: { practical: [50,120],  standard: [120,250], premium: [250,500] },
    conditionMult: { empty: 1.0, partial: 0.7, full: 0.2 } },
  { id: 'bathroom',  name: '욕실 시공',            emoji: '🚿', required: false,
    costs: { practical: [50,100],  standard: [100,200], premium: [200,400] },
    conditionMult: { empty: 1.0, partial: 0.7, full: 0.2 } },
  { id: 'lighting',  name: '조명',                emoji: '💡', required: false,
    costs: { practical: [20,50],   standard: [50,120],  premium: [120,300] },
    conditionMult: { empty: 1.0, partial: 0.8, full: 0.5 } },
  { id: 'curtain',   name: '커튼·블라인드',         emoji: '🪟', required: false,
    costs: { practical: [20,50],   standard: [50,100],  premium: [100,200] },
    conditionMult: { empty: 1.0, partial: 1.0, full: 1.0 } },
  { id: 'misc',      name: '기타 (중문·타공판 등)', emoji: '📦', required: false,
    costs: { practical: [10,30],   standard: [30,80],   premium: [80,200] },
    conditionMult: { empty: 1.0, partial: 0.8, full: 0.5 } },
]

function buildInteriorData(profile: InteriorProfile): InteriorData {
  const { homeCondition, interiorStyle } = profile
  // belongings factor — more belongings = some items already owned
  const belongFactor = (() => {
    const scores = { none: 0, basic: 1, full: 2 }
    return Math.min(2, scores[profile.groomBelongings] + scores[profile.brideBelongings])
  })()

  const categories: Record<string, InteriorCategoryItem[]> = {}
  let totalMin = 0, totalMax = 0

  CAT_DEFS.forEach(cat => {
    const [baseMin, baseMax] = cat.costs[interiorStyle]
    const mult = cat.conditionMult[homeCondition]
    const min = Math.round(baseMin * mult)
    const max = Math.round(baseMax * mult)
    // Suggest "owned" for non-required items if both have full belongings
    const suggestOwned = !cat.required && belongFactor >= 3
    const item: InteriorCategoryItem = {
      id: cat.id, name: `${cat.emoji} ${cat.name}`,
      minCost: min, maxCost: max,
      userInput: undefined, owned: suggestOwned, required: cat.required,
    }
    categories[cat.id] = [item]
    if (!suggestOwned) { totalMin += min; totalMax += max }
  })

  return { profile, categories, totalMin, totalMax }
}

function makeDefaultInteriorProfile(): InteriorProfile {
  return { groomBelongings: 'none', brideBelongings: 'none', homeCondition: 'empty', interiorStyle: 'standard' }
}

interface InteriorSectionProps {
  interiorData: InteriorData | undefined
  onUpdate: (data: InteriorData) => void
}

function InteriorCalculatorSection({ interiorData, onUpdate }: InteriorSectionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [phase, setPhase] = useState<0 | 1 | 2 | 3>(interiorData ? 3 : 0)
  const profile = interiorData?.profile ?? makeDefaultInteriorProfile()

  function updateProfile(partial: Partial<InteriorProfile>) {
    const newProfile = { ...profile, ...partial }
    const newData = buildInteriorData(newProfile)
    // preserve user inputs from existing data
    if (interiorData) {
      Object.entries(interiorData.categories).forEach(([id, items]) => {
        if (newData.categories[id] && items[0]?.userInput !== undefined) {
          newData.categories[id][0].userInput = items[0].userInput
        }
        if (newData.categories[id]) {
          newData.categories[id][0].owned = items[0]?.owned ?? false
        }
      })
      // recompute totals
      let tMin = 0, tMax = 0
      Object.values(newData.categories).forEach(([item]) => {
        if (!item.owned) { tMin += item.minCost; tMax += item.maxCost }
      })
      newData.totalMin = tMin; newData.totalMax = tMax
    }
    onUpdate(newData)
  }

  function updateItem(id: string, patch: Partial<InteriorCategoryItem>) {
    if (!interiorData) return
    const newCats = { ...interiorData.categories }
    newCats[id] = [{ ...newCats[id][0], ...patch }]
    // recompute totals
    let tMin = 0, tMax = 0, userTotal = 0
    let hasUserInput = false
    Object.values(newCats).forEach(([item]) => {
      if (!item.owned) {
        tMin += item.minCost; tMax += item.maxCost
        if (item.userInput !== undefined) { userTotal += item.userInput; hasUserInput = true }
      }
    })
    onUpdate({ ...interiorData, categories: newCats, totalMin: tMin, totalMax: tMax, userTotal: hasUserInput ? userTotal : undefined })
  }

  function finishQuestionnaire() {
    const newData = buildInteriorData(profile)
    onUpdate(newData)
    setPhase(3)
  }

  const totalMin = interiorData?.totalMin ?? 0
  const totalMax = interiorData?.totalMax ?? 0
  const userTotal = interiorData?.userTotal

  function SelectRow({ label, value, options, onChange }: {
    label: string
    value: string
    options: { key: string; label: string; desc: string; emoji: string }[]
    onChange: (v: string) => void
  }) {
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{label}</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {options.map(o => (
            <button key={o.key} onClick={() => onChange(o.key)} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              padding: '10px 4px', borderRadius: 10, cursor: 'pointer', border: 'none',
              background: value === o.key ? 'var(--pk5)' : 'var(--gray1)',
              outline: value === o.key ? '2px solid var(--pk)' : 'none',
              transition: 'all .15s',
            }}>
              <span style={{ fontSize: 18 }}>{o.emoji}</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: value === o.key ? 'var(--pk)' : 'var(--text)' }}>{o.label}</span>
              <span style={{ fontSize: 9, color: 'var(--text2)', textAlign: 'center', lineHeight: 1.3 }}>{o.desc}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #e0e7ff', overflow: 'hidden', marginBottom: 12, boxShadow: '0 4px 20px rgba(99,102,241,.07)' }}>
      {/* Header */}
      <div
        onClick={() => setIsOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', cursor: 'pointer', background: '#f5f3ff', userSelect: 'none' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🛋️</span>
          <div>
            <span style={{ fontSize: 14, fontWeight: 800 }}>인테리어 비용 계산기</span>
            {!interiorData && (
              <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, background: '#fef3c7', color: '#d97706', borderRadius: 20, padding: '2px 8px' }}>미설정</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {interiorData && (
            <span style={{ fontSize: 12, fontWeight: 800, color: '#6366f1' }}>
              {userTotal !== undefined ? `${userTotal.toLocaleString()}만원` : `${totalMin.toLocaleString()}~${totalMax.toLocaleString()}만`}
            </span>
          )}
          <span style={{ color: 'var(--text2)', fontSize: 11, transform: isOpen ? 'rotate(180deg)' : 'none', transition: '.2s' }}>▼</span>
        </div>
      </div>

      {isOpen && (
        <div style={{ padding: '16px' }}>

          {/* ── Phase 0: 신랑·신부 짐 상태 ── */}
          {phase === 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#6366f1', marginBottom: 16 }}>📦 1단계 · 보유 짐 현황</div>
              <SelectRow
                label="신랑 짐 상태"
                value={profile.groomBelongings}
                options={[
                  { key: 'none', label: '없음', emoji: '📭', desc: '새로 구매 필요' },
                  { key: 'basic', label: '일부', emoji: '📦', desc: '일부 보유' },
                  { key: 'full', label: '풀세트', emoji: '🏠', desc: '가전·가구 보유' },
                ]}
                onChange={v => updateProfile({ groomBelongings: v as BelongLevel })}
              />
              <SelectRow
                label="신부 짐 상태"
                value={profile.brideBelongings}
                options={[
                  { key: 'none', label: '없음', emoji: '📭', desc: '새로 구매 필요' },
                  { key: 'basic', label: '일부', emoji: '📦', desc: '일부 보유' },
                  { key: 'full', label: '풀세트', emoji: '🏠', desc: '가전·가구 보유' },
                ]}
                onChange={v => updateProfile({ brideBelongings: v as BelongLevel })}
              />
              <button onClick={() => setPhase(1)} style={{
                width: '100%', border: 'none', borderRadius: 10, padding: '12px', marginTop: 8,
                fontSize: 14, fontWeight: 700, cursor: 'pointer', background: '#6366f1', color: '#fff',
              }}>다음 →</button>
            </div>
          )}

          {/* ── Phase 1: 집 컨디션 ── */}
          {phase === 1 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#6366f1', marginBottom: 16 }}>🏗️ 2단계 · 집 컨디션</div>
              <SelectRow
                label="현재 집 상태"
                value={profile.homeCondition}
                options={[
                  { key: 'empty', label: '빈집', emoji: '🏚️', desc: '전체 시공 필요' },
                  { key: 'partial', label: '일부 시공', emoji: '🏠', desc: '부분 손질 필요' },
                  { key: 'full', label: '풀시공', emoji: '✨', desc: '마감 상태 양호' },
                ]}
                onChange={v => updateProfile({ homeCondition: v as HomeCondition })}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={() => setPhase(0)} style={{ flex: 1, border: '1.5px solid var(--gray2)', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: '#fff', color: 'var(--text2)' }}>← 이전</button>
                <button onClick={() => setPhase(2)} style={{ flex: 2, border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', background: '#6366f1', color: '#fff' }}>다음 →</button>
              </div>
            </div>
          )}

          {/* ── Phase 2: 인테리어 스타일 ── */}
          {phase === 2 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#6366f1', marginBottom: 16 }}>🎨 3단계 · 인테리어 스타일</div>
              <SelectRow
                label="원하는 인테리어 수준"
                value={profile.interiorStyle}
                options={[
                  { key: 'practical', label: '실용형', emoji: '💚', desc: '합리적 가격\n기능 중심' },
                  { key: 'standard', label: '스탠다드', emoji: '💛', desc: '평균 수준\n깔끔한 마감' },
                  { key: 'premium', label: '프리미엄', emoji: '❤️', desc: '고급 자재\n완성도 집중' },
                ]}
                onChange={v => updateProfile({ interiorStyle: v as InteriorStyle })}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={() => setPhase(1)} style={{ flex: 1, border: '1.5px solid var(--gray2)', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: '#fff', color: 'var(--text2)' }}>← 이전</button>
                <button onClick={finishQuestionnaire} style={{ flex: 2, border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', background: '#6366f1', color: '#fff' }}>견적 보기 ✨</button>
              </div>
            </div>
          )}

          {/* ── Phase 3: 결과 & 항목별 입력 ── */}
          {phase === 3 && interiorData && (
            <div>
              {/* 요약 뱃지 */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                {[
                  { label: `신랑 짐: ${profile.groomBelongings === 'none' ? '없음' : profile.groomBelongings === 'basic' ? '일부' : '풀세트'}` },
                  { label: `신부 짐: ${profile.brideBelongings === 'none' ? '없음' : profile.brideBelongings === 'basic' ? '일부' : '풀세트'}` },
                  { label: `집 상태: ${profile.homeCondition === 'empty' ? '빈집' : profile.homeCondition === 'partial' ? '일부시공' : '풀시공'}` },
                  { label: `스타일: ${profile.interiorStyle === 'practical' ? '실용형' : profile.interiorStyle === 'standard' ? '스탠다드' : '프리미엄'}` },
                ].map(b => (
                  <span key={b.label} style={{ fontSize: 10, fontWeight: 700, background: '#ede9fe', color: '#6366f1', borderRadius: 20, padding: '3px 10px' }}>{b.label}</span>
                ))}
                <button onClick={() => setPhase(0)} style={{ fontSize: 10, fontWeight: 700, background: 'none', border: '1px solid var(--gray2)', borderRadius: 20, padding: '3px 10px', cursor: 'pointer', color: 'var(--text2)' }}>다시 설정</button>
              </div>

              {/* 합계 */}
              <div style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 12, padding: '12px 16px', color: '#fff', marginBottom: 14 }}>
                <div style={{ fontSize: 11, opacity: .8, marginBottom: 4 }}>예상 인테리어 비용</div>
                <div style={{ fontSize: 22, fontWeight: 900 }}>
                  {userTotal !== undefined ? `${userTotal.toLocaleString()}만원` : `${totalMin.toLocaleString()}~${totalMax.toLocaleString()}만원`}
                </div>
                <div style={{ fontSize: 10, opacity: .7, marginTop: 3 }}>
                  {userTotal !== undefined ? '직접 입력 합계' : '예상 범위 (실제와 다를 수 있어요)'}
                </div>
              </div>

              {/* 항목별 테이블 */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 8 }}>항목을 직접 수정하거나 보유 여부를 체크해요</div>
                {CAT_DEFS.map(cat => {
                  const item = interiorData.categories[cat.id]?.[0]
                  if (!item) return null
                  return (
                    <div key={cat.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '9px 0',
                      borderBottom: '1px solid var(--gray1)', opacity: item.owned ? .45 : 1,
                    }}>
                      {/* 보유 체크박스 */}
                      <div
                        onClick={() => updateItem(cat.id, { owned: !item.owned })}
                        style={{
                          width: 18, height: 18, borderRadius: 4, flexShrink: 0, cursor: 'pointer',
                          border: `2px solid ${item.owned ? '#6366f1' : 'var(--gray2)'}`,
                          background: item.owned ? '#6366f1' : '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        {item.owned && <span style={{ color: '#fff', fontSize: 10, fontWeight: 900 }}>✓</span>}
                      </div>

                      {/* 항목명 */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', textDecoration: item.owned ? 'line-through' : 'none' }}>{cat.name}</div>
                        <div style={{ fontSize: 9, color: 'var(--text2)', marginTop: 1 }}>
                          {item.owned ? '보유 (비용 제외)' : `예상 ${item.minCost.toLocaleString()}~${item.maxCost.toLocaleString()}만원`}
                        </div>
                      </div>

                      {/* 직접 입력 */}
                      {!item.owned && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                          <input
                            type="number"
                            value={item.userInput ?? ''}
                            onChange={e => updateItem(cat.id, { userInput: e.target.value ? Number(e.target.value) : undefined })}
                            placeholder={item.minCost.toLocaleString()}
                            style={{
                              width: 58, border: '1.5px solid #e0e7ff', borderRadius: 6,
                              padding: '3px 5px', fontSize: 12, textAlign: 'right', outline: 'none',
                              background: item.userInput !== undefined ? '#ede9fe' : '#f9f9f9',
                              color: item.userInput !== undefined ? '#6366f1' : 'var(--text2)',
                              fontWeight: item.userInput !== undefined ? 700 : 400,
                            }}
                          />
                          <span style={{ fontSize: 10, color: 'var(--text2)' }}>만</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 4, lineHeight: 1.6 }}>
                💡 체크박스 = 보유/불필요한 항목 | 금액란 = 견적 직접 입력
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (!isFinite(n)) return '-'
  if (Math.abs(n) >= 10000) return `${(n / 10000).toFixed(2)}억`
  return `${n.toLocaleString()}만`
}

function fmtWon(n: number): string {
  return fmt(n) + '원'
}

function num(s: string): number {
  const v = parseFloat(s.replace(/,/g, ''))
  return isFinite(v) ? v : 0
}

function monthsBetween(from: Date, to: Date): number {
  return Math.max(0, (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()))
}

// ── Regulation lookup ────────────────────────────────────────────────────────

interface Regulation {
  type: '투기과열지구' | '조정대상지역' | '비규제지역'
  ltvPct: number
  description: string
}

function getRegulation(region: string): Regulation {
  const r = region.trim()
  const hotZones = ['강남구', '서초구', '송파구', '용산구']
  if (hotZones.some(z => r.includes(z))) {
    return { type: '투기과열지구', ltvPct: 40, description: 'LTV 40% 적용, DSR 40% 제한, 2주택자 대출 불가' }
  }
  if (r.includes('서울')) {
    return { type: '조정대상지역', ltvPct: 50, description: 'LTV 50% 적용, DSR 40% 제한, 다주택자 대출 제한' }
  }
  return { type: '비규제지역', ltvPct: 70, description: 'LTV 70% 적용, DSR 40% 제한' }
}

// ── Tax & Fees ───────────────────────────────────────────────────────────────

function acquisitionTaxRate(price: number): number {
  // price in 만원
  if (price <= 60000) return 0.011
  if (price <= 90000) return 0.022
  return 0.033
}

function buyAgentFee(price: number): number {
  // price in 만원
  if (price < 5000) return Math.min(price * 0.006, 25)
  if (price < 20000) return Math.min(price * 0.005, 80)
  if (price < 90000) return price * 0.004
  if (price < 120000) return price * 0.005
  if (price < 150000) return price * 0.006
  return price * 0.007
}

function jeonseAgentFee(price: number): number {
  // price in 만원
  if (price < 5000) return Math.min(price * 0.005, 20)
  if (price < 10000) return Math.min(price * 0.004, 30)
  if (price < 30000) return price * 0.003
  if (price < 60000) return price * 0.004
  return price * 0.005
}

// ── Loan repayment ───────────────────────────────────────────────────────────

function monthlyPayment(principal: number, annualRate: number, years: number, method: string): number {
  const r = annualRate / 100 / 12
  const n = years * 12
  if (principal <= 0) return 0
  if (method === 'equal_principal') {
    // 원금균등 첫 달
    return principal / n + principal * r
  }
  if (method === 'bullet') {
    return principal * r
  }
  // 원리금균등 (default)
  if (r === 0) return principal / n
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

// ── Timeline Component ────────────────────────────────────────────────────────

interface TimelineStep {
  label: string
  daysOffset: number // negative = before move-in, positive = after
}

const BUY_STEPS: TimelineStep[] = [
  { label: '대출상담', daysOffset: -180 },
  { label: '지역임장', daysOffset: -150 },
  { label: '매물탐색', daysOffset: -90 },
  { label: '계약체결', daysOffset: -60 },
  { label: '잔금납부', daysOffset: -30 },
  { label: '소유권이전', daysOffset: 0 },
  { label: '입주', daysOffset: 0 },
  { label: '전입신고', daysOffset: 14 },
]

const JEONSE_STEPS: TimelineStep[] = [
  { label: '대출상담', daysOffset: -90 },
  { label: '지역임장', daysOffset: -75 },
  { label: '계약체결', daysOffset: -60 },
  { label: '잔금+확정일자', daysOffset: 0 },
  { label: '입주', daysOffset: 0 },
  { label: '전입신고', daysOffset: 14 },
]

const RENT_STEPS: TimelineStep[] = [
  { label: '지역임장', daysOffset: -30 },
  { label: '계약체결', daysOffset: -14 },
  { label: '입주', daysOffset: 0 },
  { label: '전입신고', daysOffset: 14 },
]

function Timeline({ moveInDate, steps }: { moveInDate: string; steps: TimelineStep[] }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (!moveInDate) {
    return (
      <div style={{ color: 'var(--text2)', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>
        입주 목표일을 입력하면 타임라인이 표시됩니다.
      </div>
    )
  }

  const anchor = new Date(moveInDate)
  anchor.setHours(0, 0, 0, 0)

  const stepsWithDate = steps.map(s => {
    const d = new Date(anchor)
    d.setDate(d.getDate() + s.daysOffset)
    return { ...s, date: d }
  })

  // Find next upcoming step index
  const nextIdx = stepsWithDate.findIndex(s => s.date >= today)

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, minWidth: steps.length * 80 }}>
        {stepsWithDate.map((s, i) => {
          const isPast = s.date < today
          const isNext = i === nextIdx
          const isToday = s.date.getTime() === today.getTime()
          const nodeColor = isPast ? 'var(--gray2)' : isNext ? 'var(--pk)' : 'var(--pk4)'
          const textColor = isPast ? 'var(--text2)' : isNext ? 'var(--pk)' : 'var(--text)'
          const dateStr = `${s.date.getMonth() + 1}/${s.date.getDate()}`
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{ fontSize: 10, color: textColor, fontWeight: isNext ? 800 : 400, marginBottom: 4, textAlign: 'center', whiteSpace: 'nowrap' }}>
                {s.label}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                {i > 0 && <div style={{ flex: 1, height: 2, background: isPast ? 'var(--gray2)' : 'var(--pk4)' }} />}
                <div style={{
                  width: isNext ? 16 : 12, height: isNext ? 16 : 12,
                  borderRadius: '50%',
                  background: isToday ? 'var(--mn)' : nodeColor,
                  border: isNext ? '2px solid var(--pk)' : 'none',
                  flexShrink: 0,
                  boxShadow: isNext ? '0 0 6px rgba(255,107,157,.5)' : 'none',
                }} />
                {i < stepsWithDate.length - 1 && <div style={{ flex: 1, height: 2, background: 'var(--pk4)' }} />}
              </div>
              <div style={{ fontSize: 9, color: isNext ? 'var(--pk)' : 'var(--text2)', marginTop: 4, textAlign: 'center' }}>
                {dateStr}
              </div>
              {isToday && <div style={{ fontSize: 9, color: 'var(--mn)', fontWeight: 800 }}>오늘</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Default values ────────────────────────────────────────────────────────────

const DEFAULT_BUY: HouseDetailBuy = {
  targetContract: '', region: '', price: '',
  cashGroom: '', cashBride: '', savingsGroom: '', savingsBride: '',
  incomeGroom: '', incomeBride: '', birthGroom: '', birthBride: '',
  loanRate: '4.5', loanYears: '30', repaymentMethod: 'equal_principal_interest', married: false,
  existingLoanGroom: '', existingLoanBride: '', loanCondition: '일반',
}

const DEFAULT_JEONSE: HouseDetailJeonse = {
  targetContract: '', region: '경기도 안산시', price: '20000',
  cashGroom: '', cashBride: '', savingsGroom: '', savingsBride: '',
  incomeGroom: '', incomeBride: '',
  loanRate: '3.5', married: false,
  existingLoanGroom: '', existingLoanBride: '',
}

const DEFAULT_RENT: HouseDetailRent = {
  region: '', deposit: '', monthly: '',
  cashGroom: '', cashBride: '', savingsGroom: '', savingsBride: '',
  incomeGroom: '', incomeBride: '',
}

const DEFAULT_HOUSE_DETAIL: HouseDetail = {
  mode: 'jeonse', targetMoveIn: '', address: '경기도 안산시',
  buy: DEFAULT_BUY, jeonse: DEFAULT_JEONSE, rent: DEFAULT_RENT,
}

// ── Shared input styles ───────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  border: '1.5px solid var(--gray2)', borderRadius: 8, padding: '8px 10px',
  fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'var(--pk)', marginBottom: 4,
}

const cardStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 14, border: '1.5px solid var(--pk4)',
  padding: 16, marginBottom: 12,
}

// ── CollapsibleCard ───────────────────────────────────────────────────────────

function CollapsibleCard({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: open ? 'var(--pk5)' : '#fff', border: 'none', cursor: 'pointer', padding: '13px 16px', borderRadius: 0 }}
      >
        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{title}</span>
        <span style={{ fontSize: 16, color: 'var(--pk)', display: 'inline-block', transition: 'transform .22s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
      </button>
      {open && <div style={{ padding: '12px 16px 16px' }}>{children}</div>}
    </div>
  )
}

// ── FormRow ───────────────────────────────────────────────────────────────────

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={labelStyle}>{label}</div>
      {children}
    </div>
  )
}

function TwoCol({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>{children}</div>
}

// ── Regulation Banner ─────────────────────────────────────────────────────────

function RegBanner({ region }: { region: string }) {
  if (!region.trim()) return null
  const reg = getRegulation(region)
  const color = reg.type === '투기과열지구' ? '#e03060' : reg.type === '조정대상지역' ? '#f59e0b' : '#22c55e'
  return (
    <div style={{ background: color + '18', border: `1.5px solid ${color}`, borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
      <div style={{ fontWeight: 800, color, fontSize: 12 }}>{reg.type} (LTV {reg.ltvPct}%)</div>
      <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{reg.description}</div>
    </div>
  )
}

// ── Summary card row ──────────────────────────────────────────────────────────

function SumRow({ label, value, highlight, color }: { label: string; value: string; highlight?: boolean; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--gray1)' }}>
      <span style={{ fontSize: 12, color: 'var(--text2)' }}>{label}</span>
      <span style={{ fontSize: highlight ? 18 : 13, fontWeight: highlight ? 800 : 600, color: color || (highlight ? 'var(--pk)' : 'var(--text)') }}>
        {value}
      </span>
    </div>
  )
}

// ── 대출 우대 조건 설정 ──────────────────────────────────────────────────────────

interface LoanConditionDef {
  key: string
  label: string
  emoji: string
  ltvBonusPct: number   // 규제지역 LTV에 더하는 %p
  maxLtvPct: number     // 최대 LTV 상한 (%)
  loanCapMan: number    // 대출 한도 (만원, 0 = 무제한)
  note: string          // 요건 요약
}

const LOAN_CONDITIONS: LoanConditionDef[] = [
  {
    key: '일반',
    label: '일반',
    emoji: '🏠',
    ltvBonusPct: 0,
    maxLtvPct: 70,
    loanCapMan: 0,
    note: '규제지역 LTV 그대로 적용 (투기과열 40% · 조정 50% · 비규제 70%)',
  },
  {
    key: '생애최초',
    label: '생애최초',
    emoji: '🔑',
    ltvBonusPct: 10,
    maxLtvPct: 80,
    loanCapMan: 0,
    note: '9억원 이하 주택 · LTV 최대 80% · 취득세 감면 혜택',
  },
  {
    key: '신혼부부특례',
    label: '신혼부부 특례',
    emoji: '💑',
    ltvBonusPct: 10,
    maxLtvPct: 80,
    loanCapMan: 40000,
    note: '합산소득 8,500만↓ · 6억↓ 주택 · 한도 4억 · 금리 1.85~3.0%',
  },
  {
    key: '디딤돌',
    label: '디딤돌 대출',
    emoji: '🏗️',
    ltvBonusPct: 0,
    maxLtvPct: 70,
    loanCapMan: 25000,
    note: '합산소득 6,000만↓ · 5억↓ 주택 · 한도 2.5억 · 금리 2.15~3.55%',
  },
  {
    key: '보금자리론',
    label: '보금자리론',
    emoji: '🏡',
    ltvBonusPct: 0,
    maxLtvPct: 70,
    loanCapMan: 36000,
    note: '합산소득 7,000만↓ · 6억↓ 주택 · 한도 3.6억 · 장기고정금리 4%대',
  },
  {
    key: '청년디딤돌',
    label: '청년 디딤돌',
    emoji: '🎓',
    ltvBonusPct: 10,
    maxLtvPct: 80,
    loanCapMan: 25000,
    note: '만 19~34세 · 연소득 3,500만↓ · 5억↓ 주택 · 한도 2.5억 · 금리 우대',
  },
]

// ── BuyTab ────────────────────────────────────────────────────────────────────

function BuyTab({ data, onChange }: { data: HouseDetailBuy; onChange: (d: HouseDetailBuy) => void }) {
  const set = (k: keyof HouseDetailBuy, v: string | boolean) => onChange({ ...data, [k]: v })

  const totalCash = num(data.cashGroom) + num(data.cashBride)
  const totalSavings = num(data.savingsGroom) + num(data.savingsBride)
  const today = new Date()
  const contractDate = data.targetContract ? new Date(data.targetContract) : null
  const months = contractDate ? monthsBetween(today, contractDate) : 0
  const extraSavings = totalSavings * months
  const availableCash = totalCash + extraSavings

  const price = num(data.price)
  const loanRate = num(data.loanRate)
  const loanYears = num(data.loanYears) || 30
  const reg = data.region ? getRegulation(data.region) : null

  // 선택된 대출 조건 설정
  const condDef = LOAN_CONDITIONS.find(c => c.key === (data.loanCondition ?? '일반')) ?? LOAN_CONDITIONS[0]
  const effectiveLtvPct = reg ? Math.min(reg.ltvPct + condDef.ltvBonusPct, condDef.maxLtvPct) : 0

  const acquisitionTax = price > 0 ? Math.round(price * acquisitionTaxRate(price)) : 0
  const agentFee = price > 0 ? Math.round(buyAgentFee(price)) : 0

  // LTV 기반 최대 대출 (대출 한도 적용)
  const maxLoanLtvRaw = effectiveLtvPct > 0 && price > 0 ? Math.round(price * effectiveLtvPct / 100) : 0
  const maxLoanLtv = condDef.loanCapMan > 0 ? Math.min(maxLoanLtvRaw, condDef.loanCapMan) : maxLoanLtvRaw

  const totalIncome = num(data.incomeGroom) + num(data.incomeBride)
  // 기존 보유 대출의 월 상환액 (신랑 + 신부 합산)
  const existingLoanAmt = num(data.existingLoanGroom ?? '0') + num(data.existingLoanBride ?? '0')
  const existingMonthly = existingLoanAmt > 0 && loanRate > 0
    ? Math.round(monthlyPayment(existingLoanAmt * 10000, loanRate, loanYears, data.repaymentMethod) / 10000)
    : 0
  // DSR: 연소득×40%÷12 - 기존 월 상환액 = 신규 대출에 쓸 수 있는 월 상환액; 역산
  const monthlyRate = loanRate / 100 / 12
  const n = loanYears * 12
  let maxLoanDsr = 0
  if (totalIncome > 0 && loanRate > 0) {
    // 기존 대출 월 상환액을 제외한 나머지가 신규 대출에 쓸 수 있는 한도
    const maxMonthly = Math.max(0, (totalIncome * 10000) / 12 * 0.4 - existingMonthly * 10000) // 원 단위
    if (maxMonthly > 0) {
      if (data.repaymentMethod === 'bullet') {
        maxLoanDsr = Math.round(maxMonthly / monthlyRate / 10000)
      } else if (data.repaymentMethod === 'equal_principal') {
        maxLoanDsr = Math.round(maxMonthly / (1 / n + monthlyRate) / 10000)
      } else {
        if (monthlyRate > 0) {
          maxLoanDsr = Math.round((maxMonthly / (monthlyRate * Math.pow(1 + monthlyRate, n) / (Math.pow(1 + monthlyRate, n) - 1))) / 10000)
        }
      }
    }
  }

  const actualLoan = maxLoanLtv > 0 && maxLoanDsr > 0
    ? Math.min(maxLoanLtv, maxLoanDsr)
    : maxLoanLtv || maxLoanDsr

  const requiredCash = price > 0 ? price - actualLoan + acquisitionTax + agentFee : 0
  const cashBalance = availableCash - requiredCash

  const loanMonthly = actualLoan > 0
    ? Math.round(monthlyPayment(actualLoan * 10000, loanRate, loanYears, data.repaymentMethod) / 10000)
    : 0

  // Table rows 2억~30억 (1억 단위)
  const tableRows = useMemo(() => {
    if (!effectiveLtvPct) return []
    return Array.from({ length: 29 }, (_, i) => {
      const p = (i + 2) * 10000
      const tax = Math.round(p * acquisitionTaxRate(p))
      const fee = Math.round(buyAgentFee(p))
      const maxLRaw = Math.round(p * effectiveLtvPct / 100)
      const maxL = condDef.loanCapMan > 0 ? Math.min(maxLRaw, condDef.loanCapMan) : maxLRaw  // 한도 적용
      const actualL = maxLoanDsr > 0 ? Math.min(maxL, maxLoanDsr) : maxL
      const needCash = p - actualL + tax + fee
      let dsrPct = 0
      if (totalIncome > 0 && actualL > 0 && loanRate > 0) {
        const mp = monthlyPayment(actualL * 10000, loanRate, loanYears, data.repaymentMethod)
        dsrPct = Math.round((mp / ((totalIncome * 10000) / 12)) * 100)
      }
      return { p, tax, fee, needCash, maxL, actualL, ltv: effectiveLtvPct, dsrPct }
    })
  }, [effectiveLtvPct, condDef.loanCapMan, maxLoanDsr, totalIncome, loanRate, loanYears, data.repaymentMethod])

  return (
    <div>
      {/* Input form */}
      <CollapsibleCard title="입력 정보">
        <FormRow label="지역 주소 (동 단위)">
          <input type="text" value={data.region} onChange={e => set('region', e.target.value)} placeholder="예: 서울 강남구 역삼동" style={inputStyle} />
        </FormRow>
        <FormRow label="목표 매매가 (만원)">
          <input type="number" value={data.price} onChange={e => set('price', e.target.value)} placeholder="예: 80000" style={inputStyle} />
        </FormRow>
        <FormRow label="보유 현금 (만원)">
          <TwoCol>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신랑</div>
              <input type="number" value={data.cashGroom} onChange={e => set('cashGroom', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신부</div>
              <input type="number" value={data.cashBride} onChange={e => set('cashBride', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
          </TwoCol>
        </FormRow>
        <FormRow label="기존 보유 대출 잔액 (만원)">
          <TwoCol>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신랑</div>
              <input type="number" value={data.existingLoanGroom ?? ''} onChange={e => set('existingLoanGroom', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신부</div>
              <input type="number" value={data.existingLoanBride ?? ''} onChange={e => set('existingLoanBride', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
          </TwoCol>
          {existingLoanAmt > 0 && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>→ 합계 {fmt(existingLoanAmt)}원 · 예상 월 상환액: 약 {existingMonthly.toLocaleString()}만원 (DSR 차감)</div>}
        </FormRow>
        <FormRow label="연소득 (만원 · DSR 계산용)">
          <TwoCol>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신랑</div>
              <input type="number" value={data.incomeGroom} onChange={e => set('incomeGroom', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신부</div>
              <input type="number" value={data.incomeBride} onChange={e => set('incomeBride', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
          </TwoCol>
        </FormRow>
        <FormRow label="월 저축액 (만원)">
          <TwoCol>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신랑</div>
              <input type="number" value={data.savingsGroom} onChange={e => set('savingsGroom', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신부</div>
              <input type="number" value={data.savingsBride} onChange={e => set('savingsBride', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
          </TwoCol>
        </FormRow>
        <FormRow label="대출 우대 조건">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
            {LOAN_CONDITIONS.map(c => {
              const selected = (data.loanCondition ?? '일반') === c.key
              return (
                <button key={c.key} onClick={() => set('loanCondition', c.key)}
                  style={{ padding: '7px 4px', borderRadius: 10, border: '1.5px solid', fontSize: 11, fontWeight: 700, cursor: 'pointer', textAlign: 'center', lineHeight: 1.3,
                    borderColor: selected ? 'var(--pk)' : 'var(--gray2)',
                    background: selected ? 'var(--pk)' : '#fff',
                    color: selected ? '#fff' : 'var(--text2)' }}>
                  <div style={{ fontSize: 14, marginBottom: 2 }}>{c.emoji}</div>
                  {c.label}
                </button>
              )
            })}
          </div>
          {/* 선택된 조건 상세 설명 */}
          <div style={{ fontSize: 11, borderRadius: 8, padding: '8px 10px', marginBottom: 10, background: 'var(--pk5)', border: '1px solid var(--pk4)' }}>
            <div style={{ fontWeight: 800, color: 'var(--pk)', marginBottom: 3 }}>{condDef.emoji} {condDef.label}</div>
            <div style={{ color: 'var(--text2)', lineHeight: 1.6 }}>{condDef.note}</div>
            {condDef.ltvBonusPct > 0 && (
              <div style={{ color: 'var(--mn)', marginTop: 3 }}>→ LTV +{condDef.ltvBonusPct}%p (최대 {condDef.maxLtvPct}%)</div>
            )}
            {condDef.loanCapMan > 0 && (
              <div style={{ color: '#e03060', marginTop: 2 }}>→ 대출 한도 {fmt(condDef.loanCapMan)}원 상한</div>
            )}
            <div style={{ color: 'var(--text2)', marginTop: 4, fontSize: 10 }}>※ 소득·주택가격 요건 등 실제 적용 시 금융기관 확인 필요</div>
          </div>
          <TwoCol>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>금리 (%)</div>
              <input type="number" value={data.loanRate} onChange={e => set('loanRate', e.target.value)} step="0.1" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>기간 (년)</div>
              <input type="number" value={data.loanYears} onChange={e => set('loanYears', e.target.value)} style={inputStyle} />
            </div>
          </TwoCol>
          <div style={{ marginTop: 8 }}>
            <select value={data.repaymentMethod} onChange={e => set('repaymentMethod', e.target.value)} style={{ ...inputStyle, background: '#fff' }}>
              <option value="equal_principal_interest">원리금균등상환</option>
              <option value="equal_principal">원금균등상환</option>
              <option value="bullet">만기일시상환</option>
            </select>
          </div>
        </FormRow>
        <FormRow label="목표 계약 시점">
          <input type="date" value={data.targetContract} onChange={e => set('targetContract', e.target.value)} style={inputStyle} />
        </FormRow>
        <FormRow label="생년 (4자리 · 참고용)">
          <TwoCol>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신랑</div>
              <input type="number" value={data.birthGroom} onChange={e => set('birthGroom', e.target.value)} placeholder="예: 1993" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신부</div>
              <input type="number" value={data.birthBride} onChange={e => set('birthBride', e.target.value)} placeholder="예: 1995" style={inputStyle} />
            </div>
          </TwoCol>
        </FormRow>
      </CollapsibleCard>

      {/* Summary */}
      <CollapsibleCard title="재무 요약">
        <SumRow label="총 보유 현금" value={fmtWon(totalCash)} />
        <SumRow label={`추가 저축 예상 (${months}개월)`} value={fmtWon(extraSavings)} />
        <SumRow label="확보 가능 현금 합계" value={fmtWon(availableCash)} highlight />
        <SumRow label="예상 매매가" value={price > 0 ? fmtWon(price) : '-'} />
        <SumRow label="취득세 (등록세 포함)" value={price > 0 ? fmtWon(acquisitionTax) : '-'} />
        <SumRow label="중개수수료" value={price > 0 ? fmtWon(agentFee) : '-'} />
        <SumRow
          label={`최대 대출 (LTV ${effectiveLtvPct}%${condDef.loanCapMan > 0 ? ` · 한도 ${fmt(condDef.loanCapMan)}원` : ''})`}
          value={maxLoanLtv > 0 ? fmtWon(maxLoanLtv) : '-'}
        />
        {existingLoanAmt > 0 && <SumRow label="기존 대출 월 상환액" value={existingMonthly > 0 ? fmtWon(existingMonthly) + '/월' : '-'} />}
        <SumRow label="DSR 기준 신규 대출 한도" value={maxLoanDsr > 0 ? fmtWon(maxLoanDsr) : (totalIncome > 0 ? '-' : '연소득 입력 필요')} />
        <SumRow label="실질 대출 예상액" value={actualLoan > 0 ? fmtWon(actualLoan) : '-'} highlight />
        <SumRow label="필요 현금 합계" value={requiredCash > 0 ? fmtWon(requiredCash) : '-'} />
        <SumRow
          label="현금 부족 / 여유"
          value={requiredCash > 0 ? (cashBalance >= 0 ? `+${fmtWon(cashBalance)} 여유` : `${fmtWon(Math.abs(cashBalance))} 부족`) : '-'}
          highlight
          color={requiredCash > 0 ? (cashBalance >= 0 ? '#22c55e' : '#e03060') : undefined}
        />
        <SumRow label="월 상환액 (예상)" value={loanMonthly > 0 ? fmtWon(loanMonthly) + '/월' : '-'} />
      </CollapsibleCard>

      {/* Table */}
      <CollapsibleCard title="매매가별 분석표">
        {reg && <RegBanner region={data.region} />}
        {!reg && (
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10 }}>지역 주소를 입력하면 규제지역 정보가 표시됩니다.</div>
        )}
        <div style={{ overflowX: 'auto', maxHeight: 360, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--pk5)', zIndex: 1 }}>
              <tr>
                {['매매가', '필요현금', '최대대출', '실질대출', 'LTV', 'DSR', '취득세', '중개비'].map((h, hi) => (
                  <th key={h} style={{ padding: '7px 3px', fontWeight: 700, color: hi === 1 ? '#e03060' : 'var(--pk)', textAlign: 'right', whiteSpace: 'nowrap', borderBottom: '1.5px solid var(--pk4)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map(row => {
                const isHighlight = price > 0 && Math.abs(row.p - price) < 5001
                const cols = [
                  { v: fmt(row.p),     color: isHighlight ? 'var(--pk)' : undefined, bold: isHighlight },
                  { v: fmt(row.needCash), color: '#e03060', bold: false },
                  { v: fmt(row.maxL),  color: undefined, bold: false },
                  { v: fmt(row.actualL), color: totalIncome > 0 ? 'var(--mn)' : undefined, bold: false },
                  { v: `${row.ltv}%`, color: undefined, bold: false },
                  { v: row.dsrPct > 0 ? `${row.dsrPct}%` : '-', color: row.dsrPct > 40 ? '#e03060' : undefined, bold: false },
                  { v: fmt(row.tax),  color: undefined, bold: false },
                  { v: fmt(row.fee),  color: undefined, bold: false },
                ]
                return (
                  <tr key={row.p} style={{ background: isHighlight ? 'var(--pk5)' : undefined }}>
                    {cols.map(({ v, color, bold }, j) => (
                      <td key={j} style={{ padding: '5px 3px', textAlign: 'right', borderBottom: '1px solid var(--gray1)', fontWeight: bold ? 800 : 400, color: color }}>
                        {v}
                      </td>
                    ))}
                  </tr>
                )
              })}
              {tableRows.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 16, color: 'var(--text2)', fontSize: 12 }}>지역을 입력하면 분석표가 표시됩니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalIncome === 0 && tableRows.length > 0 && (
          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 8 }}>💡 연소득을 입력하면 실질대출·DSR 열이 계산됩니다.</div>
        )}
      </CollapsibleCard>
    </div>
  )
}

// ── JeonseTab ─────────────────────────────────────────────────────────────────

function JeonseTab({ data, onChange }: { data: HouseDetailJeonse; onChange: (d: HouseDetailJeonse) => void }) {
  const set = (k: keyof HouseDetailJeonse, v: string | boolean) => onChange({ ...data, [k]: v })

  const totalCash = num(data.cashGroom) + num(data.cashBride)
  const totalSavings = num(data.savingsGroom) + num(data.savingsBride)
  const today = new Date()
  const contractDate = data.targetContract ? new Date(data.targetContract) : null
  const months = contractDate ? monthsBetween(today, contractDate) : 0
  const extraSavings = totalSavings * months
  const availableCash = totalCash + extraSavings

  const price = num(data.price)
  const loanRate = num(data.loanRate)

  const agentFee = price > 0 ? Math.round(jeonseAgentFee(price)) : 0

  // 전세대출: 일반 80%, 신혼 최대 3억
  const loanLimit80 = price > 0 ? Math.round(price * 0.8) : 0
  const loanLimitNewlywed = price > 0 ? Math.min(loanLimit80, 30000) : 0
  const actualLoan = data.married ? loanLimitNewlywed : loanLimit80

  const requiredCash = price > 0 ? price - actualLoan + agentFee : 0
  const cashBalance = availableCash - requiredCash

  const monthlyInterest = actualLoan > 0 ? Math.round(actualLoan * loanRate / 100 / 12) : 0

  // Table: 1억~20억 (5천만 단위)
  const tableRows = useMemo(() => {
    return Array.from({ length: 38 }, (_, i) => {
      const p = (i + 2) * 5000 // 1억부터 (2×5000=10000만)
      const fee = Math.round(jeonseAgentFee(p))
      const limit = Math.round(p * 0.8)
      const needCash = p - limit + fee
      const note = p <= 30000 && p * 0.8 <= 30000 ? '신혼특례가능' : p <= 30000 ? `신혼한도3억` : '-'
      return { p, fee, limit, needCash, note }
    })
  }, [])

  const existingLoanAmt = num(data.existingLoanGroom ?? '0') + num(data.existingLoanBride ?? '0')

  return (
    <div>
      <CollapsibleCard title="입력 정보">
        <FormRow label="지역 주소">
          <input type="text" value={data.region} onChange={e => set('region', e.target.value)} placeholder="예: 서울 마포구 합정동" style={inputStyle} />
        </FormRow>
        <FormRow label="목표 전세가 (만원)">
          <input type="number" value={data.price} onChange={e => set('price', e.target.value)} placeholder="예: 40000" style={inputStyle} />
        </FormRow>
        <FormRow label="보유 현금 (만원)">
          <TwoCol>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신랑</div>
              <input type="number" value={data.cashGroom} onChange={e => set('cashGroom', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신부</div>
              <input type="number" value={data.cashBride} onChange={e => set('cashBride', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
          </TwoCol>
        </FormRow>
        <FormRow label="기존 보유 대출 잔액 (만원)">
          <TwoCol>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신랑</div>
              <input type="number" value={data.existingLoanGroom ?? ''} onChange={e => set('existingLoanGroom', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신부</div>
              <input type="number" value={data.existingLoanBride ?? ''} onChange={e => set('existingLoanBride', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
          </TwoCol>
        </FormRow>
        <FormRow label="연소득 (만원)">
          <TwoCol>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신랑</div>
              <input type="number" value={data.incomeGroom} onChange={e => set('incomeGroom', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신부</div>
              <input type="number" value={data.incomeBride} onChange={e => set('incomeBride', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
          </TwoCol>
        </FormRow>
        <FormRow label="월 저축액 (만원)">
          <TwoCol>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신랑</div>
              <input type="number" value={data.savingsGroom} onChange={e => set('savingsGroom', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신부</div>
              <input type="number" value={data.savingsBride} onChange={e => set('savingsBride', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
          </TwoCol>
        </FormRow>
        <FormRow label="대출 조건">
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" checked={data.married} onChange={e => set('married', e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--pk)' }} />
              신혼부부 특례 적용 (80%, 최대 3억)
            </label>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>전세대출 금리 (%)</div>
            <input type="number" value={data.loanRate} onChange={e => set('loanRate', e.target.value)} step="0.1" style={inputStyle} />
          </div>
        </FormRow>
        <FormRow label="목표 계약 시점">
          <input type="date" value={data.targetContract} onChange={e => set('targetContract', e.target.value)} style={inputStyle} />
        </FormRow>
      </CollapsibleCard>

      <CollapsibleCard title="재무 요약">
        <SumRow label="총 보유 현금" value={fmtWon(totalCash)} />
        <SumRow label={`추가 저축 예상 (${months}개월)`} value={fmtWon(extraSavings)} />
        <SumRow label="확보 가능 현금 합계" value={fmtWon(availableCash)} highlight />
        <SumRow label="예상 전세가" value={price > 0 ? fmtWon(price) : '-'} />
        <SumRow label="전세 중개수수료" value={price > 0 ? fmtWon(agentFee) : '-'} />
        <SumRow label="전세자금대출 한도 (일반 80%)" value={loanLimit80 > 0 ? fmtWon(loanLimit80) : '-'} />
        {data.married && <SumRow label="신혼부부 특례 한도 (80%, 최대 3억)" value={loanLimitNewlywed > 0 ? fmtWon(loanLimitNewlywed) : '-'} />}
        {existingLoanAmt > 0 && <SumRow label="기존 대출 잔액" value={fmtWon(existingLoanAmt)} />}
        <SumRow label="적용 대출 한도" value={actualLoan > 0 ? fmtWon(actualLoan) : '-'} highlight />
        <SumRow label="필요 현금 (전세가-대출+수수료)" value={requiredCash > 0 ? fmtWon(requiredCash) : '-'} />
        <SumRow
          label="현금 부족 / 여유"
          value={requiredCash > 0 ? (cashBalance >= 0 ? `+${fmtWon(cashBalance)} 여유` : `${fmtWon(Math.abs(cashBalance))} 부족`) : '-'}
          highlight
          color={requiredCash > 0 ? (cashBalance >= 0 ? '#22c55e' : '#e03060') : undefined}
        />
        <SumRow label="월 이자 (이자만 납부 기준)" value={monthlyInterest > 0 ? fmtWon(monthlyInterest) + '/월' : '-'} />
      </CollapsibleCard>

      <CollapsibleCard title="전세가별 분석표">
        {data.region && <RegBanner region={data.region} />}
        <div style={{ overflowX: 'auto', maxHeight: 360, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--pk5)', zIndex: 1 }}>
              <tr>
                {['전세가', '필요현금', '전세대출(80%)', '중개수수료', '비고'].map((h, hi) => (
                  <th key={h} style={{ padding: '8px 4px', fontWeight: 700, color: hi === 1 ? '#e03060' : 'var(--pk)', textAlign: 'right', whiteSpace: 'nowrap', borderBottom: '1.5px solid var(--pk4)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map(row => {
                const isHighlight = price > 0 && Math.abs(row.p - price) < 2501
                const cols = [
                  { v: fmt(row.p),       color: isHighlight ? 'var(--pk)' : undefined, bold: isHighlight },
                  { v: fmt(row.needCash), color: '#e03060',  bold: false },
                  { v: fmt(row.limit),   color: undefined,   bold: false },
                  { v: fmt(row.fee),     color: undefined,   bold: false },
                  { v: row.note,         color: '#f59e0b',   bold: false },
                ]
                return (
                  <tr key={row.p} style={{ background: isHighlight ? 'var(--pk5)' : undefined }}>
                    {cols.map(({ v, color, bold }, j) => (
                      <td key={j} style={{ padding: '6px 4px', textAlign: 'right', borderBottom: '1px solid var(--gray1)', fontWeight: bold ? 800 : 400, color }}>
                        {v}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CollapsibleCard>
    </div>
  )
}

// ── RentTab ───────────────────────────────────────────────────────────────────

function RentTab({ data, onChange }: { data: HouseDetailRent; onChange: (d: HouseDetailRent) => void }) {
  const set = (k: keyof HouseDetailRent, v: string) => onChange({ ...data, [k]: v })

  const totalCash = num(data.cashGroom) + num(data.cashBride)
  const deposit = num(data.deposit)
  const monthly = num(data.monthly)
  const depositBalance = totalCash - deposit

  const totalIncome = num(data.incomeGroom) + num(data.incomeBride)
  const monthlyIncome = totalIncome > 0 ? totalIncome / 12 : 0
  const rentRatioPct = monthlyIncome > 0 ? ((monthly / monthlyIncome) * 100).toFixed(1) : null

  // 전세 전환: 월세×100 + 보증금
  const jeonseEquiv = monthly * 100 + deposit

  // 매매 전환 참고 (전세의 약 120%)
  const buyEquiv = jeonseEquiv * 1.2

  return (
    <div>
      <CollapsibleCard title="입력 정보">
        <FormRow label="지역 주소">
          <input type="text" value={data.region} onChange={e => set('region', e.target.value)} placeholder="예: 서울 은평구 응암동" style={inputStyle} />
        </FormRow>
        <FormRow label="보증금 (만원)">
          <input type="number" value={data.deposit} onChange={e => set('deposit', e.target.value)} placeholder="예: 5000" style={inputStyle} />
        </FormRow>
        <FormRow label="월세 (만원)">
          <input type="number" value={data.monthly} onChange={e => set('monthly', e.target.value)} placeholder="예: 80" style={inputStyle} />
        </FormRow>
        <FormRow label="보유 현금 (만원)">
          <TwoCol>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신랑</div>
              <input type="number" value={data.cashGroom} onChange={e => set('cashGroom', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신부</div>
              <input type="number" value={data.cashBride} onChange={e => set('cashBride', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
          </TwoCol>
        </FormRow>
        <FormRow label="연소득 (만원)">
          <TwoCol>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신랑</div>
              <input type="number" value={data.incomeGroom} onChange={e => set('incomeGroom', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신부</div>
              <input type="number" value={data.incomeBride} onChange={e => set('incomeBride', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
          </TwoCol>
        </FormRow>
        <FormRow label="월 저축액 (만원)">
          <TwoCol>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신랑</div>
              <input type="number" value={data.savingsGroom} onChange={e => set('savingsGroom', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신부</div>
              <input type="number" value={data.savingsBride} onChange={e => set('savingsBride', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
          </TwoCol>
        </FormRow>
      </CollapsibleCard>

      <CollapsibleCard title="재무 분석">
        <SumRow label="총 보유 현금" value={fmtWon(totalCash)} />
        <SumRow label="보증금" value={deposit > 0 ? fmtWon(deposit) : '-'} />
        <SumRow
          label="보증금 충당 (현금 - 보증금)"
          value={deposit > 0 ? (depositBalance >= 0 ? `+${fmtWon(depositBalance)} 여유` : `${fmtWon(Math.abs(depositBalance))} 부족`) : '-'}
          highlight
          color={deposit > 0 ? (depositBalance >= 0 ? '#22c55e' : '#e03060') : undefined}
        />
        <SumRow label="월세" value={monthly > 0 ? fmtWon(monthly) + '/월' : '-'} />
        <SumRow label="관리비 예상 (참고)" value={monthly > 0 ? `약 ${Math.round(monthly * 0.15)}만원 내외` : '-'} />
        <SumRow
          label="월 소득 대비 월세 비율"
          value={rentRatioPct ? `${rentRatioPct}%` : '-'}
          color={rentRatioPct ? (parseFloat(rentRatioPct) > 30 ? '#e03060' : '#22c55e') : undefined}
        />
        <SumRow label="전세 전환 시 예상 전세가" value={jeonseEquiv > 0 ? fmtWon(jeonseEquiv) : '-'} />
        <SumRow label="매매 전환 참고가 (전세×1.2)" value={buyEquiv > 0 ? fmtWon(buyEquiv) : '-'} />
      </CollapsibleCard>

      {/* 월세 구간별 분석표 */}
      <CollapsibleCard title="월세 구간별 분석표">
        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>
          현재 입력한 보증금 기준 · 월세 금액별 주거비 비교
        </div>
        <div style={{ overflowX: 'auto', maxHeight: 320, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--pk5)', zIndex: 1 }}>
              <tr>
                {['월세', '필요현금(보증금)', '연 주거비', '전세환산가', '매매참고가'].map((h, hi) => (
                  <th key={h} style={{ padding: '7px 3px', fontWeight: 700, color: hi === 1 ? '#e03060' : 'var(--pk)', textAlign: 'right', whiteSpace: 'nowrap', borderBottom: '1.5px solid var(--pk4)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 150, 200].map(m => {
                const isHighlight = monthly > 0 && Math.abs(m - monthly) < 6
                const annualCost = m * 12
                const jeonseEq = m * 100 + deposit
                const buyEq = jeonseEq * 1.2
                return (
                  <tr key={m} style={{ background: isHighlight ? 'var(--pk5)' : undefined }}>
                    <td style={{ padding: '5px 3px', textAlign: 'right', borderBottom: '1px solid var(--gray1)', fontWeight: isHighlight ? 800 : 400, color: isHighlight ? 'var(--pk)' : undefined }}>{fmt(m)}원/월</td>
                    <td style={{ padding: '5px 3px', textAlign: 'right', borderBottom: '1px solid var(--gray1)', color: '#e03060' }}>{deposit > 0 ? fmt(deposit) + '원' : '-'}</td>
                    <td style={{ padding: '5px 3px', textAlign: 'right', borderBottom: '1px solid var(--gray1)' }}>{fmt(annualCost)}원</td>
                    <td style={{ padding: '5px 3px', textAlign: 'right', borderBottom: '1px solid var(--gray1)' }}>{deposit > 0 ? fmt(jeonseEq) + '원' : '-'}</td>
                    <td style={{ padding: '5px 3px', textAlign: 'right', borderBottom: '1px solid var(--gray1)', color: 'var(--text2)' }}>{deposit > 0 ? fmt(buyEq) + '원' : '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 8 }}>💡 보증금을 입력하면 전세환산가·매매참고가가 계산됩니다.</div>
      </CollapsibleCard>

      <CollapsibleCard title="참고 안내" defaultOpen={false}>
        <div style={{ fontSize: 12, color: 'var(--text2)' }}>
          <strong style={{ color: 'var(--pk)' }}>전세 전환율 안내</strong><br />
          전세 전환가 = 월세 × 100 + 보증금 (전환율 12% 기준 근사치)<br />
          매매 참고가는 실제 시세와 다를 수 있으니 현지 임장을 통해 확인하세요.
        </div>
      </CollapsibleCard>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function HouseCalculatorPage() {
  const userData = useAuthStore(s => s.userData)!
  const setUserData = useAuthStore(s => s.setUserData)
  const saveUserData = useAuthStore(s => s.saveUserData)

  const houseDetail: HouseDetail = userData.houseDetail ?? DEFAULT_HOUSE_DETAIL

  function update(next: HouseDetail) {
    // Also keep calcHouse.totalCost in sync
    let totalCost = userData.calcHouse.totalCost
    if (next.mode === 'buy' && next.buy.price) totalCost = num(next.buy.price)
    else if (next.mode === 'jeonse' && next.jeonse.price) totalCost = num(next.jeonse.price)
    else if (next.mode === 'rent' && next.rent.monthly) totalCost = num(next.rent.monthly) * 12
    const newUserData = {
      ...userData,
      houseDetail: next,
      calcHouse: { ...userData.calcHouse, totalCost },
    }
    setUserData(newUserData)
    saveUserData()
  }

  const mode = houseDetail.mode
  const timelineSteps = mode === 'buy' ? BUY_STEPS : mode === 'jeonse' ? JEONSE_STEPS : RENT_STEPS

  const budget = userData.calcHouse.budget || 0
  const currentPrice = mode === 'buy' ? num(houseDetail.buy.price) : mode === 'jeonse' ? num(houseDetail.jeonse.price) : 0
  const budgetDiff = budget > 0 && currentPrice > 0 ? budget - currentPrice : null

  function updateBudget(val: number) {
    setUserData({ ...userData, calcHouse: { ...userData.calcHouse, budget: val } })
  }

  // ── 거주형태별 기본값 프리셋
  const HOUSE_MODE_PRESETS = {
    rent:   { region: '서울 마포구 합정동', deposit: '3000',  monthly: '80'  },
    jeonse: { region: '경기도 성남시 분당구', price: '25000' },
    buy:    { region: '경기도 수원시 영통구', price: '40000', loanCondition: '신혼부부특례' as const },
  }

  // 거주형태 변경 + 비어있을 경우 기본값 적용
  function switchMode(key: HouseDetail['mode']) {
    const next = { ...houseDetail, mode: key }
    if (key === 'rent' && !next.rent.deposit && !next.rent.monthly) {
      next.rent = { ...next.rent, ...HOUSE_MODE_PRESETS.rent }
    }
    if (key === 'jeonse' && !next.jeonse.price) {
      next.jeonse = { ...next.jeonse, ...HOUSE_MODE_PRESETS.jeonse }
    }
    if (key === 'buy' && !next.buy.price) {
      next.buy = { ...next.buy, ...HOUSE_MODE_PRESETS.buy }
    }
    update(next)
  }

  // 히어로 카드용 핵심 수치 계산
  const heroBuy = (() => {
    const p = num(houseDetail.buy.price)
    if (!p) return null
    const tax = Math.round(p * acquisitionTaxRate(p))
    const fee = Math.round(buyAgentFee(p))
    const reg = houseDetail.buy.region ? getRegulation(houseDetail.buy.region) : null
    const condDef = LOAN_CONDITIONS.find(c => c.key === (houseDetail.buy.loanCondition ?? '일반')) ?? LOAN_CONDITIONS[0]
    const effectiveLtv = reg ? Math.min(reg.ltvPct + condDef.ltvBonusPct, condDef.maxLtvPct) : 50
    const ltvRaw = Math.round(p * effectiveLtv / 100)
    const actualLoan = condDef.loanCapMan > 0 ? Math.min(ltvRaw, condDef.loanCapMan) : ltvRaw
    const loanRate = num(houseDetail.buy.loanRate) || 4.5
    const loanYears = num(houseDetail.buy.loanYears) || 30
    const loanMonthly = actualLoan > 0
      ? Math.round(monthlyPayment(actualLoan * 10000, loanRate, loanYears, houseDetail.buy.repaymentMethod) / 10000)
      : 0
    return { price: p, tax, fee, needCash: p - actualLoan + tax + fee, actualLoan, loanMonthly }
  })()
  const heroJeonse = (() => {
    const p = num(houseDetail.jeonse.price)
    if (!p) return null
    const fee = Math.round(jeonseAgentFee(p))
    const loan = Math.round(p * 0.8)
    const loanRate = num(houseDetail.jeonse.loanRate) || 3.5
    const monthlyInterest = loan > 0 ? Math.round(loan * loanRate / 100 / 12) : 0
    return { price: p, fee, loan, needCash: p - loan + fee, monthlyInterest }
  })()
  const heroRent = (() => {
    const dep = num(houseDetail.rent.deposit)
    const mon = num(houseDetail.rent.monthly)
    if (!dep && !mon) return null
    return { deposit: dep, monthly: mon, annual: mon * 12 }
  })()

  // ── 단계 자동 감지 ──────────────────────────────────────────────────────────
  const houseStep = (() => {
    const d = houseDetail
    // Step 1: 거주형태 선택 — 항상 완료 (앱에 들어온 것 자체)
    // Step 2: 재정현황 파악 — 금액 + 현금 입력 여부
    const hasPriceInput = mode === 'buy'
      ? !!num(d.buy.price)
      : mode === 'jeonse'
        ? !!num(d.jeonse.price)
        : !!(num(d.rent.deposit) || num(d.rent.monthly))
    const hasCashInput = mode === 'buy'
      ? !!(num(d.buy.cashGroom) || num(d.buy.cashBride))
      : mode === 'jeonse'
        ? !!(num(d.jeonse.cashGroom) || num(d.jeonse.cashBride))
        : !!(num(d.rent.cashGroom) || num(d.rent.cashBride))
    const step2Done = hasPriceInput && hasCashInput
    // Step 3: 대출 전략 — 소득 입력 여부 (매매), 금리 입력 여부 (전세), 월세는 불필요
    const step3Done = mode === 'buy'
      ? !!(num(d.buy.incomeGroom) || num(d.buy.incomeBride))
      : mode === 'jeonse'
        ? !!num(d.jeonse.loanRate)
        : true
    // Step 4: 매물탐색 — address 입력 여부
    const step4Done = !!(d.address && d.address.trim())
    // Step 5: 계약체결 — targetMoveIn 입력 여부
    const step5Done = !!d.targetMoveIn

    if (!step2Done) return 2
    if (!step3Done) return 3
    if (!step4Done) return 4
    if (!step5Done) return 5
    return 6 // 모두 완료
  })()

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 16px 32px' }}>
      {/* ── 거주 형태 선택 (pill chips) ── */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 6 }}>
          🏠 거주 형태 · 자동 예시값 세팅
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
          {([
            { key: 'rent'   as const, emoji: '🏠', label: '월세', sub: '보증금+월세', color: '#f97316' },
            { key: 'jeonse' as const, emoji: '🔑', label: '전세', sub: '전세금 기준',  color: '#3b82f6' },
            { key: 'buy'    as const, emoji: '🏡', label: '매매', sub: '매매가 기준',  color: '#22c55e' },
          ] as const).map(({ key, emoji, label, sub, color }) => {
            const active = mode === key
            return (
              <button key={key} onClick={() => switchMode(key)} style={{
                flexShrink: 0,
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 100, cursor: 'pointer',
                border: `1.5px solid ${active ? color : 'var(--gray2)'}`,
                background: active ? color : '#fff',
                color: active ? '#fff' : 'var(--text)',
                boxShadow: active ? `0 3px 10px ${color}55` : '0 1px 4px rgba(0,0,0,.06)',
                transition: 'all .15s',
              }}>
                <span style={{ fontSize: 16 }}>{emoji}</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap' }}>{label}</div>
                  <div style={{ fontSize: 9, opacity: active ? .85 : .55, whiteSpace: 'nowrap' }}>{sub}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── 예산 히어로 카드 ── */}
      <div style={{ background: 'linear-gradient(135deg,var(--pk),var(--mn))', borderRadius: 14, padding: '16px', color: '#fff', marginBottom: 12, boxShadow: '0 6px 24px rgba(255,107,157,.25)' }}>
        {/* 거주형태 배지 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{ background: 'rgba(255,255,255,.22)', border: '1px solid rgba(255,255,255,.4)', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 800 }}>
            {mode === 'buy' ? '🏡 매매' : mode === 'jeonse' ? '🔑 전세' : '🏠 월세'}
          </span>
        </div>

        {/* 메인 수치 + 잔여 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 11, opacity: .8, fontWeight: 600, marginBottom: 2 }}>
              {mode === 'buy' ? '🏡 목표 매매가' : mode === 'jeonse' ? '🔑 목표 전세가' : '🏠 월 주거비'}
            </div>
            <div style={{ fontSize: 'clamp(22px,6vw,28px)', fontWeight: 900, lineHeight: 1 }}>
              {mode === 'rent'
                ? (heroRent ? `${fmtWon(heroRent.monthly)}/월` : '미입력')
                : (currentPrice > 0 ? fmtWon(currentPrice) : '미입력')}
            </div>
            {mode !== 'rent' && budget > 0 && (
              <div style={{ fontSize: 11, opacity: .75, marginTop: 4 }}>목표 예산 {fmtWon(budget)} 기준</div>
            )}
          </div>
          {mode !== 'rent' && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, opacity: .8, marginBottom: 2 }}>예산 여유</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: budgetDiff !== null && budgetDiff < 0 ? '#ffd0d0' : '#a8ffdf' }}>
                {budgetDiff !== null
                  ? (budgetDiff >= 0 ? `+${fmtWon(budgetDiff)}` : `-${fmtWon(Math.abs(budgetDiff))}`)
                  : '-'}
              </div>
            </div>
          )}
        </div>

        {/* 핵심 수치 요약 미니 카드 */}
        {mode === 'buy' && heroBuy && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: 10 }}>
            {[
              { label: '취득세', val: fmtWon(heroBuy.tax), highlight: false },
              { label: '중개수수료', val: fmtWon(heroBuy.fee), highlight: false },
              { label: '예상 대출', val: heroBuy.actualLoan > 0 ? fmtWon(heroBuy.actualLoan) : '-', highlight: true },
              { label: '월 상환액', val: heroBuy.loanMonthly > 0 ? `${fmt(heroBuy.loanMonthly)}/월` : '-', highlight: true },
            ].map(({ label, val, highlight }) => (
              <div key={label} style={{ background: highlight ? 'rgba(255,255,100,.18)' : 'rgba(255,255,255,.15)', borderRadius: 8, padding: '6px 4px', textAlign: 'center', border: highlight ? '1px solid rgba(255,255,100,.35)' : 'none' }}>
                <div style={{ fontSize: 9, color: highlight ? '#ffe86e' : 'rgba(255,255,255,.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
                <div style={{ fontSize: 11, fontWeight: 800, marginTop: 2, color: highlight ? '#ffe86e' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</div>
              </div>
            ))}
          </div>
        )}
        {mode === 'jeonse' && heroJeonse && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: 10 }}>
            {[
              { label: '전세대출 (80%)', val: fmtWon(heroJeonse.loan), highlight: false },
              { label: '중개수수료', val: fmtWon(heroJeonse.fee), highlight: false },
              { label: '예상 대출', val: fmtWon(heroJeonse.loan), highlight: true },
              { label: '월 이자', val: heroJeonse.monthlyInterest > 0 ? `${fmt(heroJeonse.monthlyInterest)}/월` : '-', highlight: true },
            ].map(({ label, val, highlight }) => (
              <div key={label} style={{ background: highlight ? 'rgba(255,255,100,.18)' : 'rgba(255,255,255,.15)', borderRadius: 8, padding: '6px 4px', textAlign: 'center', border: highlight ? '1px solid rgba(255,255,100,.35)' : 'none' }}>
                <div style={{ fontSize: 9, color: highlight ? '#ffe86e' : 'rgba(255,255,255,.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
                <div style={{ fontSize: 11, fontWeight: 800, marginTop: 2, color: highlight ? '#ffe86e' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</div>
              </div>
            ))}
          </div>
        )}
        {mode === 'rent' && heroRent && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {[
              { label: '보증금', val: fmtWon(heroRent.deposit) },
              { label: '월세', val: `${fmt(heroRent.monthly)}/월` },
              { label: '연 주거비', val: fmtWon(heroRent.annual) },
            ].map(({ label, val }) => (
              <div key={label} style={{ flex: 1, background: 'rgba(255,255,255,.15)', borderRadius: 8, padding: '6px 4px', textAlign: 'center', minWidth: 0 }}>
                <div style={{ fontSize: 9, opacity: .8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
                <div style={{ fontSize: 11, fontWeight: 800, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{val}</div>
              </div>
            ))}
          </div>
        )}

        {/* 목표 예산 입력 (월세 제외) */}
        {mode !== 'rent' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.15)', borderRadius: 9, padding: '7px 12px' }}>
            <span style={{ fontSize: 11, opacity: .85, whiteSpace: 'nowrap', flexShrink: 0 }}>목표 예산</span>
            <input
              type="number"
              value={budget || ''}
              onChange={e => updateBudget(parseInt(e.target.value) || 0)}
              placeholder="미설정"
              style={{ flex: 1, border: 'none', background: 'transparent', color: '#fff', fontSize: 14, fontWeight: 700, outline: 'none', textAlign: 'right', minWidth: 0 }}
            />
            <span style={{ fontSize: 11, opacity: .7, flexShrink: 0 }}>만원</span>
          </div>
        )}
      </div>

      {/* ── 단계별 준비 가이드 ── */}
      {(() => {
        const steps = [
          { n: 1, title: '거주 형태 결정', desc: mode === 'buy' ? '매매 선택 완료' : mode === 'jeonse' ? '전세 선택 완료' : '월세 선택 완료' },
          { n: 2, title: '재정 현황 파악', desc: '금액 · 보유현금 입력' },
          { n: 3, title: '대출 전략 수립', desc: mode === 'buy' ? '소득 입력 · 대출조건 설정' : mode === 'jeonse' ? '금리 설정 완료' : '해당 없음' },
          { n: 4, title: '매물 탐색', desc: '아파트명 / 주소 입력' },
          { n: 5, title: '계약 체결', desc: '입주 목표일 설정' },
        ]
        const totalDone = Math.min(houseStep - 1, 5)
        const pct = Math.round((totalDone / 5) * 100)
        return (
          <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid var(--pk4)', overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ background: 'var(--pk5)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 800 }}>🗺️ 신혼집 준비 단계</span>
              <span style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 600 }}>{totalDone}/5 단계 완료</span>
            </div>
            <div style={{ height: 4, background: 'var(--gray1)', margin: '0 16px' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: 'var(--pk)', borderRadius: 2, transition: 'width .5s' }} />
            </div>
            <div style={{ padding: '8px 16px 12px' }}>
              {steps.map(s => {
                const isDone = s.n < houseStep
                const isActive = s.n === houseStep && houseStep <= 5
                return (
                  <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: s.n < 5 ? '1px solid var(--gray1)' : 'none' }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                      background: isDone ? 'var(--pk)' : isActive ? 'var(--pk)' : 'var(--pk4)',
                      color: isDone || isActive ? '#fff' : 'var(--pk)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 800,
                      boxShadow: isActive ? '0 0 8px rgba(255,107,157,.4)' : 'none',
                    }}>
                      {isDone ? '✓' : s.n}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: isDone ? 'var(--text2)' : 'var(--text)' }}>{s.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 1 }}>{s.desc}</div>
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                      background: isDone ? '#dcfce7' : isActive ? 'var(--pk4)' : 'var(--gray1)',
                      color: isDone ? '#16a34a' : isActive ? 'var(--pk)' : 'var(--text2)' }}>
                      {isDone ? '완료' : isActive ? '진행 중' : '예정'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* ── 지금 할 일 팁 카드 ── */}
      {(() => {
        const tips: Record<number, { title: string; items: string[] }> = {
          2: {
            title: `💡 지금 이걸 해보세요 — ${mode === 'buy' ? '재정 현황' : '재정 현황'} 단계`,
            items: [
              `목표 ${mode === 'buy' ? '매매가' : mode === 'jeonse' ? '전세가' : '보증금+월세'}를 입력해주세요`,
              '보유 현금 (신랑+신부 합산)을 입력하면 부족/여유 현금이 계산돼요',
              '월 저축액을 입력하면 계약 시점까지 추가 저축 금액도 반영돼요',
            ],
          },
          3: {
            title: mode === 'buy'
              ? '💡 지금 이걸 해보세요 — 대출 전략 단계'
              : '💡 지금 이걸 해보세요 — 전세대출 금리 확인',
            items: mode === 'buy' ? [
              '연소득(신랑+신부)을 입력하면 DSR 기준 대출 한도가 계산돼요',
              '신혼부부특례 (금리 1.85~3.0%) · 디딤돌 · 보금자리론 요건 확인하기',
              '주거래은행 대출 상담 예약 (금리 비교 필수)',
            ] : [
              '전세자금대출 금리 (현재 기준 약 3.0~4.0%)를 입력해주세요',
              '신혼부부 특례 대출 최대 3억, 금리 우대 가능 여부 확인',
              '주택도시보증공사(HUG) 전세보증보험 가입도 함께 검토해보세요',
            ],
          },
          4: {
            title: '💡 지금 이걸 해보세요 — 매물 탐색 단계',
            items: [
              '아파트명 / 주소를 입력하면 규제지역 LTV가 자동으로 적용돼요',
              '현지 임장: 교통편·학군·편의시설·소음 직접 확인',
              '네이버 부동산·호갱노노에서 실거래가 트렌드 확인하기',
            ],
          },
          5: {
            title: '💡 지금 이걸 해보세요 — 계약 체결 준비',
            items: [
              '입주 목표일을 설정하면 준비 타임라인이 표시돼요',
              '계약 전 등기부등본 확인 필수 (선순위 근저당 체크)',
              '계약금 → 중도금 → 잔금 일정 확인 후 자금 계획 확정',
            ],
          },
          6: {
            title: '✅ 모든 단계 완료! 최종 점검',
            items: [
              '대출 승인 → 잔금 납부 → 소유권 이전 등기 순서로 진행',
              '이사 후 14일 이내 전입신고 + 확정일자 필수',
              '취득세는 취득일 기준 60일 이내 납부',
            ],
          },
        }
        const tip = tips[Math.min(houseStep, 6)]
        if (!tip) return null
        return (
          <div style={{ background: 'linear-gradient(135deg, #fff5f9, #f0f0ff)', border: '1.5px solid var(--pk4)', borderRadius: 12, padding: '12px 14px', marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--pk)', marginBottom: 8 }}>{tip.title}</div>
            {tip.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4, fontSize: 12, color: '#444', lineHeight: 1.5 }}>
                <span style={{ flexShrink: 0, opacity: .6 }}>•</span>{item}
              </div>
            ))}
          </div>
        )
      })()}

      {/* Common header section */}
      <CollapsibleCard title="기본 정보">
        <FormRow label="입주 목표 시점">
          <input
            type="date"
            value={houseDetail.targetMoveIn}
            onChange={e => update({ ...houseDetail, targetMoveIn: e.target.value })}
            style={inputStyle}
          />
        </FormRow>
        <FormRow label="아파트명 / 주소">
          <input
            type="text"
            value={houseDetail.address}
            onChange={e => {
              const addr = e.target.value
              // 기본정보 주소 → 각 탭의 지역주소 자동 동기화
              update({
                ...houseDetail,
                address: addr,
                buy: { ...houseDetail.buy, region: addr },
                jeonse: { ...houseDetail.jeonse, region: addr },
                rent: { ...houseDetail.rent, region: addr },
              })
            }}
            placeholder="예: 래미안 퍼스티지 (반포동)"
            style={inputStyle}
          />
        </FormRow>
        <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: -4 }}>입력 시 매매·전세·월세 탭의 지역주소가 자동으로 동기화됩니다.</div>
      </CollapsibleCard>

      {/* Timeline */}
      <CollapsibleCard title="준비 타임라인" defaultOpen={false}>
        <Timeline moveInDate={houseDetail.targetMoveIn} steps={timelineSteps} />
      </CollapsibleCard>

      {/* Tab content */}
      {mode === 'buy' && (
        <BuyTab
          data={houseDetail.buy}
          onChange={buy => update({ ...houseDetail, buy })}
        />
      )}
      {mode === 'jeonse' && (
        <JeonseTab
          data={houseDetail.jeonse}
          onChange={jeonse => update({ ...houseDetail, jeonse })}
        />
      )}
      {mode === 'rent' && (
        <RentTab
          data={houseDetail.rent}
          onChange={rent => update({ ...houseDetail, rent })}
        />
      )}

      {/* ── 인테리어 비용 계산기 ── */}
      <InteriorCalculatorSection
        interiorData={userData.interiorData}
        onUpdate={data => {
          setUserData({ ...userData, interiorData: data })
          saveUserData()
        }}
      />

      {/* 배너 광고 — 페이지 최하단 */}
      <BannerAd />
    </div>
  )
}
