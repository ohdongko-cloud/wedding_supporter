import { useState, useEffect, useRef } from 'react'
import * as XLSX from 'xlsx'
import { useAuthStore } from '../stores/authStore'
import type {
  HoneymoonPlanState, HoneymoonDay, HoneymoonScheduleItem,
  HoneymoonCategory, HoneymoonBookingItem,
} from '../types'
import NativeAdCard from '../components/ads/NativeAdCard'

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36) }
function fmt(n: number) { return n.toLocaleString('ko-KR') }

// ── 카테고리 키워드 자동 분류 ─────────────────────────────────────────────────
function autoCategory(title: string): HoneymoonCategory {
  const t = title.toLowerCase()
  if (/항공|비행|티켓|flight|airfare|유류|공항세/.test(t)) return 'flight'
  if (/호텔|숙소|리조트|민박|펜션|숙박|체크인|villa/.test(t)) return 'hotel'
  if (/식사|식당|맛집|점심|저녁|조식|lunch|dinner|breakfast|레스토랑|씨푸드|파인다이닝|카페|디저트/.test(t)) return 'food'
  if (/액티비티|서핑|다이빙|스쿠버|승마|atv|투어|헬기|요트|스파|마사지|수영/.test(t)) return 'activity'
  if (/스냅|촬영|사진|작가|포토/.test(t)) return 'snap'
  if (/쇼핑|기념품|선물|백화점|마트|잡화|화장품|명품/.test(t)) return 'shopping'
  return 'etc'
}

const CAT_META: Record<HoneymoonCategory, { label: string; emoji: string; color: string }> = {
  flight:   { label: '항공',     emoji: '✈️', color: '#4dabf7' },
  hotel:    { label: '숙박',     emoji: '🏨', color: '#c77dff' },
  food:     { label: '식비',     emoji: '🍽️', color: '#f59e0b' },
  activity: { label: '액티비티', emoji: '🏄', color: '#22c55e' },
  snap:     { label: '스냅촬영', emoji: '📸', color: '#ff6b9d' },
  shopping: { label: '쇼핑',     emoji: '🛍️', color: '#f97316' },
  etc:      { label: '기타',     emoji: '📦', color: '#94a3b8' },
}

// ── 기본 예약 체크리스트 ──────────────────────────────────────────────────────
const DEFAULT_BOOKING: HoneymoonBookingItem[] = [
  { id: 'b1', label: '✈️ 항공권 예약',       memo: '', done: false },
  { id: 'b2', label: '🏨 숙소 예약',         memo: '', done: false },
  { id: 'b3', label: '🛡️ 여행자 보험 가입', memo: '', done: false },
  { id: 'b4', label: '💱 환전',              memo: '', done: false },
  { id: 'b5', label: '📶 유심/포켓와이파이', memo: '', done: false },
  { id: 'b6', label: '📸 현지 스냅 작가 예약', memo: '', done: false },
]

function makeEmptyItem(): HoneymoonScheduleItem {
  return { id: uid(), time: '', reserved: false, title: '', detail: '', amount: 0, note: '' }
}

function makeDefaultPlan(): HoneymoonPlanState {
  return {
    budget: 0,
    days: [1, 2, 3].map(dayNumber => ({
      id: uid(), dayNumber, date: '', isOpen: dayNumber === 1,
      items: [makeEmptyItem(), makeEmptyItem(), makeEmptyItem()],
    })),
    destination: '',
    departureDate: '',
    returnDate: '',
    bookingChecklist: DEFAULT_BOOKING.map(b => ({ ...b })),
  }
}

// ── Popups ────────────────────────────────────────────────────────────────────
function GuestPopup({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: 290, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>💾</div>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>저장 불가</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 18 }}>게스트 모드에서는 데이터가<br />저장되지 않아요.<br />닉네임으로 로그인 후 이용해주세요.</div>
        <button onClick={onClose} style={{ width: '100%', background: 'var(--pk)', color: '#fff', border: 'none', borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>확인</button>
      </div>
    </div>
  )
}

function DeleteDayDialog({ dayNumber, onConfirm, onClose }: { dayNumber: number; onConfirm: () => void; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: 310, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>🗑️</div>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>DAY{dayNumber} 삭제</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 18 }}>DAY{dayNumber}을 삭제하시겠어요?<br />포함된 일정도 함께 삭제됩니다.</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, background: 'var(--gray1)', color: 'var(--text)', border: 'none', borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>취소</button>
          <button onClick={onConfirm} style={{ flex: 1, background: '#e03060', color: '#fff', border: 'none', borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>삭제</button>
        </div>
      </div>
    </div>
  )
}

