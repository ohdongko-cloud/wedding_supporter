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

// ── 스타일별 신혼여행 초기값 (4박5일 기준) ────────────────────────
// simple=국내/제주 4박5일, basic=동남아(발리·다낭 등) 4박5일, luxury=하와이/유럽 4박5일
const STYLE_HONEYMOON: Record<WeddingStyle, { budget: number; vals: Record<string, string>; chk: Record<string, boolean> }> = {
  simple: {
    // 국내/제주 4박5일 · 합계 약 200만원
    budget: 200,
    vals: {
      h_flight: '40', h_airtax: '0',  h_transfer: '3',  // 국내선·공항세 없음
      h_hotel: '55',  h_upgrade: '0',                    // 3~4성급 호텔/펜션 4박
      h_breakfast: '0',  h_lunch: '12', h_dinner: '18', h_snack: '8',  // 조식 포함 없음
      h_trans: '15',  h_sim: '0',                        // 렌터카·국내 유심 불필요
      h_act: '20',    h_photo: '0',                      // 주요 액티비티·셀프 촬영
      h_shop: '15',   h_souvenir: '5',
      h_ins: '3',
      h_visa: '0',    h_tip: '0',    h_etc: '5',
    },
    chk: {
      h_flight: true, h_airtax: false, h_transfer: true,
      h_hotel: true,  h_upgrade: false,
      h_breakfast: false, h_lunch: true, h_dinner: true, h_snack: true,
      h_trans: true,  h_sim: false,
      h_act: true,    h_photo: false,
      h_shop: true,   h_souvenir: true,
      h_ins: true,
      h_visa: false,  h_tip: false,  h_etc: true,
    },
  },
  basic: {
    // 동남아(발리·다낭·방콕 등) 4박5일 · 합계 약 450만원
    budget: 450,
    vals: {
      h_flight: '100', h_airtax: '12', h_transfer: '7',  // 이코노미 왕복
      h_hotel: '120',  h_upgrade: '0',                    // 5성급 리조트 4박
      h_breakfast: '0', h_lunch: '18', h_dinner: '30', h_snack: '8', // 조식 리조트 포함
      h_trans: '15',   h_sim: '3',
      h_act: '35',     h_photo: '25',                     // 현지 스냅 촬영 포함
      h_shop: '40',    h_souvenir: '8',
      h_ins: '10',
      h_visa: '0',     h_tip: '5',    h_etc: '8',
    },
    chk: {
      h_flight: true, h_airtax: true, h_transfer: true,
      h_hotel: true,  h_upgrade: false,
      h_breakfast: false, h_lunch: true, h_dinner: true, h_snack: true,
      h_trans: true,  h_sim: true,
      h_act: true,    h_photo: true,
      h_shop: true,   h_souvenir: true,
      h_ins: true,
      h_visa: false,  h_tip: true,   h_etc: true,
    },
  },
  luxury: {
    // 하와이/유럽 4박5일 · 합계 약 1000만원
    budget: 1000,
    vals: {
      h_flight: '180', h_airtax: '25', h_transfer: '12',  // 비즈니스·장거리
      h_hotel: '250',  h_upgrade: '40',                    // 럭셔리 리조트 4박 + 업그레이드
      h_breakfast: '20', h_lunch: '40', h_dinner: '70', h_snack: '15', // 풀 식비
      h_trans: '35',   h_sim: '5',
      h_act: '80',     h_photo: '50',                      // 프리미엄 액티비티·스냅
      h_shop: '120',   h_souvenir: '15',
      h_ins: '15',
      h_visa: '5',     h_tip: '10',   h_etc: '15',
    },
    chk: {
      h_flight: true, h_airtax: true, h_transfer: true,
      h_hotel: true,  h_upgrade: true,
      h_breakfast: true, h_lunch: true, h_dinner: true, h_snack: true,
      h_trans: true,  h_sim: true,
      h_act: true,    h_photo: true,
      h_shop: true,   h_souvenir: true,
      h_ins: true,
      h_visa: true,   h_tip: true,   h_etc: true,
    },
  },
}

