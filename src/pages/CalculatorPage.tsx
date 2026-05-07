import { useState, useEffect } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { useAuthStore } from '../stores/authStore'
import { CALC_CAT_LABELS, CALC_SEEDS, MEAL_PRICE_OPTIONS, type WeddingSeedItem } from '../data/calculatorSeeds'
import { VENUE_LIST, fmtHallLabel, fmtVenuePrice } from '../data/venueSeed'
import { AnalyticsService } from '../services/analytics'
import type { CalcState, CalcCustomItem } from '../types'
import BannerAd from '../components/ads/BannerAd'

type CalcType = 'wedding' | 'honeymoon' | 'house'

// ── 결혼 스타일 프리셋 ──────────────────────────────────────────
type WeddingStyle = 'simple' | 'basic' | 'luxury'

const STYLE_MEAL: Record<WeddingStyle, { count: number; price: number }> = {
  simple: { count: 150, price: 66000 },
  basic:  { count: 200, price: 77000 },
  luxury: { count: 350, price: 99000 },
}
const STYLE_VENUE: Record<WeddingStyle, number> = {
  simple: 200,
  basic:  500,
  luxury: 1200,
}

function WeddingStylePicker({ onSelect, onSkip }: { onSelect: (s: WeddingStyle) => void; onSkip: () => void }) {
  const STYLES: { key: WeddingStyle; emoji: string; title: string; desc: string; color: string }[] = [
    { key: 'simple',  emoji: '💚', title: '심플 미니멀',   desc: '꼭 필요한 것만 · 150명 · 6.6만원/인 · 가성비 집중', color: '#f0faf4' },
    { key: 'basic',   emoji: '💛', title: '베이직 스탠다드', desc: '전국 평균 수준 · 200명 · 7.7만원/인 · 알찬 구성',  color: 'var(--pk5)' },
    { key: 'luxury',  emoji: '❤️', title: '럭셔리 프리미엄', desc: '최고급 서비스 · 350명 · 9.9만원/인 · 풀 구성',    color: '#fff8e1' },
  ]
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 360, padding: '28px 20px', boxShadow: '0 24px 80px rgba(0,0,0,.25)' }}>
        <div style={{ fontSize: 22, textAlign: 'center', marginBottom: 8 }}>💒</div>
        <div style={{ fontSize: 18, fontWeight: 800, textAlign: 'center', marginBottom: 4 }}>어떤 스타일의 결혼을 준비 중이에요?</div>
        <div style={{ fontSize: 12, color: 'var(--text2)', textAlign: 'center', marginBottom: 20 }}>선택하면 맞춤 항목과 가격이 자동 세팅돼요 ✨</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {STYLES.map(s => (
            <button key={s.key} onClick={() => onSelect(s.key)}
              style={{ display: 'flex', alignItems: 'center', gap: 14, background: s.color, border: '2px solid transparent', borderRadius: 14, padding: '16px 18px', cursor: 'pointer', textAlign: 'left', transition: 'border-color .15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--pk)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
            >
              <span style={{ fontSize: 28 }}>{s.emoji}</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>{s.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.desc}</div>
              </div>
            </button>
          ))}
        </div>
        <button onClick={onSkip} style={{ width: '100%', background: 'none', border: 'none', marginTop: 16, fontSize: 13, color: 'var(--text2)', cursor: 'pointer', padding: '8px 0' }}>직접 입력할게요 →</button>
      </div>
    </div>
  )
}

// ── 항목 설명 팝업 ──────────────────────────────────────────────
interface InfoPopupData { name: string; required?: boolean; prepStage?: string; description: string }

function InfoPopup({ data, onClose }: { data: InfoPopupData; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 4000, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 400, padding: '22px 20px', boxShadow: '0 24px 80px rgba(0,0,0,.3)', maxHeight: '80vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
              background: data.required ? 'var(--pk5)' : '#f3f4f6',
              color: data.required ? 'var(--pk)' : 'var(--text2)' }}>
              {data.required ? '★ 필수항목' : '☆ 선택항목'}
            </span>
            {data.prepStage && (
              <span style={{ fontSize: 11, color: 'var(--text2)', marginLeft: 6 }}>⏱ {data.prepStage}</span>
            )}
            <div style={{ fontSize: 16, fontWeight: 800, marginTop: 8, color: 'var(--text)' }}>{data.name}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text2)', padding: '0 0 0 8px', lineHeight: 1, flexShrink: 0 }}>✕</button>
        </div>
        <div style={{ height: 1, background: 'var(--gray1)', marginBottom: 14 }} />
        <div style={{ fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-line', color: 'var(--text)' }}>
          {data.description || '항목 설명이 없습니다.'}
        </div>
      </div>
    </div>
  )
}