// ── Schedule Row (Table view) ─────────────────────────────────────────────────
function ScheduleRow({ item, onUpdate, onDelete, isFirst }: {
  item: HoneymoonScheduleItem
  onUpdate: (field: keyof HoneymoonScheduleItem, value: string | boolean | number) => void
  onDelete: () => void
  isFirst?: boolean
}) {
  const [amountStr, setAmountStr] = useState(() => item.amount === 0 ? '' : String(item.amount * 10000))
  const isEditingAmount = useRef(false)

  useEffect(() => {
    if (!isEditingAmount.current) {
      setAmountStr(item.amount === 0 ? '' : String(item.amount * 10000))
    }
  }, [item.amount])

  function handleAmountBlur() {
    isEditingAmount.current = false
    const won = parseInt(amountStr) || 0
    const man = Math.round(won / 10000)
    onUpdate('amount', man)
    setAmountStr(man === 0 ? '' : String(man * 10000))
  }

  const ph = {
    time:   isFirst ? '11:00'            : '',
    title:  isFirst ? '일정명'            : '',
    detail: isFirst ? '장소, 예약번호 등' : '',
    amount: isFirst ? '3000000'          : '',
    note:   isFirst ? '메모'              : '',
  }

  const inp: React.CSSProperties = {
    width: '100%', border: '1px solid var(--gray2)', borderRadius: 6,
    padding: '5px 7px', fontSize: 12, outline: 'none',
    background: 'transparent', color: item.reserved ? 'var(--text2)' : 'var(--text)',
    boxSizing: 'border-box',
  }
  return (
    <tr style={{ background: item.reserved ? '#f0fff4' : 'transparent', borderBottom: '1px solid var(--gray1)' }}>
      <td style={{ padding: '5px 5px', verticalAlign: 'middle', minWidth: 72 }}>
        <input style={inp} value={item.time} onChange={e => onUpdate('time', e.target.value)} placeholder={ph.time} />
      </td>
      <td style={{ padding: '5px 5px', textAlign: 'center', verticalAlign: 'middle', width: 40 }}>
        <input type='checkbox' checked={item.reserved} onChange={e => onUpdate('reserved', e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--pk)', cursor: 'pointer' }} />
      </td>
      <td style={{ padding: '5px 5px', verticalAlign: 'middle', minWidth: 110 }}>
        <input style={{ ...inp, textDecoration: item.reserved ? 'line-through' : 'none' }} value={item.title} onChange={e => onUpdate('title', e.target.value)} placeholder={ph.title} />
      </td>
      <td style={{ padding: '5px 5px', verticalAlign: 'middle', minWidth: 120 }}>
        <input style={inp} value={item.detail} onChange={e => onUpdate('detail', e.target.value)} placeholder={ph.detail} />
      </td>
      <td style={{ padding: '5px 5px', verticalAlign: 'middle', width: 110 }}>
        <input
          type='number' min={0}
          style={{ ...inp, textAlign: 'right' }}
          value={amountStr}
          onChange={e => { isEditingAmount.current = true; setAmountStr(e.target.value) }}
          onBlur={handleAmountBlur}
          placeholder={ph.amount}
        />
      </td>
      <td style={{ padding: '5px 5px', verticalAlign: 'middle', minWidth: 100 }}>
        <input style={inp} value={item.note} onChange={e => onUpdate('note', e.target.value)} placeholder={ph.note} />
      </td>
      <td style={{ padding: '5px 5px', textAlign: 'center', verticalAlign: 'middle', width: 30 }}>
        <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', fontSize: 15, padding: '2px 3px', lineHeight: 1 }} title='삭제'>✕</button>
      </td>
    </tr>
  )
}

// ── Schedule Card (Card view) ─────────────────────────────────────────────────
function ScheduleCard({ item, onUpdate, onDelete }: {
  item: HoneymoonScheduleItem
  onUpdate: (field: keyof HoneymoonScheduleItem, value: string | boolean | number) => void
  onDelete: () => void
}) {
  const [amountStr, setAmountStr] = useState(() => item.amount === 0 ? '' : String(item.amount * 10000))
  const isEditingAmount = useRef(false)
  const cat = CAT_META[item.category ?? autoCategory(item.title)]

  useEffect(() => {
    if (!isEditingAmount.current) {
      setAmountStr(item.amount === 0 ? '' : String(item.amount * 10000))
    }
  }, [item.amount])

  function handleAmountBlur() {
    isEditingAmount.current = false
    const won = parseInt(amountStr) || 0
    const man = Math.round(won / 10000)
    onUpdate('amount', man)
    setAmountStr(man === 0 ? '' : String(man * 10000))
  }

  const inp: React.CSSProperties = {
    border: '1px solid var(--gray2)', borderRadius: 6, padding: '5px 8px',
    fontSize: 12, outline: 'none', background: 'transparent', boxSizing: 'border-box',
  }

  return (
    <div style={{
      background: item.reserved ? '#f0fff4' : '#fff',
      borderRadius: 10,
      border: `1.5px solid ${item.reserved ? '#86efac' : 'var(--gray1)'}`,
      padding: '10px 12px', marginBottom: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        {/* 시간 */}
        <input style={{ ...inp, width: 60, textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--pk)', background: 'var(--pk5)', border: '1px solid var(--pk4)' }}
          value={item.time} onChange={e => onUpdate('time', e.target.value)} placeholder='00:00' />
        {/* 카테고리 뱃지 */}
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: cat.color + '22', color: cat.color, whiteSpace: 'nowrap', flexShrink: 0 }}>
          {cat.emoji} {cat.label}
        </span>
        <div style={{ flex: 1 }} />
        {/* 예약 체크 */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 11, color: item.reserved ? '#16a34a' : 'var(--text2)', fontWeight: item.reserved ? 700 : 400 }}>
          <input type='checkbox' checked={item.reserved} onChange={e => onUpdate('reserved', e.target.checked)} style={{ accentColor: '#22c55e' }} />
          예약완료
        </label>
        <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', fontSize: 14, padding: 2, lineHeight: 1 }}>✕</button>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
        <input style={{ ...inp, flex: 2, textDecoration: item.reserved ? 'line-through' : 'none' }}
          value={item.title} onChange={e => onUpdate('title', e.target.value)} placeholder='일정명' />
        <input style={{ ...inp, flex: 1, textAlign: 'right' }}
          type='number' min={0}
          value={amountStr}
          onChange={e => { isEditingAmount.current = true; setAmountStr(e.target.value) }}
          onBlur={handleAmountBlur}
          placeholder='금액(원)' />
      </div>
      <input style={{ ...inp, width: '100%' }}
        value={item.detail} onChange={e => onUpdate('detail', e.target.value)} placeholder='장소, 예약번호, 세부내용' />
    </div>
  )
}

// ── DaySection ────────────────────────────────────────────────────────────────
function DaySection({ day, isOnly, onToggle, onUpdateDate, onDeleteRequest, onInsertAfter, onAddItem, onDeleteItem, onUpdateItem, viewMode }: {
  day: HoneymoonDay
  isOnly: boolean
  onToggle: () => void
  onUpdateDate: (date: string) => void
  onDeleteRequest: () => void
  onInsertAfter: () => void
  onAddItem: () => void
  onDeleteItem: (id: string) => void
  onUpdateItem: (id: string, field: keyof HoneymoonScheduleItem, value: string | boolean | number) => void
  viewMode: 'card' | 'table'
}) {
  const subtotal = day.items.reduce((s, it) => s + (it.amount || 0), 0)

  return (
    <div style={{ background: '#fff', borderRadius: 14, marginBottom: 4, border: '1.5px solid var(--pk4)', overflow: 'hidden', boxShadow: '0 4px 16px rgba(255,107,157,.08)' }}>
      {/* Header */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', cursor: 'pointer', background: 'var(--pk5)', userSelect: 'none', flexWrap: 'wrap' }}
        onClick={onToggle}
      >
        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--pk)', minWidth: 52 }}>DAY {day.dayNumber}</span>
        <input
          type='date' value={day.date}
          onChange={e => { e.stopPropagation(); onUpdateDate(e.target.value) }}
          onClick={e => e.stopPropagation()}
          style={{ fontSize: 12, border: '1px solid var(--gray2)', borderRadius: 6, padding: '3px 7px', outline: 'none', background: '#fff', color: 'var(--text)' }}
        />
        <span style={{ flex: 1, fontSize: 12, color: 'var(--pk)', fontWeight: 700, textAlign: 'right', paddingRight: 4 }}>소계: {fmt(subtotal)}만원</span>
        <button
          onClick={e => { e.stopPropagation(); onDeleteRequest() }}
          disabled={isOnly}
          style={{
            background: isOnly ? 'transparent' : 'rgba(224,48,96,.08)',
            border: 'none', color: isOnly ? 'var(--gray2)' : '#e03060',
            borderRadius: 6, padding: '3px 9px', fontSize: 11, fontWeight: 600,
            cursor: isOnly ? 'default' : 'pointer',
          }}
        >🗑️ 삭제</button>
        <span style={{ fontSize: 12, color: 'var(--text2)', transform: day.isOpen ? 'rotate(180deg)' : 'none', transition: '.2s', display: 'inline-block' }}>▼</span>
      </div>

      {/* Content */}
      {day.isOpen && (
        <>
          {viewMode === 'table' ? (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 580 }}>
                <thead>
                  <tr style={{ background: 'var(--pk5)', borderBottom: '1.5px solid var(--pk4)' }}>
                    {(['시간', '예약', '일정명', '세부내용', '금액(원)', '비고', ''] as const).map(h => (
                      <th key={h} style={{ padding: '7px 5px', fontSize: 11, fontWeight: 700, color: 'var(--pk)', textAlign: h === '금액(원)' ? 'right' : 'center', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {day.items.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: 16, textAlign: 'center', fontSize: 12, color: 'var(--text2)' }}>일정을 추가해주세요.</td></tr>
                  ) : day.items.map((item, itemIdx) => (
                    <ScheduleRow
                      key={item.id}
                      item={item}
                      isFirst={itemIdx === 0}
                      onUpdate={(f, v) => onUpdateItem(item.id, f, v)}
                      onDelete={() => onDeleteItem(item.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '10px 12px 4px' }}>
              {day.items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 16, fontSize: 12, color: 'var(--text2)' }}>일정을 추가해주세요.</div>
              ) : day.items.map(item => (
                <ScheduleCard
                  key={item.id}
                  item={item}
                  onUpdate={(f, v) => onUpdateItem(item.id, f, v)}
                  onDelete={() => onDeleteItem(item.id)}
                />
              ))}
            </div>
          )}

          <div style={{ padding: '8px 12px' }}>
            <button onClick={onAddItem} style={{ width: '100%', background: 'var(--pk5)', border: '1.5px dashed var(--pk4)', color: 'var(--pk)', borderRadius: 8, padding: '7px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              + 일정 추가
            </button>
          </div>
        </>
      )}

      {/* Insert DAY after */}
      <div style={{ padding: day.isOpen ? '0 12px 10px' : '8px 12px' }}>
        <button onClick={onInsertAfter} style={{ width: '100%', background: 'none', border: '1px dashed var(--gray2)', color: 'var(--text2)', borderRadius: 8, padding: '5px 0', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
          + DAY 삽입
        </button>
      </div>
    </div>
  )
}

const COMMON_CHECKS = [
  { icon: '🌤️', label: '날씨', desc: '여행 기간의 현지 날씨와 우기/건기 여부를 미리 확인하세요.' },
  { icon: '📋', label: '예약 가능 여부', desc: '항공권, 숙소, 주요 액티비티의 예약 가능 여부를 확인하세요.' },
  { icon: '🚫', label: '휴무일', desc: '방문 예정 관광지·식당의 휴무일(주말/공휴일 포함)을 확인하세요.' },
]

// ── 여행 유형 프리셋 ─────────────────────────────────────────────────────────
type TripStyle = 'simple' | 'basic' | 'luxury'
const TRIP_TYPES: { key: TripStyle; emoji: string; label: string; budget: string; budgetMan: number }[] = [
  { key: 'simple', emoji: '🏝️', label: '국내·제주',  budget: '약 200만',   budgetMan: 200  },
  { key: 'basic',  emoji: '🌴', label: '동남아',      budget: '약 450만',   budgetMan: 450  },
  { key: 'luxury', emoji: '🗼', label: '하와이·유럽', budget: '약 1,000만', budgetMan: 1000 },
]

type PresetItem = { time: string; title: string; detail: string; amount: number }
const TRIP_PRESETS: Record<TripStyle, { dayLabel: string; items: PresetItem[] }[]> = {
  simple: [
    { dayLabel: 'DAY1 출발', items: [
      { time: '09:00', title: '국내선 항공 (2인 왕복)', detail: '김포·김해→제주 등', amount: 20 },
      { time: '11:30', title: '공항→숙소 이동', detail: '렌터카·택시', amount: 5 },
      { time: '18:00', title: '저녁식사', detail: '현지 맛집', amount: 5 },
    ]},
    { dayLabel: 'DAY2 관광', items: [
      { time: '09:00', title: '숙소 (1박)', detail: '펜션·호텔', amount: 14 },
      { time: '10:00', title: '관광지 입장', detail: '현지 명소', amount: 5 },
      { time: '12:30', title: '점심식사', detail: '전복·해물 등 현지 특식', amount: 3 },
      { time: '15:00', title: '교통비', detail: '렌터카·대중교통', amount: 5 },
      { time: '18:30', title: '저녁식사', detail: '흑돼지·현지 식당', amount: 5 },
    ]},
    { dayLabel: 'DAY3 액티비티', items: [
      { time: '09:00', title: '숙소 (1박)', detail: '', amount: 14 },
      { time: '10:00', title: '액티비티', detail: '스쿠버·승마·ATV 등', amount: 10 },
      { time: '12:30', title: '점심식사', detail: '', amount: 3 },
      { time: '15:30', title: '카페·디저트', detail: '', amount: 2 },
      { time: '18:30', title: '저녁식사', detail: '', amount: 5 },
    ]},
    { dayLabel: 'DAY4 쇼핑', items: [
      { time: '09:00', title: '숙소 (1박)', detail: '', amount: 14 },
      { time: '10:00', title: '쇼핑', detail: '특산품·기념품', amount: 15 },
      { time: '12:30', title: '점심식사', detail: '', amount: 3 },
      { time: '18:00', title: '마지막 밤 저녁', detail: '특식 레스토랑', amount: 6 },
    ]},
    { dayLabel: 'DAY5 귀환', items: [
      { time: '08:00', title: '조식·체크아웃', detail: '', amount: 3 },
      { time: '10:00', title: '귀환 항공 (2인)', detail: '', amount: 0 },
      { time: '12:00', title: '공항 이동', detail: '', amount: 5 },
    ]},
  ],
  basic: [
    { dayLabel: 'DAY1 출발', items: [
      { time: '09:00', title: '국제선 항공 (2인, 왕복)', detail: '이코노미 · 발리/다낭/방콕', amount: 100 },
      { time: '09:00', title: '유류할증료·공항세', detail: '', amount: 12 },
      { time: '14:00', title: '공항→호텔 이동', detail: '셔틀·그랩', amount: 7 },
      { time: '17:00', title: '호텔 체크인', detail: '5성급 리조트 (1박)', amount: 30 },
      { time: '19:00', title: '저녁식사', detail: '씨푸드·현지 특식', amount: 5 },
    ]},
    { dayLabel: 'DAY2 리조트', items: [
      { time: '09:00', title: '숙소 (1박)', detail: '5성급 리조트', amount: 30 },
      { time: '12:00', title: '점심식사', detail: '현지 레스토랑', amount: 3 },
      { time: '14:00', title: '수영장·스파', detail: '리조트 시설', amount: 5 },
      { time: '19:00', title: '저녁식사', detail: '씨푸드 레스토랑', amount: 8 },
    ]},
    { dayLabel: 'DAY3 스냅·액티비티', items: [
      { time: '06:00', title: '현지 스냅 촬영', detail: '해변·리조트 야외 스냅', amount: 25 },
      { time: '09:00', title: '숙소 (1박)', detail: '', amount: 30 },
      { time: '12:00', title: '점심식사', detail: '', amount: 4 },
      { time: '14:00', title: '액티비티', detail: '서핑·다이빙·투어', amount: 15 },
      { time: '19:00', title: '저녁식사', detail: '', amount: 8 },
    ]},
    { dayLabel: 'DAY4 쇼핑', items: [
      { time: '09:00', title: '숙소 (1박)', detail: '', amount: 30 },
      { time: '10:00', title: '현지 쇼핑', detail: '기념품·잡화·화장품', amount: 40 },
      { time: '13:00', title: '점심식사', detail: '', amount: 3 },
      { time: '19:00', title: '저녁식사', detail: '마지막 밤 특식', amount: 8 },
      { time: '21:00', title: '기념품', detail: '', amount: 8 },
    ]},
    { dayLabel: 'DAY5 귀환', items: [
      { time: '09:00', title: '숙소 (마지막 1박)', detail: '', amount: 30 },
      { time: '12:00', title: '점심식사', detail: '', amount: 4 },
      { time: '15:00', title: '공항 이동', detail: '셔틀·그랩', amount: 5 },
      { time: '18:00', title: '귀국 (유류할증 포함)', detail: '', amount: 6 },
    ]},
  ],
  luxury: [
    { dayLabel: 'DAY1 출발', items: [
      { time: '11:00', title: '국제선 항공 (2인, 왕복)', detail: '비즈니스/이코노미 · 하와이·유럽', amount: 180 },
      { time: '11:00', title: '유류할증료·공항세', detail: '', amount: 25 },
      { time: '11:00', title: '공항→호텔 프라이빗 트랜스퍼', detail: '', amount: 12 },
      { time: '17:00', title: '럭셔리 호텔 체크인 (1박)', detail: '5성급 럭셔리 리조트', amount: 60 },
      { time: '20:00', title: '파인다이닝 저녁', detail: '미슐랭·유명 레스토랑', amount: 10 },
    ]},
    { dayLabel: 'DAY2 휴식·식도락', items: [
      { time: '09:00', title: '숙소 (1박)', detail: '럭셔리 리조트', amount: 60 },
      { time: '09:00', title: '호텔 뷔페 조식', detail: '', amount: 10 },
      { time: '12:30', title: '점심식사', detail: '', amount: 15 },
      { time: '15:00', title: '커플 스파·마사지', detail: '', amount: 10 },
      { time: '19:00', title: '스페셜 디너', detail: '석양 뷰 파인다이닝', amount: 25 },
    ]},
    { dayLabel: 'DAY3 스냅·프리미엄 액티비티', items: [
      { time: '06:00', title: '현지 스냅 촬영', detail: '프리미엄 작가·드레스 포함', amount: 50 },
      { time: '09:00', title: '숙소 (1박)', detail: '', amount: 60 },
      { time: '12:00', title: '점심식사', detail: '', amount: 20 },
      { time: '14:00', title: '프리미엄 액티비티', detail: '헬기투어·요트·스쿠버 등', amount: 40 },
      { time: '19:00', title: '저녁식사', detail: '파인다이닝', amount: 20 },
    ]},
    { dayLabel: 'DAY4 쇼핑', items: [
      { time: '09:00', title: '숙소 (1박)', detail: '', amount: 60 },
      { time: '10:00', title: '프리미엄 쇼핑', detail: '명품·현지 브랜드', amount: 120 },
      { time: '13:00', title: '점심식사', detail: '', amount: 15 },
      { time: '19:00', title: '마지막 밤 파인다이닝', detail: '', amount: 30 },
      { time: '21:00', title: '기념품·소품', detail: '', amount: 15 },
    ]},
    { dayLabel: 'DAY5 귀환', items: [
      { time: '09:00', title: '숙소 (마지막 1박)', detail: '', amount: 60 },
      { time: '09:00', title: '호텔 조식', detail: '', amount: 10 },
      { time: '12:00', title: '점심식사', detail: '', amount: 15 },
      { time: '15:00', title: '호텔→공항 프라이빗 트랜스퍼', detail: '', amount: 8 },
    ]},
  ],
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function HoneymoonPlanPage() {
  const userData = useAuthStore(s => s.userData)!
  const user = useAuthStore(s => s.user)
  const setUserData = useAuthStore(s => s.setUserData)
  const saveUserData = useAuthStore(s => s.saveUserData)
  const isGuest = user?.nick === '게스트'

  const plan: HoneymoonPlanState = userData.honeymoonPlan ?? makeDefaultPlan()

  const [checklistOpen, setChecklistOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; dayNumber: number } | null>(null)
  const [saved, setSaved] = useState(false)
  const [guestPopup, setGuestPopup] = useState(false)
  const [tripStyle, setTripStyle] = useState<TripStyle | null>(null)
  const [budgetStr, setBudgetStr] = useState(() => plan.budget ? String(plan.budget * 10000) : '')
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card')
  const [catOpen, setCatOpen] = useState(false)

  function savePlan(newPlan: HoneymoonPlanState) {
    setUserData({ ...userData, honeymoonPlan: newPlan })
  }

  function manualSave() {
    if (isGuest) { setGuestPopup(true); return }
    saveUserData()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const totalCost = plan.days.reduce((s, d) => s + d.items.reduce((ss, it) => ss + (it.amount || 0), 0), 0)
  const budgetWon = parseInt(budgetStr) || 0
  const budgetMan = Math.round(budgetWon / 10000)
  const diff = budgetMan - totalCost

  function commitBudget() {
    savePlan({ ...plan, budget: Math.round((parseInt(budgetStr) || 0) / 10000) })
  }

  function applyTripPreset(style: TripStyle) {
    const preset = TRIP_TYPES.find(t => t.key === style)!
    const newBudgetStr = String(preset.budgetMan * 10000)
    const newDays: HoneymoonDay[] = TRIP_PRESETS[style].map((day, i) => ({
      id: uid(), dayNumber: i + 1, date: '', isOpen: i === 0,
      items: day.items.map(it => ({
        id: uid(), time: it.time, reserved: false,
        title: it.title, detail: it.detail, amount: it.amount, note: '',
      })),
    }))
    setTripStyle(style)
    setBudgetStr(newBudgetStr)
    savePlan({ ...plan, budget: preset.budgetMan, days: newDays })
  }

  // ── 카테고리별 집계 ──────────────────────────────────────────────────────────
  const catTotals = (() => {
    const totals: Partial<Record<HoneymoonCategory, number>> = {}
    plan.days.forEach(d =>
      d.items.forEach(it => {
        if (!it.amount) return
        const cat = it.category ?? autoCategory(it.title)
        totals[cat] = (totals[cat] ?? 0) + it.amount
      })
    )
    return totals
  })()
  const catMax = Math.max(1, ...Object.values(catTotals).filter(Boolean) as number[])

  // ── 예약 체크리스트 ──────────────────────────────────────────────────────────
  const bookingChecklist: HoneymoonBookingItem[] = plan.bookingChecklist ?? DEFAULT_BOOKING.map(b => ({ ...b }))
  const bookingDone = bookingChecklist.filter(b => b.done).length

  function updateBooking(id: string, changes: Partial<HoneymoonBookingItem>) {
    const newList = bookingChecklist.map(b => b.id === id ? { ...b, ...changes } : b)
    savePlan({ ...plan, bookingChecklist: newList })
  }

  // ── 여행지·날짜 ─────────────────────────────────────────────────────────────
  const destination = plan.destination ?? ''
  const departureDate = plan.departureDate ?? ''
  const returnDate = plan.returnDate ?? ''

  const daysUntilDeparture = departureDate
    ? Math.ceil((new Date(departureDate).getTime() - Date.now()) / 86400000)
    : null

  function patchPlan(patch: Partial<HoneymoonPlanState>) {
    savePlan({ ...plan, ...patch })
  }

  // ── Excel 내보내기 ───────────────────────────────────────────────────────────
  function exportExcel() {
    const rows: (string | number)[][] = [['DAY', '날짜', '시간', '예약', '항목', '상세', '금액(원)', '메모']]
    plan.days.forEach(d => {
      d.items.forEach(it => {
        rows.push([`DAY ${d.dayNumber}`, d.date, it.time, it.reserved ? '✓' : '', it.title, it.detail, (it.amount || 0) * 10000, it.note])
      })
    })
    rows.push(['', '', '', '', '', '합계(만원)', totalCost, ''])
    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 8 }, { wch: 12 }, { wch: 8 }, { wch: 6 }, { wch: 18 }, { wch: 24 }, { wch: 10 }, { wch: 20 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '신혼여행일정')
    XLSX.writeFile(wb, '딸깍_신혼여행일정.xlsx')
  }

  function addDay(afterIdx?: number) {
    const newDay: HoneymoonDay = { id: uid(), dayNumber: 0, date: '', isOpen: true, items: [makeEmptyItem(), makeEmptyItem(), makeEmptyItem()] }
    let days: HoneymoonDay[]
    if (afterIdx !== undefined) {
      days = [...plan.days.slice(0, afterIdx + 1), newDay, ...plan.days.slice(afterIdx + 1)]
    } else {
      days = [...plan.days, newDay]
    }
    savePlan({ ...plan, days: days.map((d, i) => ({ ...d, dayNumber: i + 1 })) })
  }

  function deleteDay(dayId: string) {
    const days = plan.days.filter(d => d.id !== dayId).map((d, i) => ({ ...d, dayNumber: i + 1 }))
    savePlan({ ...plan, days })
    setDeleteTarget(null)
  }

  function toggleDay(dayId: string) {
    savePlan({ ...plan, days: plan.days.map(d => d.id === dayId ? { ...d, isOpen: !d.isOpen } : d) })
  }

  function updateDayDate(dayId: string, date: string) {
    savePlan({ ...plan, days: plan.days.map(d => d.id === dayId ? { ...d, date } : d) })
  }

  function addItem(dayId: string) {
    const item = makeEmptyItem()
    savePlan({ ...plan, days: plan.days.map(d => d.id === dayId ? { ...d, items: [...d.items, item] } : d) })
  }

  function deleteItem(dayId: string, itemId: string) {
    savePlan({ ...plan, days: plan.days.map(d => d.id === dayId ? { ...d, items: d.items.filter(it => it.id !== itemId) } : d) })
  }

  function updateItem(dayId: string, itemId: string, field: keyof HoneymoonScheduleItem, value: string | boolean | number) {
    savePlan({
      ...plan,
      days: plan.days.map(d => d.id === dayId ? {
        ...d, items: d.items.map(it => it.id === itemId ? { ...it, [field]: value } : it)
      } : d),
    })
  }

  const usedPct = budgetMan > 0 ? Math.min(100, Math.round(totalCost / budgetMan * 100)) : 0
  const activeTrip = TRIP_TYPES.find(o => o.key === tripStyle)

  return (
    <div>
      {guestPopup && <GuestPopup onClose={() => setGuestPopup(false)} />}
      {deleteTarget && (
        <DeleteDayDialog
          dayNumber={deleteTarget.dayNumber}
          onConfirm={() => deleteDay(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {/* ── 여행 유형 선택 (pill chips) ── */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 6 }}>
          ✈️ 여행 유형 · 4박5일 자동 세팅
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
          {TRIP_TYPES.map(({ key, emoji, label, budget }) => {
            const active = tripStyle === key
            return (
              <button key={key} onClick={() => applyTripPreset(key)} style={{
                flexShrink: 0,
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 100, cursor: 'pointer',
                border: `1.5px solid ${active ? 'var(--pk)' : 'var(--gray2)'}`,
                background: active ? 'var(--pk)' : '#fff',
                color: active ? '#fff' : 'var(--text)',
                boxShadow: active ? '0 3px 10px rgba(255,107,157,.35)' : '0 1px 4px rgba(0,0,0,.06)',
                transition: 'all .15s',
              }}>
                <span style={{ fontSize: 16 }}>{emoji}</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap' }}>{label}</div>
                  <div style={{ fontSize: 9, opacity: active ? .8 : .55, whiteSpace: 'nowrap' }}>{budget}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── 여행지 · 출발 날짜 카드 (NEW) ── */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid var(--pk4)', padding: '14px', marginBottom: 12, boxShadow: '0 2px 10px rgba(255,107,157,.07)' }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--pk)', marginBottom: 10 }}>✈️ 여행지 · 일정</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>📍</span>
          <input
            value={destination}
            onChange={e => patchPlan({ destination: e.target.value })}
            placeholder='여행지 입력 (예: 발리 · 꾸따 비치)'
            style={{ flex: 1, border: '1.5px solid var(--pk4)', borderRadius: 8, padding: '8px 10px', fontSize: 13, outline: 'none', color: 'var(--text)' }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text2)', marginBottom: 4 }}>출발일</div>
            <input type='date' value={departureDate}
              onChange={e => patchPlan({ departureDate: e.target.value })}
              style={{ width: '100%', border: '1.5px solid var(--pk4)', borderRadius: 8, padding: '8px 10px', fontSize: 12, outline: 'none', color: 'var(--pk)', fontWeight: 700, boxSizing: 'border-box' }} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text2)', marginBottom: 4 }}>귀국일</div>
            <input type='date' value={returnDate}
              onChange={e => patchPlan({ returnDate: e.target.value })}
              style={{ width: '100%', border: '1.5px solid var(--pk4)', borderRadius: 8, padding: '8px 10px', fontSize: 12, outline: 'none', color: 'var(--pk)', fontWeight: 700, boxSizing: 'border-box' }} />
          </div>
        </div>
        {(daysUntilDeparture !== null || (departureDate && returnDate)) && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {daysUntilDeparture !== null && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--pk)', color: '#fff', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 800 }}>
                ✈️ {daysUntilDeparture > 0 ? `D-${daysUntilDeparture}` : daysUntilDeparture === 0 ? 'D-DAY 출발!' : '여행 중 🏖️'}
              </div>
            )}
            {departureDate && returnDate && (() => {
              const nights = Math.round((new Date(returnDate).getTime() - new Date(departureDate).getTime()) / 86400000)
              return nights > 0 ? (
                <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600 }}>{nights}박 {nights + 1}일</div>
              ) : null
            })()}
          </div>
        )}
      </div>

      {/* ── 예산 히어로 카드 ── */}
      <div style={{ background: 'linear-gradient(135deg,var(--pk),var(--mn))', borderRadius: 14, padding: '16px', color: '#fff', marginBottom: 12, boxShadow: '0 6px 24px rgba(255,107,157,.25)' }}>
        {activeTrip && (
          <div style={{ marginBottom: 6 }}>
            <span style={{ background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.4)', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 800 }}>
              {activeTrip.emoji} {activeTrip.label} 4박5일
            </span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 11, opacity: .8, fontWeight: 600, marginBottom: 2 }}>✈️ 신혼여행 예상 합계</div>
            <div style={{ fontSize: 'clamp(26px,8vw,32px)', fontWeight: 900, lineHeight: 1 }}>{fmt(totalCost)}만원</div>
            {budgetMan > 0 && (
              <div style={{ fontSize: 11, opacity: .75, marginTop: 4 }}>목표 예산 {fmt(budgetMan)}만원 기준</div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, opacity: .8, marginBottom: 2 }}>예산 잔여</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: diff < 0 ? '#ffd0d0' : '#a8ffdf' }}>
              {budgetMan > 0 ? (diff >= 0 ? `+${fmt(diff)}만` : `-${fmt(Math.abs(diff))}만`) : '-'}
            </div>
          </div>
        </div>
        {budgetMan > 0 && (
          <div style={{ height: 6, background: 'rgba(255,255,255,.25)', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
            <div style={{ height: '100%', width: `${usedPct}%`, background: usedPct > 100 ? '#ff6b6b' : '#fff', borderRadius: 3, transition: 'width .5s' }} />
          </div>
        )}
        {/* DAY별 소계 */}
        {(() => {
          const daySummary = plan.days
            .map(d => ({ label: `DAY ${d.dayNumber}`, total: d.items.reduce((s, it) => s + (it.amount || 0), 0) }))
            .filter(d => d.total > 0).slice(0, 4)
          return daySummary.length > 0 ? (
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {daySummary.map(d => (
                <div key={d.label} style={{ flex: 1, background: 'rgba(255,255,255,.15)', borderRadius: 8, padding: '6px 4px', textAlign: 'center', minWidth: 0 }}>
                  <div style={{ fontSize: 9, opacity: .8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.label}</div>
                  <div style={{ fontSize: 12, fontWeight: 800, marginTop: 2 }}>{fmt(d.total)}만</div>
                </div>
              ))}
            </div>
          ) : null
        })()}
        {/* 목표 예산 입력 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.15)', borderRadius: 9, padding: '7px 12px' }}>
          <span style={{ fontSize: 11, opacity: .85, whiteSpace: 'nowrap', flexShrink: 0 }}>목표 예산</span>
          <input
            type='number' min={0}
            value={budgetStr}
            onChange={e => setBudgetStr(e.target.value)}
            onBlur={commitBudget}
            onKeyDown={e => e.key === 'Enter' && commitBudget()}
            placeholder='미설정'
            style={{ flex: 1, border: 'none', background: 'transparent', color: '#fff', fontSize: 14, fontWeight: 700, outline: 'none', textAlign: 'right', minWidth: 0 }}
          />
          <span style={{ fontSize: 11, opacity: .7, flexShrink: 0 }}>원</span>
          <button
            onClick={manualSave}
            style={{ background: 'rgba(255,255,255,.25)', border: '1px solid rgba(255,255,255,.5)', color: '#fff', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            {saved ? '✓ 저장됨' : '저장'}
          </button>
        </div>
      </div>

      {/* ── 카테고리별 예산 분석 (NEW) ── */}
      {totalCost > 0 && (
        <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid var(--pk4)', overflow: 'hidden', marginBottom: 12 }}>
          <div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', cursor: 'pointer', background: 'var(--pk5)', userSelect: 'none' }}
            onClick={() => setCatOpen(o => !o)}
          >
            <span style={{ fontSize: 13, fontWeight: 800 }}>💸 카테고리별 예산 분석</span>
            <span style={{ fontSize: 12, color: 'var(--text2)', transform: catOpen ? 'rotate(180deg)' : 'none', transition: '.2s', display: 'inline-block' }}>▼</span>
          </div>
          {catOpen && (
            <div style={{ padding: '12px 16px' }}>
              {(Object.entries(CAT_META) as [HoneymoonCategory, typeof CAT_META[HoneymoonCategory]][]).map(([key, meta]) => {
                const val = catTotals[key] ?? 0
                if (!val) return null
                const barPct = Math.round((val / catMax) * 100)
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, width: 60, flexShrink: 0, color: meta.color }}>{meta.emoji} {meta.label}</div>
                    <div style={{ flex: 1, height: 8, background: 'var(--gray1)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${barPct}%`, background: meta.color, borderRadius: 4, transition: 'width .4s' }} />
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, width: 48, textAlign: 'right', color: 'var(--text2)', flexShrink: 0 }}>{fmt(val)}만</div>
                  </div>
                )
              })}
              <div style={{ height: 1, background: 'var(--gray1)', margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 800 }}>
                <span>합계</span>
                <span style={{ color: 'var(--pk)' }}>{fmt(totalCost)}만원</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 예약·준비 체크리스트 (NEW) ── */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid var(--pk4)', overflow: 'hidden', marginBottom: 12 }}>
        <div
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', cursor: 'pointer', background: 'var(--pk5)', userSelect: 'none' }}
          onClick={() => setChecklistOpen(o => !o)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 800 }}>📋 예약·준비 체크리스트</span>
            <span style={{ fontSize: 10, fontWeight: 700, background: bookingDone === bookingChecklist.length ? '#dcfce7' : 'var(--pk4)', color: bookingDone === bookingChecklist.length ? '#16a34a' : 'var(--pk)', padding: '2px 8px', borderRadius: 10 }}>
              {bookingDone}/{bookingChecklist.length}
            </span>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text2)', transform: checklistOpen ? 'rotate(180deg)' : 'none', transition: '.2s', display: 'inline-block' }}>▼</span>
        </div>
        {checklistOpen && (
          <div style={{ padding: '10px 14px 12px' }}>
            {bookingChecklist.map(item => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 10px', borderRadius: 10, marginBottom: 6,
                background: item.done ? '#f0fff4' : '#fff',
                border: `1.5px solid ${item.done ? '#86efac' : 'var(--gray1)'}`,
              }}>
                <button
                  onClick={() => updateBooking(item.id, { done: !item.done })}
                  style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
                    border: item.done ? 'none' : '2px solid var(--gray2)',
                    background: item.done ? '#22c55e' : 'transparent',
                    color: '#fff', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >{item.done ? '✓' : ''}</button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: item.done ? 'var(--text2)' : 'var(--text)', textDecoration: item.done ? 'line-through' : 'none' }}>
                    {item.label}
                  </div>
                  <input
                    value={item.memo}
                    onChange={e => updateBooking(item.id, { memo: e.target.value })}
                    placeholder='메모 (항공편명, 금액 등)'
                    style={{ width: '100%', border: 'none', borderBottom: '1px solid var(--gray1)', fontSize: 11, color: 'var(--text2)', outline: 'none', background: 'transparent', marginTop: 3, padding: '2px 0', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: item.done ? '#dcfce7' : 'var(--gray1)', color: item.done ? '#16a34a' : 'var(--text2)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {item.done ? '완료' : '미완료'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 도구 버튼 (엑셀 + 뷰 전환 + 유형 초기화) */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginBottom: 12 }}>
        <button onClick={exportExcel}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1.5px solid #22a55a', borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', color: '#22a55a' }}>
          📊 엑셀
        </button>
        <div style={{ display: 'flex', border: '1.5px solid var(--gray2)', borderRadius: 8, overflow: 'hidden' }}>
          <button
            onClick={() => setViewMode('card')}
            style={{ padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none', background: viewMode === 'card' ? 'var(--pk)' : '#fff', color: viewMode === 'card' ? '#fff' : 'var(--text2)' }}>
            📋 카드
          </button>
          <button
            onClick={() => setViewMode('table')}
            style={{ padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none', borderLeft: '1px solid var(--gray2)', background: viewMode === 'table' ? 'var(--pk)' : '#fff', color: viewMode === 'table' ? '#fff' : 'var(--text2)' }}>
            📊 표
          </button>
        </div>
        {tripStyle && (
          <button onClick={() => setTripStyle(null)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fff', border: '1.5px solid var(--pk)', borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', color: 'var(--pk)' }}>
            🔄 초기화
          </button>
        )}
      </div>

      {/* 공통 체크사항 카드 */}
      <div style={{ background: '#fff', borderRadius: 14, marginBottom: 14, border: '1.5px solid var(--pk4)', overflow: 'hidden', boxShadow: '0 4px 16px rgba(255,107,157,.08)' }}>
        <div
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', cursor: 'pointer', background: 'var(--pk5)', userSelect: 'none' }}
          onClick={() => {}}
        >
          <span style={{ fontSize: 14, fontWeight: 800 }}>📌 공통 체크사항</span>
        </div>
        <div style={{ padding: '12px 16px 8px' }}>
          {COMMON_CHECKS.map(({ icon, label, desc }) => (
            <div key={label} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1.3 }}>{icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DAY 섹션 목록 */}
      {plan.days.map((day, idx) => (
        <div key={day.id}>
          <DaySection
            day={day}
            isOnly={plan.days.length === 1}
            onToggle={() => toggleDay(day.id)}
            onUpdateDate={date => updateDayDate(day.id, date)}
            onDeleteRequest={() => setDeleteTarget({ id: day.id, dayNumber: day.dayNumber })}
            onInsertAfter={() => addDay(idx)}
            onAddItem={() => addItem(day.id)}
            onDeleteItem={itemId => deleteItem(day.id, itemId)}
            onUpdateItem={(itemId, field, value) => updateItem(day.id, itemId, field, value)}
            viewMode={viewMode}
          />
          {(idx + 1) % 2 === 0 && idx < plan.days.length - 1 && <NativeAdCard />}
        </div>
      ))}

      {/* DAY 추가 버튼 */}
      <button
        onClick={() => addDay()}
        style={{ width: '100%', background: 'var(--pk5)', border: '2px dashed var(--pk4)', color: 'var(--pk)', borderRadius: 14, padding: '14px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}
      >
        + DAY 추가
      </button>
    </div>
  )
}
