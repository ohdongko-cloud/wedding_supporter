import { useState, useEffect, useRef } from 'react'
import * as XLSX from 'xlsx'
import { useAuthStore } from '../stores/authStore'
import type { HoneymoonPlanState, HoneymoonDay, HoneymoonScheduleItem } from '../types'
import NativeAdCard from '../components/ads/NativeAdCard'

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36) }
function fmt(n: number) { return n.toLocaleString('ko-KR') }

function makeEmptyItem(): HoneymoonScheduleItem {
  return { id: uid(), time: '', reserved: false, title: '', detail: '', amount: 0, note: '' }
}

function makeDefaultPlan(): HoneymoonPlanState {
  return {
    budget: 0,
    days: [1, 2, 3].map(dayNumber => ({
      id: uid(), dayNumber, date: '', isOpen: dayNumber === 1,
      items: [makeEmptyItem(), makeEmptyItem(), makeEmptyItem()]
    }))
  }
}

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

function ScheduleRow({ item, onUpdate, onDelete, isFirst }: {
  item: HoneymoonScheduleItem
  onUpdate: (field: keyof HoneymoonScheduleItem, value: string | boolean | number) => void
  onDelete: () => void
  isFirst?: boolean
}) {
  // 금액은 원 단위로 입력받고, blur 시 만원으로 변환하여 저장
  // 입력 중 props가 바뀌어도 덮어쓰지 않도록 local state + ref 사용
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

  // 첫 번째 행에만 placeholder 예시 표시
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

function DaySection({ day, isOnly, onToggle, onUpdateDate, onDeleteRequest, onInsertAfter, onAddItem, onDeleteItem, onUpdateItem }: {
  day: HoneymoonDay
  isOnly: boolean
  onToggle: () => void
  onUpdateDate: (date: string) => void
  onDeleteRequest: () => void
  onInsertAfter: () => void
  onAddItem: () => void
  onDeleteItem: (id: string) => void
  onUpdateItem: (id: string, field: keyof HoneymoonScheduleItem, value: string | boolean | number) => void
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

export default function HoneymoonPlanPage() {
  const userData = useAuthStore(s => s.userData)!
  const user = useAuthStore(s => s.user)
  const setUserData = useAuthStore(s => s.setUserData)
  const saveUserData = useAuthStore(s => s.saveUserData)
  const isGuest = user?.nick === '게스트'

  const plan: HoneymoonPlanState = userData.honeymoonPlan || makeDefaultPlan()

  const [checklistOpen, setChecklistOpen] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; dayNumber: number } | null>(null)
  const [saved, setSaved] = useState(false)
  const [guestPopup, setGuestPopup] = useState(false)
  // budgetStr은 원(₩) 단위로 관리; 저장 시 만원으로 변환
  const [budgetStr, setBudgetStr] = useState(() => plan.budget ? String(plan.budget * 10000) : '')

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
  // budgetWon: 입력값(원), budgetMan: 만원으로 변환
  const budgetWon = parseInt(budgetStr) || 0
  const budgetMan = Math.round(budgetWon / 10000)
  const diff = budgetMan - totalCost

  function commitBudget() {
    savePlan({ ...plan, budget: Math.round((parseInt(budgetStr) || 0) / 10000) })
  }

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
      } : d)
    })
  }

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

      {/* 엑셀 다운로드 */}
      <button onClick={exportExcel}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#fff', border: '1.5px solid #22a55a', borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#22a55a', marginBottom: 14 }}>
        📊 엑셀로 다운받기
      </button>

      {/* 공통 체크사항 카드 */}
      <div style={{ background: '#fff', borderRadius: 14, marginBottom: 14, border: '1.5px solid var(--pk4)', overflow: 'hidden', boxShadow: '0 4px 16px rgba(255,107,157,.08)' }}>
        <div
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', cursor: 'pointer', background: 'var(--pk5)', userSelect: 'none' }}
          onClick={() => setChecklistOpen(o => !o)}
        >
          <span style={{ fontSize: 14, fontWeight: 800 }}>📌 공통 체크사항</span>
          <span style={{ fontSize: 12, color: 'var(--text2)', transform: checklistOpen ? 'rotate(180deg)' : 'none', transition: '.2s', display: 'inline-block' }}>▼</span>
        </div>
        {checklistOpen && (
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
        )}
      </div>

      {/* 예산 요약 카드 */}
      <div style={{ background: 'linear-gradient(135deg,var(--pk),var(--mn))', borderRadius: 14, padding: '18px 20px', color: '#fff', marginBottom: 14, boxShadow: '0 6px 24px rgba(255,107,157,.25)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, opacity: .85, marginBottom: 12 }}>예산 요약</div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,.15)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, opacity: .8, marginBottom: 6 }}>목표 예산</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <input
                type='number' min={0}
                value={budgetStr}
                onChange={e => setBudgetStr(e.target.value)}
                onBlur={commitBudget}
                onKeyDown={e => e.key === 'Enter' && commitBudget()}
                placeholder='0'
                style={{ width: 120, background: 'rgba(255,255,255,.9)', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 13, fontWeight: 700, textAlign: 'right', outline: 'none', color: '#333' }}
              />
              <span style={{ fontSize: 11, opacity: .85 }}>원</span>
            </div>
          </div>
          <div style={{ flex: 1, background: 'rgba(255,255,255,.15)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, opacity: .8, marginBottom: 4 }}>예상 총 비용</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{fmt(totalCost)}<span style={{ fontSize: 10, marginLeft: 2, opacity: .85 }}>만원</span></div>
          </div>
          <div style={{
            flex: 1, borderRadius: 10, padding: '10px 8px', textAlign: 'center',
            background: budgetWon > 0 ? (diff >= 0 ? 'rgba(72,200,120,.25)' : 'rgba(224,48,96,.25)') : 'rgba(255,255,255,.1)',
          }}>
            <div style={{ fontSize: 10, opacity: .8, marginBottom: 4 }}>차액</div>
            {budgetWon > 0 ? (
              <div style={{ fontSize: 18, fontWeight: 800, color: diff >= 0 ? '#a8ffb0' : '#ffd0d0' }}>
                {diff >= 0 ? '+' : ''}{fmt(diff)}<span style={{ fontSize: 10, marginLeft: 2 }}>만원</span>
              </div>
            ) : (
              <div style={{ fontSize: 10, opacity: .65, lineHeight: 1.6 }}>목표 예산을 입력하면<br />차액이 표시됩니다</div>
            )}
          </div>
        </div>
        <button
          onClick={manualSave}
          style={{ width: '100%', background: saved ? 'rgba(255,255,255,.9)' : '#fff', color: saved ? 'var(--gr,#4caf50)' : 'var(--pk)', border: 'none', borderRadius: 10, padding: '10px 0', fontSize: 13, fontWeight: 800, cursor: 'pointer', transition: 'all .2s' }}
        >
          {saved ? '저장되었습니다 ✓' : '저장하기'}
        </button>
      </div>

      {/* DAY 섹션 목록 — 매 2번째 DAY 이후 네이티브 광고 삽입 */}
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
          />
          {/* 2번째 DAY마다 네이티브 광고 카드 삽입 */}
          {(idx + 1) % 2 === 0 && idx < plan.days.length - 1 && (
            <NativeAdCard />
          )}
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