// n is in 만원
function fmt(n: number) {
  if (n === 0) return '0만원'
  if (Math.abs(n) >= 10000) return `${(n / 10000).toFixed(1)}억원`
  return `${n.toLocaleString()}만원`
}

// 웨딩 씨드 item 조회 헬퍼
function getWeddingSeed(catKey: string, itemId: string): WeddingSeedItem | null {
  const wSeeds = CALC_SEEDS.wedding as Record<string, WeddingSeedItem[]>
  const catSeeds = wSeeds[catKey]
  if (!catSeeds) return null
  return catSeeds.find(s => s[0] === itemId) ?? null
}

export default function CalculatorPage({ typeOverride }: { typeOverride?: CalcType } = {}) {
  const { type = 'wedding' } = useParams<{ type: string }>()
  const calcType = (typeOverride ?? type) as CalcType
  const location = useLocation()
  const userData = useAuthStore(s => s.userData)!
  const setUserData = useAuthStore(s => s.setUserData)
  const saveUserData = useAuthStore(s => s.saveUserData)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [addInputs, setAddInputs] = useState<Record<string, string>>({})
  const [budgetInput, setBudgetInput] = useState('')
  const [showStylePicker, setShowStylePicker] = useState(
    calcType === 'wedding' && !!(location.state as any)?.fromOnboarding
  )
  const [infoPopup, setInfoPopup] = useState<InfoPopupData | null>(null)

  const calcKey = calcType === 'wedding' ? 'calcWedding' : calcType === 'honeymoon' ? 'calcHoneymoon' : 'calcHouse'
  const calc = userData[calcKey]

  useEffect(() => {
    setBudgetInput(calc.budget > 0 ? String(calc.budget) : '')
    const seeds = CALC_SEEDS[calcType]
    if (!seeds) return
    let changed = false
    const newCats = { ...calc.cats }

    // ① 새 카테고리 초기화 (sdm_common, gifts 등 기존 users에 없을 수 있음)
    Object.keys(seeds).forEach(catKey => {
      if (!newCats[catKey]) {
        newCats[catKey] = { defItems: [], customItems: [] }
        changed = true
      }
    })

    // ② 항목 씨딩/업데이트
    Object.entries(seeds).forEach(([catKey, seedItems]) => {
      const cat = newCats[catKey]
      if (!cat) return

      const isWeddingSeed = seedItems.length > 0 && typeof seedItems[0][2] === 'boolean'

      // 재초기화 조건: 빈 배열 / 구 단위(원) / ID 불일치 / 개수 불일치
      const hasOldUnits    = cat.defItems.some(it => it.avg >= 10000)
      const hasIdMismatch  = seedItems.some(s => !cat.defItems.find(it => it.id === s[0]))
                          || cat.defItems.some(it => !seedItems.find(s => s[0] === it.id))
      const hasCountMismatch = seedItems.length > 0 && cat.defItems.length !== seedItems.length
      const hasNameMismatch  = cat.defItems.some(it => {
        const seed = seedItems.find(s => s[0] === it.id)
        return seed && seed[1] !== it.name
      })

      if (cat.defItems.length === 0 || hasOldUnits || hasIdMismatch || hasCountMismatch || hasNameMismatch) {
        if (isWeddingSeed) {
          newCats[catKey] = {
            ...cat,
            defItems: (seedItems as WeddingSeedItem[]).map(s => ({
              id: s[0], name: s[1], avg: s[7],
              customVal: '', checked: s[2] === true, deleted: false,
              required: s[2], prepStage: s[3],
            })),
          }
        } else {
          newCats[catKey] = {
            ...cat,
            defItems: seedItems.map((s: any[]) => ({
              id: s[0] as string, name: s[1] as string, avg: s[2] as number,
              customVal: '', checked: s[3] !== false, deleted: false,
            })),
          }
        }
        changed = true
      }
    })

    if (changed) {
      const recomputed = computeTotal({ ...calc, cats: newCats }, calcType)
      setUserData({ ...userData, [calcKey]: recomputed })
      saveUserData()
    }
  }, [calcType]) // eslint-disable-line

  function computeTotal(c: CalcState, ct: CalcType = calcType): CalcState {
    let total = 0
    if (ct === 'wedding') {
      const effectivePrice = c.mealPrice === 0 ? (c.mealCustom || 0) : c.mealPrice
      total += Math.round((c.mealCount * effectivePrice) / 10000)
      total += c.venueDirect ?? 0
    }
    Object.values(c.cats).forEach(cat => {
      cat.defItems.forEach(it => {
        if (it.checked && !it.deleted) total += it.customVal ? Number(it.customVal) || 0 : it.avg
      })
      cat.customItems.forEach(it => { if (it.checked) total += it.price })
    })
    return { ...c, totalCost: total }
  }

  function updateCalc(newCalc: CalcState) {
    const updated = computeTotal(newCalc)
    setUserData({ ...userData, [calcKey]: updated })
    saveUserData()
  }

  function applyStyle(style: WeddingStyle) {
    const meal = STYLE_MEAL[style]
    const newCats = { ...calc.cats }

    Object.entries(newCats).forEach(([catKey, cat]) => {
      newCats[catKey] = {
        ...cat,
        defItems: cat.defItems.map(it => {
          const seed = getWeddingSeed(catKey, it.id)
          if (!seed) return it

          if (style === 'simple') {
            if (seed[4] !== null) {
              return { ...it, checked: true, customVal: String(seed[4]) }
            } else {
              return { ...it, checked: false, customVal: '' }
            }
          } else if (style === 'basic') {
            return { ...it, checked: true, customVal: String(seed[5]) }
          } else { // luxury
            return { ...it, checked: true, customVal: String(seed[6]) }
          }
        }),
      }
    })

    updateCalc({
      ...calc,
      cats: newCats,
      mealCount: meal.count,
      mealPrice: meal.price,
      venueDirect: STYLE_VENUE[style],
    })
    setShowStylePicker(false)
  }

  function exportExcel() {
    const catLabels = CALC_CAT_LABELS[calcType] || {}
    const rows: (string | number)[][] = [['카테고리', '항목', '선택', '금액(만원)']]
    if (calcType === 'wedding') {
      const ep = calc.mealPrice === 0 ? (calc.mealCustom || 0) : calc.mealPrice
      const mt = Math.round((calc.mealCount * ep) / 10000)
      rows.push(['식사/대관', `하객 ${calc.mealCount}명 × ${(ep / 10000).toFixed(1)}만원/인`, '✓', mt])
      rows.push(['식사/대관', `예식장 대관료`, '✓', calc.venueDirect ?? 0])
    }
    Object.entries(calc.cats).forEach(([catKey, cat]) => {
      const label = catLabels[catKey] || catKey
      cat.defItems.filter(it => !it.deleted).forEach(it => {
        const amt = it.customVal ? Number(it.customVal) || 0 : it.avg
        rows.push([label, it.name, it.checked ? '✓' : '', it.checked ? amt : 0])
      })
      cat.customItems.forEach(it => {
        rows.push([label, it.name, it.checked ? '✓' : '', it.checked ? it.price : 0])
      })
    })
    rows.push(['', '', '합계', calc.totalCost])
    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 18 }, { wch: 24 }, { wch: 6 }, { wch: 12 }]
    const wb = XLSX.utils.book_new()
    const sheetName = calcType === 'wedding' ? '결혼식비용' : calcType === 'honeymoon' ? '신혼여행비용' : '신혼집비용'
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
    XLSX.writeFile(wb, `딸깍_${sheetName}.xlsx`)
  }

  function toggleDef(catKey: string, itemId: string) {
    const newCats = { ...calc.cats }
    newCats[catKey] = { ...newCats[catKey], defItems: newCats[catKey].defItems.map(it => it.id === itemId ? { ...it, checked: !it.checked } : it) }
    updateCalc({ ...calc, cats: newCats })
  }

  function setDefAmt(catKey: string, itemId: string, val: string) {
    const newCats = { ...calc.cats }
    newCats[catKey] = { ...newCats[catKey], defItems: newCats[catKey].defItems.map(it => it.id === itemId ? { ...it, customVal: val } : it) }
    updateCalc({ ...calc, cats: newCats })
  }

  function toggleCustom(catKey: string, itemId: string) {
    const newCats = { ...calc.cats }
    newCats[catKey] = { ...newCats[catKey], customItems: newCats[catKey].customItems.map(it => it.id === itemId ? { ...it, checked: !it.checked } : it) }
    updateCalc({ ...calc, cats: newCats })
  }

  function setCustomAmt(catKey: string, itemId: string, val: string) {
    const newCats = { ...calc.cats }
    newCats[catKey] = { ...newCats[catKey], customItems: newCats[catKey].customItems.map(it => it.id === itemId ? { ...it, price: Number(val) || 0 } : it) }
    updateCalc({ ...calc, cats: newCats })
  }

  function delCustom(catKey: string, itemId: string) {
    const newCats = { ...calc.cats }
    newCats[catKey] = { ...newCats[catKey], customItems: newCats[catKey].customItems.filter(it => it.id !== itemId) }
    updateCalc({ ...calc, cats: newCats })
  }

  function addCustom(catKey: string) {
    const name = (addInputs[catKey] || '').trim()
    if (!name) return
    const newItem: CalcCustomItem = { id: 'c' + Date.now(), name, price: 0, checked: true }
    const newCats = { ...calc.cats }
    newCats[catKey] = { ...newCats[catKey], customItems: [...newCats[catKey].customItems, newItem] }
    updateCalc({ ...calc, cats: newCats })
    setAddInputs(prev => ({ ...prev, [catKey]: '' }))
  }

  function deleteDefItem(catKey: string, itemId: string) {
    const newCats = { ...calc.cats }
    newCats[catKey] = { ...newCats[catKey], defItems: newCats[catKey].defItems.map(it => it.id === itemId ? { ...it, deleted: true } : it) }
    updateCalc({ ...calc, cats: newCats })
  }

  function saveBudget() {
    const b = Number(budgetInput.replace(/,/g, '')) || 0
    updateCalc({ ...calc, budget: b })
  }

  function openInfo(catKey: string, it: { id: string; name: string; required?: boolean; prepStage?: string }) {
    const seed = getWeddingSeed(catKey, it.id)
    setInfoPopup({
      name: it.name,
      required: it.required,
      prepStage: it.prepStage,
      description: seed ? seed[8] : '',
    })
  }

  const catLabels = CALC_CAT_LABELS[calcType] || {}
  const diff = calc.budget - calc.totalCost
  const usedPct = calc.budget > 0 ? Math.min(100, Math.round(calc.totalCost / calc.budget * 100)) : 0
  const effectiveMealPrice = calc.mealPrice === 0 ? (calc.mealCustom || 0) : calc.mealPrice
  const mealTotal = calcType === 'wedding' ? Math.round((calc.mealCount * effectiveMealPrice) / 10000) : 0

  return (
    <div>
      {showStylePicker && calcType === 'wedding' && (
        <WeddingStylePicker onSelect={applyStyle} onSkip={() => setShowStylePicker(false)} />
      )}
      {infoPopup && <InfoPopup data={infoPopup} onClose={() => setInfoPopup(null)} />}

      <div style={{ background: 'linear-gradient(135deg,var(--pk),var(--mn))', borderRadius: 14, padding: '18px 20px', color: '#fff', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          {[
            ['목표 예산', calc.budget > 0 ? fmt(calc.budget) : '미설정'],
            ['예상 비용', fmt(calc.totalCost)],
            ['차액', (diff >= 0 ? '+' : '') + fmt(diff)],
          ].map(([label, val]) => (
            <div key={label} style={{ flex: 1, minWidth: 90 }}>
              <div style={{ fontSize: 11, opacity: .75, marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: label === '차액' && diff < 0 ? '#ffd0d0' : '#fff' }}>{val}</div>
            </div>
          ))}
        </div>
        {calc.budget > 0 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: .8, marginBottom: 4 }}>
              <span>예산 사용률</span><span>{usedPct}%</span>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,.3)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${usedPct}%`, background: usedPct > 100 ? '#ff6b6b' : '#fff', borderRadius: 4, transition: 'width .5s' }} />
            </div>
          </>
        )}
      </div>

      {/* Budget input */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', marginBottom: 8, boxShadow: '0 2px 12px rgba(255,107,157,.08)', border: '1.5px solid var(--pk4)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>목표 예산 설정</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type='number' value={budgetInput} onChange={e => setBudgetInput(e.target.value)} onBlur={saveBudget} onKeyDown={e => e.key === 'Enter' && saveBudget()} placeholder='예산 입력' style={{ flex: 1, border: '1.5px solid var(--gray2)', borderRadius: 8, padding: '9px 12px', fontSize: 14, outline: 'none' }} />
          <span style={{ fontSize: 13, color: 'var(--text2)', whiteSpace: 'nowrap' }}>만원</span>
          <button onClick={saveBudget} style={{ background: 'var(--pk)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>저장</button>
        </div>
      </div>

      {/* 버튼 행 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button onClick={exportExcel}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#fff', border: '1.5px solid #22a55a', borderRadius: 10, padding: '10px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#22a55a' }}>
          📊 엑셀로 다운받기
        </button>
        {calcType === 'wedding' && (
          <button onClick={() => setShowStylePicker(true)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#fff', border: '1.5px solid var(--pk)', borderRadius: 10, padding: '10px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: 'var(--pk)' }}>
            💒 스타일 변경
          </button>
        )}
      </div>

      {/* Meal & Venue section (wedding only) */}
      {calcType === 'wedding' && (() => {
        const selectedVenue = VENUE_LIST.find(v => v.name === calc.venueHall) ?? null
        const selectedHall = selectedVenue?.halls.find(h => h.name === calc.venueRoom) ?? null
        return (
          <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', marginBottom: 14, boxShadow: '0 2px 12px rgba(255,107,157,.08)', border: '1.5px solid var(--pk4)' }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>식사 및 대관료</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

              {/* 1. 하객 인원 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, minWidth: 64, color: 'var(--text2)' }}>하객 인원</span>
                <input
                  type='number'
                  value={calc.mealCount}
                  onChange={e => updateCalc({ ...calc, mealCount: Number(e.target.value) || 0 })}
                  style={{ width: 80, border: '1.5px solid var(--gray2)', borderRadius: 8, padding: '7px 10px', fontSize: 13, textAlign: 'right', outline: 'none' }}
                />
                <span style={{ fontSize: 13, color: 'var(--text2)' }}>명</span>
              </div>

              {/* 2. 1인 식대 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, minWidth: 64, color: 'var(--text2)' }}>1인 식대</span>
                <select
                  value={calc.mealPrice}
                  onChange={e => {
                    const v = Number(e.target.value)
                    updateCalc({ ...calc, mealPrice: v, mealCustom: v === 0 ? calc.mealCustom : 0 })
                  }}
                  style={{ flex: 1, border: '1.5px solid var(--gray2)', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none', background: '#fff' }}
                >
                  {MEAL_PRICE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                  <option value={0}>직접 입력</option>
                </select>
              </div>
              {calc.mealPrice === 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, minWidth: 64, color: 'var(--text2)' }}>직접 입력</span>
                  <input
                    type='number'
                    value={calc.mealCustom || ''}
                    onChange={e => updateCalc({ ...calc, mealCustom: Number(e.target.value) || 0 })}
                    placeholder='예: 120000'
                    style={{ flex: 1, border: '1.5px solid var(--pk)', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none' }}
                  />
                  <span style={{ fontSize: 13, color: 'var(--text2)', whiteSpace: 'nowrap' }}>원/인</span>
                </div>
              )}

              {/* 3. 예식장 선택 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, minWidth: 64, color: 'var(--text2)' }}>예식장</span>
                <select
                  value={calc.venueHall}
                  onChange={e => {
                    const venueName = e.target.value
                    updateCalc({ ...calc, venueHall: venueName, venueRoom: '', venueDirect: 0 })
                  }}
                  style={{ flex: 1, border: '1.5px solid var(--gray2)', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none', background: '#fff' }}
                >
                  <option value=''>예식장 선택 (선택사항)</option>
                  {VENUE_LIST.map(v => (
                    <option key={v.name} value={v.name}>{v.name}</option>
                  ))}
                </select>
              </div>

              {/* 4. 홀 선택 */}
              {selectedVenue && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, minWidth: 64, color: 'var(--text2)' }}>홀 선택</span>
                  <select
                    value={calc.venueRoom}
                    onChange={e => {
                      const hallName = e.target.value
                      const hall = selectedVenue.halls.find(h => h.name === hallName)
                      updateCalc({ ...calc, venueRoom: hallName, venueDirect: hall ? hall.price : 0 })
                    }}
                    style={{ flex: 1, border: '1.5px solid var(--gray2)', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none', background: '#fff' }}
                  >
                    <option value=''>홀 선택</option>
                    {selectedVenue.halls.map(h => (
                      <option key={h.name} value={h.name}>{fmtHallLabel(h)}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* 5. 대관료 직접 입력 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, minWidth: 64, color: 'var(--text2)' }}>대관료</span>
                <input
                  type='number'
                  value={calc.venueDirect || ''}
                  onChange={e => updateCalc({ ...calc, venueDirect: Number(e.target.value) || 0 })}
                  placeholder={selectedHall ? (selectedHall.price === 0 ? '별도 문의' : String(selectedHall.price)) : '0'}
                  style={{ flex: 1, border: '1.5px solid var(--gray2)', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none' }}
                />
                <span style={{ fontSize: 13, color: 'var(--text2)' }}>만원</span>
              </div>
              {selectedHall && (
                <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: -4 }}>
                  선택 홀 기준: {fmtVenuePrice(selectedHall.price)}
                  {selectedHall.price > 0 && ' (직접 입력 시 해당 값 적용)'}
                </div>
              )}

              {/* 6. 소계 */}
              <div style={{ fontSize: 12, color: 'var(--pk)', fontWeight: 700, marginTop: 4, paddingTop: 8, borderTop: '1px solid var(--gray1)' }}>
                소계: {fmt(mealTotal + (calc.venueDirect || 0))}
                <span style={{ color: 'var(--text2)', fontWeight: 400, marginLeft: 8 }}>
                  (식대 {fmt(mealTotal)} + 대관료 {fmt(calc.venueDirect || 0)})
                  {calc.mealPrice === 0 && calc.mealCustom > 0 && (
                    <span style={{ marginLeft: 4 }}>· {(calc.mealCustom / 10000).toFixed(1)}만원/인 × {calc.mealCount}명</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Categories */}
      {Object.entries(calc.cats).map(([catKey, cat]) => {
        const label = catLabels[catKey] || catKey
        const isOpen = collapsed[catKey] !== true
        const catTotal = [
          ...cat.defItems.filter(it => it.checked && !it.deleted).map(it => it.customVal ? Number(it.customVal) || 0 : it.avg),
          ...cat.customItems.filter(it => it.checked).map(it => it.price),
        ].reduce((a, b) => a + b, 0)
        const isWeddingCat = calcType === 'wedding'

        return (
          <div key={catKey} style={{ background: '#fff', borderRadius: 14, marginBottom: 10, boxShadow: '0 4px 20px rgba(255,107,157,.08)', overflow: 'hidden', border: '1.5px solid var(--pk4)' }}>
            <div onClick={() => { setCollapsed(p => ({ ...p, [catKey]: !p[catKey] })); AnalyticsService.track(`calc:${calcType}:${catKey}`) }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', cursor: 'pointer', userSelect: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 800 }}>{label}</span>
                <span style={{ fontSize: 12, color: 'var(--pk)', fontWeight: 700 }}>{fmt(catTotal)}</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text2)', display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'none', transition: '.2s' }}>▼</span>
            </div>

            {isOpen && (
              <div style={{ padding: '0 12px 12px' }}>
                {cat.defItems.filter(it => !it.deleted).map(it => (
                  <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 4px', borderBottom: '1px solid var(--gray1)' }}>
                    {/* 체크박스 */}
                    <input type='checkbox' checked={it.checked} onChange={() => toggleDef(catKey, it.id)}
                      style={{ width: 17, height: 17, accentColor: 'var(--pk)', cursor: 'pointer', flexShrink: 0 }} />

                    {/* 필수/선택 뱃지 (wedding만) */}
                    {isWeddingCat && it.required !== undefined && (
                      <span style={{ fontSize: 11, flexShrink: 0, color: it.required ? 'var(--pk)' : '#bbb', lineHeight: 1 }}>
                        {it.required ? '★' : '☆'}
                      </span>
                    )}

                    {/* 항목명 + 준비시점 */}
                    <span style={{ flex: 1, fontSize: 12, color: it.checked ? 'var(--text)' : 'var(--text2)', lineHeight: 1.4 }}>
                      {it.name}
                      {isWeddingCat && it.prepStage && (
                        <span style={{ color: 'var(--text2)', fontSize: 11 }}> ({it.prepStage})</span>
                      )}
                    </span>

                    {/* ⓘ 설명 버튼 (wedding만) */}
                    {isWeddingCat && (
                      <button
                        onClick={e => { e.stopPropagation(); openInfo(catKey, it) }}
                        title='항목 설명 보기'
                        style={{
                          flexShrink: 0, width: 20, height: 20, borderRadius: '50%',
                          border: '1.5px solid #c5d0f0', background: '#eef2ff',
                          color: '#5570c6', fontSize: 11, fontWeight: 900,
                          cursor: 'pointer', padding: 0, lineHeight: '17px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >i</button>
                    )}

                    {/* 금액 입력 */}
                    <input
                      type='number'
                      value={it.customVal !== '' ? it.customVal : it.avg}
                      onChange={e => setDefAmt(catKey, it.id, e.target.value)}
                      style={{ width: 56, border: '1.5px solid var(--gray2)', borderRadius: 6, padding: '4px 6px', fontSize: 12, textAlign: 'right', opacity: it.checked ? 1 : 0.45, outline: 'none', flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 11, color: 'var(--text2)', minWidth: 22, flexShrink: 0 }}>만원</span>
                    <button onClick={() => deleteDefItem(catKey, it.id)} title='행 삭제'
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: 14, padding: '2px', flexShrink: 0, lineHeight: 1 }}>✕</button>
                  </div>
                ))}

                {cat.customItems.map(it => (
                  <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 4px', borderBottom: '1px solid var(--gray1)' }}>
                    <input type='checkbox' checked={it.checked} onChange={() => toggleCustom(catKey, it.id)}
                      style={{ width: 17, height: 17, accentColor: 'var(--pk)', cursor: 'pointer', flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 12 }}>{it.name}</span>
                    <input
                      type='number'
                      value={it.price}
                      onChange={e => setCustomAmt(catKey, it.id, e.target.value)}
                      style={{ width: 56, border: '1.5px solid var(--gray2)', borderRadius: 6, padding: '4px 6px', fontSize: 12, textAlign: 'right', outline: 'none', flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 11, color: 'var(--text2)', minWidth: 22, flexShrink: 0 }}>만원</span>
                    <button onClick={() => delCustom(catKey, it.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pk3)', fontSize: 14, padding: '2px', flexShrink: 0 }}>🗑️</button>
                  </div>
                ))}

                <div style={{ display: 'flex', gap: 8, marginTop: 10, paddingLeft: 4 }}>
                  <input
                    style={{ flex: 1, border: '1.5px solid var(--gray2)', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none', background: 'var(--pk5)' }}
                    placeholder='항목 추가...'
                    value={addInputs[catKey] || ''}
                    onChange={e => setAddInputs(p => ({ ...p, [catKey]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && addCustom(catKey)}
                  />
                  <button onClick={() => addCustom(catKey)}
                    style={{ background: 'var(--pk)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>추가</button>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* 배너 광고 — 페이지 최하단 */}
      <BannerAd />
    </div>
  )
}
