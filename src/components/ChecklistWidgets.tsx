import { useState } from 'react'
import { CHECKLIST_STAGES } from '../data/checklistSeed'

export interface DeadlineItem {
  stageId: string
  itemId: string
  title: string
  deadline: string
  completed: boolean
  isCustom: boolean
  stageName: string
}

export function parseDaysBefore(timeStr: string): number | null {
  if (!timeStr) return null
  if (timeStr === 'D-day') return 0
  const plus = timeStr.match(/D\+(\d+)/); if (plus) return -parseInt(plus[1])
  const minus = timeStr.match(/D-(\d+)/); if (minus) return parseInt(minus[1])
  return null
}

export function getDDayLabel(dateStr: string): string {
  if (!dateStr) return ''
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
  if (diff > 0) return `D-${diff}`
  if (diff === 0) return 'D-DAY'
  return `D+${Math.abs(diff)}`
}

export function MiniCalendar({ deadlineItems }: { deadlineItems: DeadlineItem[] }) {
  const [viewY, setViewY] = useState(() => new Date().getFullYear())
  const [viewM, setViewM] = useState(() => new Date().getMonth())

  const today = new Date(); today.setHours(0,0,0,0)
  const todayStr = today.toISOString().slice(0,10)

  const byDate: Record<string, DeadlineItem[]> = {}
  deadlineItems.forEach(it => {
    if (!it.deadline) return
    if (!byDate[it.deadline]) byDate[it.deadline] = []
    byDate[it.deadline].push(it)
  })

  function prevMonth() { if (viewM === 0) { setViewY(y => y-1); setViewM(11) } else setViewM(m => m-1) }
  function nextMonth() { if (viewM === 11) { setViewY(y => y+1); setViewM(0) } else setViewM(m => m+1) }

  const firstDay = new Date(viewY, viewM, 1).getDay()
  const daysInMonth = new Date(viewY, viewM + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({length: daysInMonth}, (_, i) => i+1)]
  while (cells.length % 7 !== 0) cells.push(null)

  const DAYS = ['일','월','화','수','목','금','토']
  const monthNames = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid var(--pk4)', padding: '12px 14px', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--pk)', padding: '2px 6px' }}>‹</button>
        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>{viewY}년 {monthNames[viewM]}</span>
        <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--pk)', padding: '2px 6px' }}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
        {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: d==='일'?'#e03060':d==='토'?'#4a80ee':'var(--text2)', paddingBottom: 4 }}>{d}</div>)}
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />
          const dateStr = `${viewY}-${String(viewM+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
          const items = byDate[dateStr] || []
          const isToday = dateStr === todayStr
          const hasItems = items.length > 0
          const allDone = hasItems && items.every(it => it.completed)
          const dayOfWeek = (firstDay + day - 1) % 7
          const textColor = dayOfWeek === 0 ? '#e03060' : dayOfWeek === 6 ? '#4a80ee' : 'var(--text)'
          return (
            <div key={idx} style={{ textAlign: 'center', padding: '3px 2px' }}>
              <div style={{
                display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                width: 28, height: 28, borderRadius: '50%', fontSize: 11, fontWeight: isToday ? 800 : 500,
                background: isToday ? 'var(--pk)' : 'none',
                color: isToday ? '#fff' : textColor,
              }}>
                {day}
              </div>
              {hasItems && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginTop: 1 }}>
                  {items.slice(0,3).map((it, i) => (
                    <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: allDone ? 'var(--gr,#4caf50)' : it.completed ? '#bbb' : 'var(--pk)' }} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
      {Object.keys(byDate).filter(d => d.slice(0,7) === `${viewY}-${String(viewM+1).padStart(2,'0')}`).length > 0 && (
        <div style={{ marginTop: 10, borderTop: '1px solid var(--gray1)', paddingTop: 8 }}>
          {Object.entries(byDate)
            .filter(([d]) => d.slice(0,7) === `${viewY}-${String(viewM+1).padStart(2,'0')}`)
            .sort(([a],[b]) => a.localeCompare(b))
            .map(([date, its]) => (
              <div key={date} style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--pk)', marginRight: 6 }}>
                  {parseInt(date.slice(8))}일
                </span>
                {its.map(it => (
                  <span key={it.itemId} style={{ fontSize: 10, marginRight: 4, color: it.completed ? 'var(--text2)' : 'var(--text)', textDecoration: it.completed ? 'line-through' : 'none' }}>
                    {it.title}
                  </span>
                ))}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

export function WeeklyTasks({ deadlineItems, onToggle }: { deadlineItems: DeadlineItem[]; onToggle: (stageId: string, itemId: string, isCustom: boolean) => void }) {
  const today = new Date(); today.setHours(0,0,0,0)
  const weekLater = new Date(today.getTime() + 7 * 86400000)

  // 이번주 항목 — 완료 여부 관계없이 마감일이 이번주 이내인 것 전부 (완료순 정렬: 미완료 먼저)
  const thisWeek = deadlineItems.filter(it => {
    if (!it.deadline) return false
    const d = new Date(it.deadline); d.setHours(0,0,0,0)
    return d <= weekLater
  }).sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1  // 미완료 먼저
    return a.deadline.localeCompare(b.deadline)
  })

  // 다음 할 일 — 이번주 이후 미완료 항목 중 가장 빠른 3개
  const upcoming = deadlineItems.filter(it => {
    if (!it.deadline || it.completed) return false
    const d = new Date(it.deadline); d.setHours(0,0,0,0)
    return d > weekLater
  }).sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 3)

  if (thisWeek.length === 0 && upcoming.length === 0) return null

  const incomplete = thisWeek.filter(it => !it.completed).length

  function DayBadge({ deadline }: { deadline: string }) {
    const d = new Date(deadline); d.setHours(0,0,0,0)
    const diff = Math.ceil((d.getTime() - today.getTime()) / 86400000)
    const isOverdue = diff < 0
    return (
      <span style={{
        fontSize: 11, fontWeight: 700, flexShrink: 0,
        color: isOverdue ? '#e03060' : diff === 0 ? 'var(--pk)' : '#f59e0b',
        background: isOverdue ? '#ffe0ea' : diff === 0 ? 'var(--pk5)' : '#fef3c7',
        borderRadius: 8, padding: '2px 8px',
      }}>
        {isOverdue ? `D+${Math.abs(diff)}` : diff === 0 ? 'D-DAY' : `D-${diff}`}
      </span>
    )
  }

  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '2px solid var(--pk)', marginBottom: 12, overflow: 'hidden' }}>
      {/* ── 헤더 ── */}
      <div style={{ background: 'linear-gradient(135deg,var(--pk),var(--mn))', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 14 }}>🔔</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>이번주 해야 할 일</span>
        {incomplete > 0
          ? <span style={{ background: 'rgba(255,255,255,.25)', color: '#fff', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>{incomplete}개 남음</span>
          : <span style={{ background: 'rgba(255,255,255,.25)', color: '#fff', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>✓ 완료</span>
        }
      </div>

      {/* ── 이번주 항목 ── */}
      {thisWeek.length > 0 && (
        <div style={{ padding: '8px 12px' }}>
          {thisWeek.map((it, idx) => (
            <div
              key={it.itemId}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 4px',
                borderBottom: idx < thisWeek.length - 1 ? '1px solid var(--gray1)' : 'none',
                opacity: it.completed ? 0.55 : 1,
                transition: 'opacity .2s',
              }}
            >
              <input
                type='checkbox'
                checked={it.completed}
                onChange={() => onToggle(it.stageId, it.itemId, it.isCustom)}
                style={{ width: 16, height: 16, accentColor: 'var(--pk)', cursor: 'pointer', flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: 'var(--text)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  textDecoration: it.completed ? 'line-through' : 'none',
                }}>
                  {it.title}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 1 }}>{it.stageName}</div>
              </div>
              {it.completed
                ? <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gr,#06d6a0)', background: '#e8fdf5', borderRadius: 8, padding: '2px 8px', flexShrink: 0 }}>완료</span>
                : <DayBadge deadline={it.deadline} />
              }
            </div>
          ))}
        </div>
      )}

      {/* ── 다음 할 일 ── */}
      {upcoming.length > 0 && (
        <>
          <div style={{ padding: '6px 16px', background: 'var(--gray1)', fontSize: 10, fontWeight: 700, color: 'var(--text2)', letterSpacing: '0.05em' }}>
            다음 할 일
          </div>
          <div style={{ padding: '6px 12px 10px' }}>
            {upcoming.map((it, idx) => (
              <div
                key={it.itemId}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '6px 4px',
                  borderBottom: idx < upcoming.length - 1 ? '1px solid var(--gray1)' : 'none',
                }}
              >
                <input
                  type='checkbox'
                  checked={it.completed}
                  onChange={() => onToggle(it.stageId, it.itemId, it.isCustom)}
                  style={{ width: 15, height: 15, accentColor: 'var(--pk)', cursor: 'pointer', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.title}</div>
                  <div style={{ fontSize: 10, color: 'var(--gray3)', marginTop: 1 }}>{it.stageName}</div>
                </div>
                <DayBadge deadline={it.deadline} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function MonthTimeline({ weddingDate, checklist }: { weddingDate: string; checklist: Record<string, any> }) {
  if (!weddingDate) return (
    <div style={{ background: 'rgba(255,255,255,.15)', borderRadius: 10, padding: '10px 14px', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,.7)', marginTop: 8 }}>
      결혼 예정일 설정 시 월별 타임라인이 표시됩니다
    </div>
  )

  const weddingMs = new Date(weddingDate).getTime()
  const now = new Date()
  const wY = new Date(weddingDate).getFullYear()
  const wM = new Date(weddingDate).getMonth()

  const months: Array<{ y: number; m: number; total: number; done: number }> = []
  const cur = new Date(weddingMs - 365 * 86400000)
  cur.setDate(1)
  const endDate = new Date(weddingMs + 60 * 86400000)

  while (cur <= endDate) {
    const y = cur.getFullYear(), m = cur.getMonth()
    let total = 0, done = 0
    CHECKLIST_STAGES.forEach(stage => {
      stage.items.forEach(item => {
        const days = parseDaysBefore(item.time)
        if (days === null) return
        const d = new Date(weddingMs - days * 86400000)
        if (d.getFullYear() === y && d.getMonth() === m) {
          const stg = checklist[stage.id]
          const it = stg?.items?.find((i: any) => i.id === item.id)
          if (it && !it.hidden) { total++; if (it.completed) done++ }
        }
      })
    })
    months.push({ y, m, total, done })
    cur.setMonth(cur.getMonth() + 1)
  }

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 4, marginTop: 10 }}>
      <div style={{ display: 'flex', gap: 5, minWidth: 'max-content' }}>
        {months.map(({ y, m, total, done }, idx) => {
          const isCur = y === now.getFullYear() && m === now.getMonth()
          const isWed = y === wY && m === wM
          const pct = total > 0 ? Math.round(done / total * 100) : -1
          return (
            <div key={idx} style={{
              minWidth: 52, textAlign: 'center', borderRadius: 8, padding: '6px 4px',
              background: isWed ? '#fff' : isCur ? 'rgba(255,255,255,.28)' : 'rgba(255,255,255,.1)',
              border: isCur ? '1.5px solid rgba(255,255,255,.5)' : 'none',
            }}>
              <div style={{ fontSize: 9, marginBottom: 2, color: isWed ? 'var(--pk)' : 'rgba(255,255,255,.8)' }}>
                {String(y).slice(2)}.{String(m + 1).padStart(2, '0')}
              </div>
              {isWed ? (
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--pk)', lineHeight: 1.4 }}>💍<br />D-DAY</div>
              ) : pct >= 0 ? (
                <>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{pct}%</div>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,.65)', marginTop: 1 }}>{done}/{total}</div>
                  <div style={{ height: 3, background: 'rgba(255,255,255,.25)', borderRadius: 2, marginTop: 3 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? '#a8ffb0' : '#fff', borderRadius: 2 }} />
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)' }}>—</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
