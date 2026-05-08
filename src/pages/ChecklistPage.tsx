import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../stores/authStore'
import { CHECKLIST_STAGES } from '../data/checklistSeed'
import { AnalyticsService } from '../services/analytics'
import { MiniCalendar, WeeklyTasks, MonthTimeline, getDDayLabel } from '../components/ChecklistWidgets'
import type { DeadlineItem } from '../components/ChecklistWidgets'
import type { ChecklistSeedItem } from '../types'
import ConfettiCelebration from '../components/ConfettiCelebration'
import BannerAd from '../components/ads/BannerAd'

// 스테이지별 이모지
const STAGE_EMOJIS: Record<string, string> = {
  s1: '💍', s2: '🤝', s3: '💰', s4: '💒',
  s5: '🏠', s6: '✈️', s7: '🎉', s8: '👰', s9: '✅',
}

export default function ChecklistPage() {
  const userData = useAuthStore(s => s.userData)!
  const setUserData = useAuthStore(s => s.setUserData)
  const saveUserData = useAuthStore(s => s.saveUserData)
  const [openStages, setOpenStages] = useState<Record<string, boolean>>({})
  const [showDone, setShowDone] = useState<Record<string, boolean>>({})   // 완료 항목 펼침 여부
  const [dateMode, setDateMode] = useState<'calendar' | 'text'>('calendar')
  const [showConfetti, setShowConfetti] = useState(false)
  const prevPct = useRef<number | null>(null)

  useEffect(() => {
    const cl = JSON.parse(JSON.stringify(userData.checklist)) as typeof userData.checklist
    let changed = false
    CHECKLIST_STAGES.forEach(stage => {
      if (!cl[stage.id]) { cl[stage.id] = { items: [], customItems: [] }; changed = true }
      stage.items.forEach(seedItem => {
        if (!cl[stage.id].items.find(it => it.id === seedItem.id)) {
          cl[stage.id].items.push({ id: seedItem.id, completed: false, hidden: false })
          changed = true
        }
      })
      const validIds = new Set(stage.items.map(s => s.id))
      const before = cl[stage.id].items.length
      cl[stage.id].items = cl[stage.id].items.filter(it => validIds.has(it.id))
      if (cl[stage.id].items.length !== before) changed = true
    })
    if (changed) { setUserData({ ...userData, checklist: cl }); saveUserData() }
  }, []) // eslint-disable-line

  const [infoItem, setInfoItem] = useState<ChecklistSeedItem | null>(null)
  const [addInputs, setAddInputs] = useState<Record<string, string>>({})

  let total = 0, done = 0
  CHECKLIST_STAGES.forEach(s => {
    const stg = userData.checklist[s.id]; if (!stg) return
    stg.items.forEach(it => { if (!it.hidden && s.items.find(sd => sd.id === it.id)) { total++; if (it.completed) done++ } })
    stg.customItems.forEach(it => { total++; if (it.completed) done++ })
  })
  const pct = total > 0 ? Math.round(done / total * 100) : 0

  useEffect(() => {
    if (prevPct.current !== null && prevPct.current < 100 && pct === 100 && total > 0) {
      setShowConfetti(true)
    }
    prevPct.current = pct
  }, [pct, total])

  const deadlineItems: DeadlineItem[] = []
  CHECKLIST_STAGES.forEach(stage => {
    const stg = userData.checklist[stage.id]; if (!stg) return
    stg.items.forEach((it: any) => {
      if (!it.deadline || it.hidden) return
      const seed = stage.items.find(s => s.id === it.id); if (!seed) return
      deadlineItems.push({ stageId: stage.id, itemId: it.id, title: seed.title, deadline: it.deadline, completed: it.completed, isCustom: false, stageName: stage.name })
    })
    stg.customItems.forEach((it: any) => {
      if (!it.deadline) return
      deadlineItems.push({ stageId: stage.id, itemId: it.id, title: it.title, deadline: it.deadline, completed: it.completed, isCustom: true, stageName: stage.name })
    })
  })

  function toggleStage(id: string) {
    AnalyticsService.track(`checklist:${id}`)
    setOpenStages(prev => ({ ...prev, [id]: !(prev[id] ?? true) }))
  }

  function toggleItem(stageId: string, itemId: string, isCustom: boolean) {
    const cl = JSON.parse(JSON.stringify(userData.checklist)) as typeof userData.checklist
    const stg = cl[stageId]
    if (isCustom) { const it = stg.customItems.find(i => i.id === itemId); if (it) it.completed = !it.completed }
    else { const it = stg.items.find(i => i.id === itemId); if (it) it.completed = !it.completed }
    setUserData({ ...userData, checklist: cl }); saveUserData()
  }

  function setDeadline(stageId: string, itemId: string, deadline: string, isCustom: boolean) {
    const cl = JSON.parse(JSON.stringify(userData.checklist)) as typeof userData.checklist
    const stg = cl[stageId]
    if (isCustom) { const it = stg.customItems.find(i => i.id === itemId); if (it) it.deadline = deadline }
    else { const it = stg.items.find(i => i.id === itemId); if (it) it.deadline = deadline }
    setUserData({ ...userData, checklist: cl }); saveUserData()
  }

  function addCustomItem(stageId: string) {
    const title = (addInputs[stageId] || '').trim(); if (!title) return
    const cl = JSON.parse(JSON.stringify(userData.checklist)) as typeof userData.checklist
    cl[stageId].customItems.push({ id: 'c' + Date.now(), title, completed: false })
    setUserData({ ...userData, checklist: cl }); saveUserData()
    setAddInputs(prev => ({ ...prev, [stageId]: '' }))
  }

  function delCustomItem(stageId: string, itemId: string) {
    const cl = JSON.parse(JSON.stringify(userData.checklist)) as typeof userData.checklist
    cl[stageId].customItems = cl[stageId].customItems.filter(i => i.id !== itemId)
    setUserData({ ...userData, checklist: cl }); saveUserData()
  }

  // ── 날짜 칩 렌더링 (인라인, 한 줄) ──────────────────────────────
  const deadlineChip = (stageId: string, itemId: string, value: string, isCustom: boolean) => {
    const ddayLabel = value ? getDDayLabel(value) : ''
    const isUrgent = value ? (() => {
      const diff = Math.ceil((new Date(value).getTime() - Date.now()) / 86400000)
      return diff <= 7
    })() : false

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, flexWrap: 'wrap' }}>
        {/* 날짜 입력 — chip 스타일 */}
        <label style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          background: 'var(--pk5)', border: '1px solid var(--pk4)',
          borderRadius: 6, padding: '2px 8px',
          fontSize: 11, color: 'var(--text2)', cursor: 'pointer',
        }}>
          <span>📅</span>
          <input
            type={dateMode === 'calendar' ? 'date' : 'text'}
            value={value || ''}
            onChange={e => setDeadline(stageId, itemId, e.target.value, isCustom)}
            placeholder={dateMode === 'text' ? 'YYYY-MM-DD' : ''}
            style={{
              border: 'none', background: 'transparent', outline: 'none',
              fontSize: 11, color: 'var(--text2)', width: value ? 'auto' : 80,
              minWidth: 0,
            }}
          />
        </label>
        {/* D-day 뱃지 */}
        {ddayLabel && (
          <span style={{
            background: isUrgent ? 'var(--or)' : 'var(--pk)',
            color: '#fff', borderRadius: 20, padding: '1px 8px',
            fontSize: 10, fontWeight: 700, flexShrink: 0,
          }}>
            {ddayLabel}
          </span>
        )}
      </div>
    )
  }

  return (
    <div>
      {showConfetti && (
        <ConfettiCelebration onClose={() => { setShowConfetti(false) }} />
      )}

      {/* ── 상단 진척 배너 ── */}
      <div style={{ background: 'linear-gradient(135deg,var(--pk),var(--mn))', borderRadius: 14, padding: '16px 16px 14px', marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{pct}%</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.8)', marginTop: 3 }}>{done}개 완료 · 전체 {total}개</div>
          </div>
          <div style={{ textAlign: 'right', color: 'rgba(255,255,255,.85)', fontSize: 12 }}>
            <div style={{ fontSize: 11, marginBottom: 2 }}>남은 항목</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{total - done}개</div>
          </div>
        </div>
        <div style={{ height: 8, background: 'rgba(255,255,255,.25)', borderRadius: 4, marginBottom: 4 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: '#fff', borderRadius: 4, transition: 'width .5s' }} />
        </div>
        <MonthTimeline weddingDate={userData.weddingDate} checklist={userData.checklist} />
      </div>

      {/* ── 미니 캘린더 ── */}
      <MiniCalendar deadlineItems={deadlineItems} />

      {/* ── 이번주 할 일 ── */}
      <WeeklyTasks deadlineItems={deadlineItems} onToggle={toggleItem} />

      {/* ── 기한 입력 방식 토글 ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <button
          onClick={() => setDateMode(m => m === 'calendar' ? 'text' : 'calendar')}
          style={{ background: 'var(--pk5)', border: '1.5px solid var(--pk4)', borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 600, color: 'var(--pk)', cursor: 'pointer' }}
        >
          기한 입력: {dateMode === 'calendar' ? '📅 달력' : '✏️ 직접입력'}
        </button>
      </div>

      {/* ── 스테이지 목록 ── */}
      {CHECKLIST_STAGES.map(stage => {
        const stgData = userData.checklist[stage.id]; if (!stgData) return null
        const visibleItems = stgData.items.filter(it => !it.hidden && stage.items.find(s => s.id === it.id))
        const customItems = stgData.customItems

        // 미완료 / 완료 분리
        const pendingItems  = visibleItems.filter(it => !it.completed)
        const doneItems     = visibleItems.filter(it => it.completed)
        const pendingCustom = customItems.filter(it => !it.completed)
        const doneCustom    = customItems.filter(it => it.completed)

        const stageDone  = doneItems.length + doneCustom.length
        const stageTotal = visibleItems.length + customItems.length
        const stagePct   = stageTotal > 0 ? Math.round(stageDone / stageTotal * 100) : 0
        const isOpen     = openStages[stage.id] !== false
        const isDoneOpen = showDone[stage.id] === true
        const emoji      = STAGE_EMOJIS[stage.id] ?? '📋'

        return (
          <div key={stage.id} style={{ background: '#fff', borderRadius: 14, marginBottom: 10, boxShadow: '0 4px 20px rgba(255,107,157,.08)', overflow: 'hidden', border: '1.5px solid var(--pk4)' }}>

            {/* ── 스테이지 헤더 ── */}
            <div
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', cursor: 'pointer', userSelect: 'none' }}
              onClick={() => toggleStage(stage.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 800 }}>
                <span style={{ fontSize: 16 }}>{emoji}</span>
                <span>{stage.name}</span>
                <span style={{ background: 'var(--pk5)', color: 'var(--pk)', borderRadius: 20, padding: '2px 9px', fontSize: 11, fontWeight: 700 }}>
                  {stageDone}/{stageTotal}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 11, color: 'var(--pk)', fontWeight: 700 }}>{stagePct}%</span>
                <span style={{ fontSize: 11, color: 'var(--text2)', transform: isOpen ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: '.2s' }}>▼</span>
              </div>
            </div>

            {/* ── 스테이지 진행 바 ── */}
            <div style={{ height: 3, background: 'var(--pk4)', margin: '0 16px', borderRadius: 2, marginBottom: isOpen ? 10 : 12 }}>
              <div style={{ height: '100%', width: `${stagePct}%`, background: 'linear-gradient(90deg,var(--pk),var(--mn))', borderRadius: 2, transition: 'width .5s' }} />
            </div>

            {isOpen && (
              <>
                {/* ── 미완료 항목 ── */}
                {pendingItems.map(it => {
                  const seed = stage.items.find(s => s.id === it.id)!
                  return (
                    <div key={it.id} style={{ borderTop: '1px solid var(--gray1)', padding: '9px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      {/* 체크박스 */}
                      <div
                        onClick={() => toggleItem(stage.id, it.id, false)}
                        style={{ width: 20, height: 20, borderRadius: 5, border: '2px solid var(--pk3)', background: '#fff', flexShrink: 0, marginTop: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      />
                      {/* 내용 */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4 }}>{seed.title}</div>
                        {deadlineChip(stage.id, it.id, it.deadline || '', false)}
                      </div>
                      {/* ⓘ 버튼 */}
                      <button
                        onClick={() => setInfoItem(seed)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--pk3)', flexShrink: 0, padding: '0 0 0 2px', alignSelf: 'center', lineHeight: 1 }}
                      >ⓘ</button>
                    </div>
                  )
                })}

                {/* ── 미완료 커스텀 항목 ── */}
                {pendingCustom.map(it => (
                  <div key={it.id} style={{ borderTop: '1px solid var(--gray1)', padding: '9px 14px', display: 'flex', alignItems: 'flex-start', gap: 10, background: '#fdfaff' }}>
                    <div
                      onClick={() => toggleItem(stage.id, it.id, true)}
                      style={{ width: 20, height: 20, borderRadius: 5, border: '2px solid var(--mn)', background: '#fff', flexShrink: 0, marginTop: 1, cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4 }}>{it.title}</div>
                      {deadlineChip(stage.id, it.id, it.deadline || '', true)}
                    </div>
                    <button
                      onClick={() => delCustomItem(stage.id, it.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--pk3)', flexShrink: 0, padding: '0 0 0 2px', alignSelf: 'center' }}
                    >🗑</button>
                  </div>
                ))}

                {/* ── 완료 항목 토글 ── */}
                {stageDone > 0 && (
                  <>
                    <div
                      onClick={() => setShowDone(prev => ({ ...prev, [stage.id]: !prev[stage.id] }))}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'var(--gray1)', cursor: 'pointer', borderTop: '1px solid var(--pk4)' }}
                    >
                      <span style={{ fontSize: 10, color: 'var(--text2)', transition: 'transform .2s', display: 'inline-block', transform: isDoneOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
                      <span style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600 }}>완료된 항목 {stageDone}개 {isDoneOpen ? '접기' : '보기'}</span>
                    </div>

                    {isDoneOpen && (
                      <>
                        {doneItems.map(it => {
                          const seed = stage.items.find(s => s.id === it.id)!
                          return (
                            <div key={it.id} style={{ borderTop: '1px solid var(--gray1)', padding: '8px 14px', display: 'flex', alignItems: 'flex-start', gap: 10, opacity: 0.6 }}>
                              <div
                                onClick={() => toggleItem(stage.id, it.id, false)}
                                style={{ width: 20, height: 20, borderRadius: 5, border: '2px solid var(--pk)', background: 'var(--pk)', flexShrink: 0, marginTop: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <span style={{ color: '#fff', fontSize: 11, fontWeight: 900, lineHeight: 1 }}>✓</span>
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', textDecoration: 'line-through', lineHeight: 1.4 }}>{seed.title}</div>
                                {it.deadline && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                                    <span style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 6, padding: '2px 8px', fontSize: 11, color: 'var(--gray3)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                      📅 {it.deadline}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => setInfoItem(seed)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--pk4)', flexShrink: 0, padding: '0 0 0 2px', alignSelf: 'center', lineHeight: 1 }}
                              >ⓘ</button>
                            </div>
                          )
                        })}
                        {doneCustom.map(it => (
                          <div key={it.id} style={{ borderTop: '1px solid var(--gray1)', padding: '8px 14px', display: 'flex', alignItems: 'flex-start', gap: 10, opacity: 0.6, background: '#fdfaff' }}>
                            <div
                              onClick={() => toggleItem(stage.id, it.id, true)}
                              style={{ width: 20, height: 20, borderRadius: 5, border: '2px solid var(--mn)', background: 'var(--mn)', flexShrink: 0, marginTop: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <span style={{ color: '#fff', fontSize: 11, fontWeight: 900, lineHeight: 1 }}>✓</span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', textDecoration: 'line-through', lineHeight: 1.4 }}>{it.title}</div>
                            </div>
                            <button
                              onClick={() => delCustomItem(stage.id, it.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--pk3)', flexShrink: 0, padding: '0 0 0 2px', alignSelf: 'center' }}
                            >🗑</button>
                          </div>
                        ))}
                      </>
                    )}
                  </>
                )}

                {/* ── 항목 추가 ── */}
                <div style={{ display: 'flex', gap: 8, padding: '10px 14px', background: 'var(--pk5)', borderTop: '1px solid var(--pk4)' }}>
                  <input
                    style={{ flex: 1, border: '1.5px solid var(--pk4)', borderRadius: 8, padding: '7px 10px', fontSize: 12, outline: 'none', background: '#fff', color: 'var(--text)' }}
                    placeholder='항목 추가...'
                    value={addInputs[stage.id] || ''}
                    onChange={e => setAddInputs(prev => ({ ...prev, [stage.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && addCustomItem(stage.id)}
                  />
                  <button
                    onClick={() => addCustomItem(stage.id)}
                    style={{ background: 'var(--pk)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    + 추가
                  </button>
                </div>
              </>
            )}
          </div>
        )
      })}

      {/* ── ⓘ 정보 팝업 ── */}
      {infoItem && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setInfoItem(null)}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 24, width: 320, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>{infoItem.title}</div>
            {([['필수여부', infoItem.req], ['우선순위', infoItem.pri], ['예상비용', infoItem.cost], ['타임라인', infoItem.time], ['메모', infoItem.note]] as [string, string][]).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: 'var(--text2)', minWidth: 70, fontWeight: 600 }}>{k}</span>
                <span>{v}</span>
              </div>
            ))}
            <button onClick={() => setInfoItem(null)} style={{ width: '100%', marginTop: 14, background: 'var(--pk)', color: '#fff', border: 'none', borderRadius: 10, padding: 11, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>닫기</button>
          </div>
        </div>
      )}

      {/* 배너 광고 */}
      <BannerAd />
    </div>
  )
}