// ── 스타일별 신혼집 초기값 ────────────────────────────────────────
// simple=월세(보증금 5000万), basic=전세(2억), luxury=매매(3.5억)
const STYLE_HOUSE: Record<WeddingStyle, { budget: number; vals: Record<string, string>; chk: Record<string, boolean> }> = {
  simple: {
    budget: 6000,
    vals: { ho_dep: '5000', ho_loan: '0',   ho_agent: '50',  ho_move: '100', ho_fridge: '80',  ho_washer: '60', ho_tv: '60',  ho_ac: '60',  ho_bed: '80',  ho_sofa: '60', ho_table: '30', ho_desk: '20', ho_int: '0',  ho_sup: '30', ho_etc: '0' },
    chk:  { ho_dep: true,   ho_loan: false,  ho_agent: true,  ho_move: true,  ho_fridge: true,  ho_washer: true, ho_tv: true,  ho_ac: true,  ho_bed: true,  ho_sofa: true, ho_table: true, ho_desk: true, ho_int: false, ho_sup: true, ho_etc: false },
  },
  basic: {
    budget: 22000,
    vals: { ho_dep: '20000', ho_loan: '50',  ho_agent: '100', ho_move: '150', ho_fridge: '120', ho_washer: '80', ho_tv: '80',  ho_ac: '80',  ho_bed: '120', ho_sofa: '80', ho_table: '40', ho_desk: '30', ho_int: '300', ho_sup: '50', ho_etc: '0' },
    chk:  { ho_dep: true,    ho_loan: true,  ho_agent: true,  ho_move: true,  ho_fridge: true,  ho_washer: true, ho_tv: true,  ho_ac: true,  ho_bed: true,  ho_sofa: true, ho_table: true, ho_desk: true, ho_int: true,  ho_sup: true, ho_etc: false },
  },
  luxury: {
    budget: 40000,
    vals: { ho_dep: '35000', ho_loan: '500', ho_agent: '200', ho_move: '200', ho_fridge: '200', ho_washer: '120', ho_tv: '150', ho_ac: '150', ho_bed: '200', ho_sofa: '150', ho_table: '80', ho_desk: '60', ho_int: '1000', ho_sup: '80', ho_etc: '30' },
    chk:  { ho_dep: true,    ho_loan: true,  ho_agent: true,  ho_move: true,  ho_fridge: true,  ho_washer: true, ho_tv: true,  ho_ac: true,  ho_bed: true,  ho_sofa: true,  ho_table: true, ho_desk: true, ho_int: true,   ho_sup: true, ho_etc: true },
  },
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
  const locationState = (location.state as any) ?? {}
  const [showStylePicker, setShowStylePicker] = useState(
    calcType === 'wedding' && !!locationState?.fromOnboarding && !locationState?.weddingStyle
  )
  const [infoPopup, setInfoPopup] = useState<InfoPopupData | null>(null)
  // 신혼여행·신혼집 유형 선택 상태
  const [honeymoonStyle, setHoneymoonStyle] = useState<WeddingStyle | null>(null)
  const [houseStyle, setHouseStyle]         = useState<WeddingStyle | null>(null)

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
      // 온보딩에서 스타일을 선택하고 온 경우: 씨딩 완료된 cats에 스타일 직접 적용
      if (calcType === 'wedding' && locationState?.fromOnboarding && locationState?.weddingStyle) {
        const style = locationState.weddingStyle as WeddingStyle
        const meal = STYLE_MEAL[style]
        const styledCats = { ...newCats }
        Object.entries(styledCats).forEach(([catKey, cat]) => {
          styledCats[catKey] = {
            ...cat,
            defItems: cat.defItems.map(it => {
              const seed = getWeddingSeed(catKey, it.id)
              if (!seed) return it
              if (style === 'simple') return seed[4] !== null ? { ...it, checked: true, customVal: String(seed[4]) } : { ...it, checked: false, customVal: '' }
              if (style === 'basic') return { ...it, checked: true, customVal: String(seed[5]) }
              return { ...it, checked: true, customVal: String(seed[6]) }
            }),
          }
        })
        const styledWedding = computeTotal({ ...calc, cats: styledCats, mealCount: meal.count, mealPrice: meal.price, venueDirect: STYLE_VENUE[style] })
        // 신혼여행·신혼집 동시 세팅
        const hp = STYLE_HONEYMOON[style]; const hop = STYLE_HOUSE[style]
        const buildPresetCats = (presetSeeds: Record<string, any[][]>, vals: Record<string, string>, chk: Record<string, boolean>) => {
          const cats: typeof userData.calcHoneymoon.cats = {}
          Object.entries(presetSeeds).forEach(([ck, items]) => {
            cats[ck] = { customItems: [], defItems: items.map(s => ({ id: s[0], name: s[1], avg: s[2], deleted: false, customVal: vals[s[0]] ?? '', checked: chk[s[0]] !== false })) }
          })
          return cats
        }
        const hCats   = buildPresetCats(CALC_SEEDS.honeymoon, hp.vals, hp.chk)
        const houCats = buildPresetCats(CALC_SEEDS.house, hop.vals, hop.chk)
        const newHoneymoon = computeTotal({ ...userData.calcHoneymoon, budget: hp.budget, cats: hCats }, 'honeymoon')
        const newHouse     = computeTotal({ ...userData.calcHouse,     budget: hop.budget, cats: houCats }, 'house')
        setUserData({ ...userData, calcWedding: styledWedding, calcHoneymoon: newHoneymoon, calcHouse: newHouse })
        setShowStylePicker(false)
      } else {
        const recomputed = computeTotal({ ...calc, cats: newCats }, calcType)
        setUserData({ ...userData, [calcKey]: recomputed })
      }
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
            if (seed[4] !== null) return { ...it, checked: true, customVal: String(seed[4]) }
            else return { ...it, checked: false, customVal: '' }
          } else if (style === 'basic') {
            return { ...it, checked: true, customVal: String(seed[5]) }
          } else {
            return { ...it, checked: true, customVal: String(seed[6]) }
          }
        }),
      }
    })

    const newWedding = computeTotal({
      ...calc, cats: newCats,
      mealCount: meal.count, mealPrice: meal.price, venueDirect: STYLE_VENUE[style],
    })

    // 온보딩에서 왔을 때: 신혼여행·신혼집 초기값도 함께 설정
    const isFromOnboarding = !!locationState?.fromOnboarding
    if (isFromOnboarding) {
      const hp  = STYLE_HONEYMOON[style]
      const hop = STYLE_HOUSE[style]

      const buildCats = (seeds: Record<string, any[][]>, vals: Record<string, string>, chk: Record<string, boolean>) => {
        const cats: typeof userData.calcHoneymoon.cats = {}
        Object.entries(seeds).forEach(([catKey, items]) => {
          cats[catKey] = {
            customItems: [],
            defItems: items.map(s => ({
              id: s[0], name: s[1], avg: s[2], deleted: false,
              customVal: vals[s[0]] ?? '', checked: chk[s[0]] !== false,
            })),
          }
        })
        return cats
      }

      const hCats   = buildCats(CALC_SEEDS.honeymoon, hp.vals,  hp.chk)
      const houCats = buildCats(CALC_SEEDS.house,     hop.vals, hop.chk)
      const newHoneymoon = computeTotal({ ...userData.calcHoneymoon, budget: hp.budget,  cats: hCats   }, 'honeymoon')
      const newHouse     = computeTotal({ ...userData.calcHouse,     budget: hop.budget, cats: houCats }, 'house')

      setUserData({ ...userData, calcWedding: newWedding, calcHoneymoon: newHoneymoon, calcHouse: newHouse })
      saveUserData()
    } else {
      updateCalc(newWedding)
    }
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

  function saveBudget() {
    const b = Number(budgetInput.replace(/,/g, '')) || 0
    updateCalc({ ...calc, budget: b })
  }

  // ── 신혼여행 유형 프리셋 적용 ────────────────────────────────────
  function applyHoneymoonPreset(style: WeddingStyle) {
    const hp = STYLE_HONEYMOON[style]
    const seeds = CALC_SEEDS.honeymoon
    const newCats: typeof calc.cats = {}
    Object.entries(seeds).forEach(([catKey, items]) => {
      newCats[catKey] = {
        customItems: calc.cats[catKey]?.customItems ?? [],
        defItems: (items as any[]).map(s => ({
          id: s[0], name: s[1], avg: s[2], deleted: false,
          customVal: hp.vals[s[0]] ?? '', checked: hp.chk[s[0]] !== false,
        })),
      }
    })
    setHoneymoonStyle(style)
    setBudgetInput(String(hp.budget))
    updateCalc({ ...calc, budget: hp.budget, cats: newCats })
  }

  // ── 신혼집 거주형태 프리셋 적용 ──────────────────────────────────
  function applyHousePreset(style: WeddingStyle) {
    const hop = STYLE_HOUSE[style]
    const seeds = CALC_SEEDS.house
    const newCats: typeof calc.cats = {}
    Object.entries(seeds).forEach(([catKey, items]) => {
      newCats[catKey] = {
        customItems: calc.cats[catKey]?.customItems ?? [],
        defItems: (items as any[]).map(s => ({
          id: s[0], name: s[1], avg: s[2], deleted: false,
          customVal: hop.vals[s[0]] ?? '', checked: hop.chk[s[0]] !== false,
        })),
      }
    })
    setHouseStyle(style)
    setBudgetInput(String(hop.budget))
    updateCalc({ ...calc, budget: hop.budget, cats: newCats })
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

  // ── 신혼집 입주자금/부대비용 분리 계산 ───────────────────────────
  const depositItem = calcType === 'house'
    ? calc.cats['deposit']?.defItems.find(it => it.id === 'ho_dep')
    : undefined
  const depositVal = depositItem?.checked
    ? (depositItem.customVal ? Number(depositItem.customVal) || 0 : depositItem.avg)
    : 0
  const ancillaryCost = calc.totalCost - depositVal

  // ── 신혼여행·신혼집 유형 라벨 ────────────────────────────────────
  const HONEYMOON_TYPE_OPTIONS: { key: WeddingStyle; emoji: string; label: string; budget: string }[] = [
    { key: 'simple',  emoji: '🏝️', label: '국내·제주',    budget: '약 200만' },
    { key: 'basic',   emoji: '🌴', label: '동남아',        budget: '약 450만' },
    { key: 'luxury',  emoji: '🗼', label: '하와이·유럽',   budget: '약 1000만' },
  ]
  const HOUSE_TYPE_OPTIONS: { key: WeddingStyle; emoji: string; label: string; budget: string; color: string }[] = [
    { key: 'simple',  emoji: '🏠', label: '월세',  budget: '약 6,000만',  color: '#f97316' },
    { key: 'basic',   emoji: '🔑', label: '전세',  budget: '약 2.2억',    color: '#3b82f6' },
    { key: 'luxury',  emoji: '🏡', label: '매매',  budget: '약 4억',      color: '#22c55e' },
  ]
  const activeHouseOpt = HOUSE_TYPE_OPTIONS.find(o => o.key === houseStyle)

  // 카테고리별 이모지
  const CAT_EMOJI: Record<string, string> = {
    wedding: '💐', studio: '📷', dress: '👗', makeup: '💄',
    sdm_common: '💍', gifts: '🎁',
    flight: '✈️', accommodation: '🏨', food: '🍽️', transport: '🚗',
    activity: '🎡', shopping: '🛍️', insurance: '🛡️',
    deposit: '🏠', loan: '🏦', agent: '🤝', moving: '📦',
    appliance: '📺', furniture: '🛋️', interior: '🎨', supplies: '🧹',
    etc: '📋',
  }

  const CALC_TITLE: Record<string, string> = {
    wedding: '💍 결혼비용',
    house: '🏠 신혼집',
    honeymoon: '✈️신혼여행',
  }

  return (
    <div>
      {showStylePicker && calcType === 'wedding' && (
        <WeddingStylePicker onSelect={applyStyle} onSkip={() => setShowStylePicker(false)} />
      )}
      {infoPopup && <InfoPopup data={infoPopup} onClose={() => setInfoPopup(null)} />}

      {/* ── 신혼여행 유형 선택기 ── */}
      {calcType === 'honeymoon' && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text2)', marginBottom: 6 }}>여행 유형 선택 (4박5일 기준)</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {HONEYMOON_TYPE_OPTIONS.map(({ key, emoji, label, budget }) => {
              const active = honeymoonStyle === key
              return (
                <button key={key} onClick={() => applyHoneymoonPreset(key)} style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  padding: '9px 4px', borderRadius: 12, cursor: 'pointer',
                  border: `2px solid ${active ? 'var(--pk)' : 'var(--gray2)'}`,
                  background: active ? 'var(--pk5)' : '#fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,.06)', transition: 'all .15s',
                }}>
                  <span style={{ fontSize: 18 }}>{emoji}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: active ? 'var(--pk)' : 'var(--text)' }}>{label}</span>
                  <span style={{ fontSize: 9, color: 'var(--text2)' }}>{budget}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── 신혼집 거주형태 선택기 ── */}
      {calcType === 'house' && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text2)', marginBottom: 6 }}>거주 형태 선택</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {HOUSE_TYPE_OPTIONS.map(({ key, emoji, label, budget, color }) => {
              const active = houseStyle === key
              return (
                <button key={key} onClick={() => applyHousePreset(key)} style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  padding: '9px 4px', borderRadius: 12, cursor: 'pointer',
                  border: `2px solid ${active ? color : 'var(--gray2)'}`,
                  background: active ? `${color}12` : '#fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,.06)', transition: 'all .15s',
                }}>
                  <span style={{ fontSize: 18 }}>{emoji}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: active ? color : 'var(--text)' }}>{label}</span>
                  <span style={{ fontSize: 9, color: 'var(--text2)' }}>{budget}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── 통합 히어로 카드 ── */}
      <div style={{ background: 'linear-gradient(135deg,var(--pk),var(--mn))', borderRadius: 14, padding: '16px', color: '#fff', marginBottom: 12 }}>

        {/* 신혼집: 거주형태 배지 + 입주자금/부대비용 2분할 */}
        {calcType === 'house' && activeHouseOpt && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ background: 'rgba(255,255,255,.22)', border: '1px solid rgba(255,255,255,.4)', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 800 }}>
                {activeHouseOpt.emoji} {activeHouseOpt.label}
              </span>
            </div>
            {depositVal > 0 && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <div style={{ flex: 1, background: 'rgba(255,255,255,.18)', borderRadius: 10, padding: '8px 10px' }}>
                  <div style={{ fontSize: 9, opacity: .82, marginBottom: 3 }}>🏠 입주 자금</div>
                  <div style={{ fontSize: 15, fontWeight: 900 }}>{fmt(depositVal)}</div>
                  <div style={{ fontSize: 8, opacity: .7, marginTop: 1 }}>보증금·전세금</div>
                </div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,.18)', borderRadius: 10, padding: '8px 10px' }}>
                  <div style={{ fontSize: 9, opacity: .82, marginBottom: 3 }}>📦 부대 비용</div>
                  <div style={{ fontSize: 15, fontWeight: 900 }}>{fmt(ancillaryCost)}</div>
                  <div style={{ fontSize: 8, opacity: .7, marginTop: 1 }}>이사+가전+가구 등</div>
                </div>
              </div>
            )}
          </>
        )}

        {/* 신혼여행: 여행지 배지 */}
        {calcType === 'honeymoon' && honeymoonStyle && (
          <div style={{ marginBottom: 6 }}>
            <span style={{ background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.4)', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 800 }}>
              {HONEYMOON_TYPE_OPTIONS.find(o => o.key === honeymoonStyle)?.emoji}{' '}
              {HONEYMOON_TYPE_OPTIONS.find(o => o.key === honeymoonStyle)?.label} 4박5일
            </span>
          </div>
        )}

        {/* 예상 합계 + 잔여 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 11, opacity: .8, fontWeight: 600, marginBottom: 2 }}>{CALC_TITLE[calcType]} 예상 합계</div>
            <div style={{ fontSize: 'clamp(26px,8vw,32px)', fontWeight: 900, lineHeight: 1 }}>{fmt(calc.totalCost)}</div>
            {calc.budget > 0 && (
              <div style={{ fontSize: 11, opacity: .75, marginTop: 4 }}>목표 예산 {fmt(calc.budget)} 기준</div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, opacity: .8, marginBottom: 2 }}>예산 잔여</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: diff < 0 ? '#ffd0d0' : '#a8ffdf' }}>
              {calc.budget > 0 ? (diff >= 0 ? fmt(diff) : `-${fmt(Math.abs(diff))}`) : '-'}
            </div>
          </div>
        </div>

        {/* 예산 사용률 바 */}
        {calc.budget > 0 && (
          <div style={{ height: 6, background: 'rgba(255,255,255,.25)', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
            <div style={{ height: '100%', width: `${usedPct}%`, background: usedPct > 100 ? '#ff6b6b' : '#fff', borderRadius: 3, transition: 'width .5s' }} />
          </div>
        )}

        {/* 카테고리 세부 합계 (최대 4개) */}
        {(() => {
          const cats = Object.entries(calc.cats).slice(0, 4).map(([k, cat]) => {
            const total = [
              ...cat.defItems.filter(it => it.checked && !it.deleted).map(it => it.customVal ? Number(it.customVal) || 0 : it.avg),
              ...cat.customItems.filter(it => it.checked).map(it => it.price),
            ].reduce((a, b) => a + b, 0)
            return { key: k, label: catLabels[k] || k, total }
          }).filter(c => c.total > 0)
          const mealVenueTotal = mealTotal + (calc.venueDirect || 0)
          const allCats = calcType === 'wedding'
            ? [{ key: 'meal', label: '식사·대관료', total: mealVenueTotal }, ...cats]
            : cats
          return allCats.slice(0, 4).length > 0 ? (
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {allCats.slice(0, 4).map(c => (
                <div key={c.key} style={{ flex: 1, background: 'rgba(255,255,255,.15)', borderRadius: 8, padding: '6px 4px', textAlign: 'center', minWidth: 0 }}>
                  <div style={{ fontSize: 9, opacity: .8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.label}</div>
                  <div style={{ fontSize: 12, fontWeight: 800, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fmt(c.total)}</div>
                </div>
              ))}
            </div>
          ) : null
        })()}

        {/* 목표 예산 입력 (카드 내 통합) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.15)', borderRadius: 9, padding: '7px 12px' }}>
          <span style={{ fontSize: 11, opacity: .85, whiteSpace: 'nowrap', flexShrink: 0 }}>목표 예산</span>
          <input
            type='number'
            value={budgetInput}
            onChange={e => setBudgetInput(e.target.value)}
            onBlur={saveBudget}
            onKeyDown={e => e.key === 'Enter' && saveBudget()}
            placeholder='미설정'
            style={{ flex: 1, border: 'none', background: 'transparent', color: '#fff', fontSize: 14, fontWeight: 700, outline: 'none', textAlign: 'right', minWidth: 0 }}
          />
          <span style={{ fontSize: 11, opacity: .7, flexShrink: 0 }}>만원</span>
          <button
            onClick={saveBudget}
            style={{ background: 'rgba(255,255,255,.25)', border: '1px solid rgba(255,255,255,.5)', color: '#fff', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >저장</button>
        </div>
      </div>

      {/* ── 액션 버튼 (소형, 우측 정렬) ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginBottom: 12 }}>
        <button
          onClick={exportExcel}
          style={{ background: '#fff', border: '1.5px solid #22a55a', color: '#22a55a', borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          📊 엑셀 다운로드
        </button>
        {calcType === 'wedding' && (
          <button
            onClick={() => setShowStylePicker(true)}
            style={{ background: '#fff', border: '1.5px solid var(--pk)', color: 'var(--pk)', borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            🎨 빠른 예산 설정
          </button>
        )}
        {calcType === 'honeymoon' && (
          <button
            onClick={() => { setHoneymoonStyle(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            style={{ background: '#fff', border: '1.5px solid var(--pk)', color: 'var(--pk)', borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            🌍 유형 초기화
          </button>
        )}
        {calcType === 'house' && (
          <button
            onClick={() => { setHouseStyle(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            style={{ background: '#fff', border: '1.5px solid #3b82f6', color: '#3b82f6', borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            🏠 형태 초기화
          </button>
        )}
      </div>

      {/* Meal & Venue section (wedding only) */}
      {calcType === 'wedding' && (() => {
        const selectedVenue = VENUE_LIST.find(v => v.name === calc.venueHall) ?? null
        const selectedHall = selectedVenue?.halls.find(h => h.name === calc.venueRoom) ?? null
        return (
          <div style={{ background: '#fff', borderRadius: 14, marginBottom: 10, boxShadow: '0 4px 20px rgba(255,107,157,.08)', overflow: 'hidden', border: '1.5px solid var(--pk4)' }}>
            {/* 식사/대관료 헤더 — 카테고리 카드와 동일 구조 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--pk5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>🍽️</span>
                <span style={{ fontSize: 14, fontWeight: 800 }}>식사 및 대관료</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--pk)' }}>{fmt(mealTotal + (calc.venueDirect || 0))}</span>
            </div>
            <div style={{ padding: '12px 16px' }}>
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

              {/* 소계 */}
              <div style={{ fontSize: 11, color: 'var(--pk)', fontWeight: 700, marginTop: 4, paddingTop: 8, borderTop: '1px solid var(--gray1)', textAlign: 'right' }}>
                식대 {fmt(mealTotal)} + 대관료 {fmt(calc.venueDirect || 0)} = {fmt(mealTotal + (calc.venueDirect || 0))}
                {calc.mealPrice === 0 && calc.mealCustom > 0 && (
                  <span style={{ color: 'var(--text2)', fontWeight: 400, marginLeft: 6 }}>· {(calc.mealCustom / 10000).toFixed(1)}만/인 × {calc.mealCount}명</span>
                )}
              </div>
            </div>
          </div>
          </div>
        )
      })()}

      {/* ── 카테고리 목록 ── */}
      {Object.entries(calc.cats).map(([catKey, cat]) => {
        const label = catLabels[catKey] || catKey
        const emoji = CAT_EMOJI[catKey] ?? '📋'
        const isOpen = collapsed[catKey] !== true
        const checkedCount = cat.defItems.filter(it => it.checked && !it.deleted).length + cat.customItems.filter(it => it.checked).length
        const totalCount   = cat.defItems.filter(it => !it.deleted).length + cat.customItems.length
        const catPct = totalCount > 0 ? Math.round(checkedCount / totalCount * 100) : 0
        const catTotal = [
          ...cat.defItems.filter(it => it.checked && !it.deleted).map(it => it.customVal ? Number(it.customVal) || 0 : it.avg),
          ...cat.customItems.filter(it => it.checked).map(it => it.price),
        ].reduce((a, b) => a + b, 0)
        const isWeddingCat = calcType === 'wedding'

        return (
          <div key={catKey} style={{ background: '#fff', borderRadius: 14, marginBottom: 10, boxShadow: '0 4px 20px rgba(255,107,157,.08)', overflow: 'hidden', border: '1.5px solid var(--pk4)' }}>
            {/* 카테고리 헤더 */}
            <div
              onClick={() => { setCollapsed(p => ({ ...p, [catKey]: !p[catKey] })); AnalyticsService.track(`calc:${calcType}:${catKey}`) }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>{emoji}</span>
                <span style={{ fontSize: 14, fontWeight: 800 }}>{label}</span>
                <span style={{ background: 'var(--pk5)', color: 'var(--pk)', borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>
                  {checkedCount}/{totalCount}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--pk)' }}>{fmt(catTotal)}</span>
                <span style={{ fontSize: 11, color: 'var(--text2)', display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'none', transition: '.2s' }}>▼</span>
              </div>
            </div>

            {/* 진행 바 */}
            <div style={{ height: 3, background: 'var(--pk4)', margin: '0 16px', borderRadius: 2, marginBottom: isOpen ? 8 : 12 }}>
              <div style={{ height: '100%', width: `${catPct}%`, background: 'linear-gradient(90deg,var(--pk),var(--mn))', borderRadius: 2, transition: 'width .4s' }} />
            </div>

            {isOpen && (
              <>
                {cat.defItems.filter(it => !it.deleted).map(it => (
                  <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderTop: '1px solid var(--gray1)' }}>
                    {/* 체크박스 */}
                    <div
                      onClick={() => toggleDef(catKey, it.id)}
                      style={{
                        width: 19, height: 19, borderRadius: 5,
                        border: `2px solid ${it.checked ? 'var(--pk)' : 'var(--pk3)'}`,
                        background: it.checked ? 'var(--pk)' : '#fff',
                        flexShrink: 0, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {it.checked && <span style={{ color: '#fff', fontSize: 10, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                    </div>

                    {/* 항목명 */}
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: it.checked ? 'var(--text)' : 'var(--text2)', lineHeight: 1.4, textDecoration: it.checked ? 'none' : 'none' }}>
                      {it.name}
                    </span>

                    {/* ⓘ 버튼 (wedding만) */}
                    {isWeddingCat && (
                      <button
                        onClick={e => { e.stopPropagation(); openInfo(catKey, it) }}
                        style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--pk3)', padding: 0, lineHeight: 1 }}
                      >ⓘ</button>
                    )}

                    {/* 금액 칩 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                      <input
                        type='number'
                        value={it.customVal !== '' ? it.customVal : it.avg}
                        onChange={e => setDefAmt(catKey, it.id, e.target.value)}
                        style={{
                          width: 52, border: '1.5px solid var(--pk4)', borderRadius: 6,
                          padding: '3px 5px', fontSize: 12, textAlign: 'right',
                          background: it.checked ? 'var(--pk5)' : '#f9f9f9',
                          color: it.checked ? 'var(--pk)' : 'var(--gray3)',
                          fontWeight: 700, outline: 'none',
                        }}
                      />
                      <span style={{ fontSize: 10, color: 'var(--text2)' }}>만</span>
                    </div>
                  </div>
                ))}

                {cat.customItems.map(it => (
                  <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderTop: '1px solid var(--gray1)', background: '#fdfaff' }}>
                    <div
                      onClick={() => toggleCustom(catKey, it.id)}
                      style={{
                        width: 19, height: 19, borderRadius: 5,
                        border: `2px solid ${it.checked ? 'var(--mn)' : 'var(--pk3)'}`,
                        background: it.checked ? 'var(--mn)' : '#fff',
                        flexShrink: 0, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {it.checked && <span style={{ color: '#fff', fontSize: 10, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                    </div>
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{it.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                      <input
                        type='number'
                        value={it.price}
                        onChange={e => setCustomAmt(catKey, it.id, e.target.value)}
                        style={{ width: 52, border: '1.5px solid var(--pk4)', borderRadius: 6, padding: '3px 5px', fontSize: 12, textAlign: 'right', background: 'var(--pk5)', color: 'var(--pk)', fontWeight: 700, outline: 'none' }}
                      />
                      <span style={{ fontSize: 10, color: 'var(--text2)' }}>만</span>
                    </div>
                    <button
                      onClick={() => delCustom(catKey, it.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pk3)', fontSize: 14, padding: 0, flexShrink: 0 }}
                    >🗑</button>
                  </div>
                ))}

                {/* 항목 추가 */}
                <div style={{ display: 'flex', gap: 8, padding: '10px 14px', background: 'var(--pk5)', borderTop: '1px solid var(--pk4)' }}>
                  <input
                    style={{ flex: 1, border: '1.5px solid var(--pk4)', borderRadius: 8, padding: '7px 10px', fontSize: 12, outline: 'none', background: '#fff', color: 'var(--text)' }}
                    placeholder='항목 추가...'
                    value={addInputs[catKey] || ''}
                    onChange={e => setAddInputs(p => ({ ...p, [catKey]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && addCustom(catKey)}
                  />
                  <button
                    onClick={() => addCustom(catKey)}
                    style={{ background: 'var(--pk)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >+ 추가</button>
                </div>
              </>
            )}
          </div>
        )
      })}

      {/* 배너 광고 — 페이지 최하단 */}
      <BannerAd />
    </div>
  )
}
