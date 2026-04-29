import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { CHECKLIST_STAGES } from '../data/checklistSeed'
import { AnalyticsService } from '../services/analytics'
import { MiniCalendar, WeeklyTasks, MonthTimeline, getDDayLabel } from '../components/ChecklistWidgets'
import type { DeadlineItem } from '../components/ChecklistWidgets'
import type { ChecklistSeedItem } from '../types'

export default function ChecklistPage() {
  const userData = useAuthStore(s => s.userData)!
  const setUserData = useAuthStore(s => s.setUserData)
  const saveUserData = useAuthStore(s => s.saveUserData)
  const [openStages, setOpenStages] = useState<Record<string, boolean>>({})
  const [dateMode, setDateMode] = useState<'calendar' | 'text'>('calendar')

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

  const deadlineInput = (stageId: string, itemId: string, value: string, isCustom: boolean) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 28, paddingBottom: 5, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 10, color: 'var(--text2)', flexShrink: 0 }}>목표기한</span>
      <input
        type={dateMode === 'calendar' ? 'date' : 'text'}
        value={value || ''}
        onChange={e => setDeadline(stageId, itemId, e.target.value, isCustom)}
        placeholder={dateMode === 'text' ? 'YYYY-MM-DD' : ''}
        style={{ fontSize: 11, border: '1px solid var(--gray2)', borderRadius: 6, padding: '3px 8px', color: 'var(--text)', background: 'var(--pk5)', outline: 'none', maxWidth: 140 }}
      />
      {value && <span style={{ fontSize: 10, color: 'var(--pk)', fontWeight: 700, flexShrink: 0 }}>{getDDayLabel(value)}</span>}
    </div>
  )

  return (
    <div>
      {/* Header with timeline */}
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

      {/* Mini calendar with deadlines */}
      <MiniCalendar deadlineItems={deadlineItems} />

      {/* This week's tasks */}
      <WeeklyTasks deadlineItems={deadlineItems} onToggle={toggleItem} />

      {/* Date mode toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <button
          onClick={() => setDateMode(m => m === 'calendar' ? 'text' : 'calendar')}
          style={{ background: 'var(--pk5)', border: '1.5px solid var(--pk4)', borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 600, color: 'var(--pk)', cursor: 'pointer' }}
        >
          기한 입력: {dateMode === 'calendar' ? '📅 달력' : '✏️ 직접입력'}
        </button>
      </div>

      {/* Stages */}
      {CHECKLIST_STAGES.map((stage, stageIdx) => {
        const stgData = userData.checklist[stage.id]; if (!stgData) return null
        const visibleItems = stgData.items.filter(it => !it.hidden && stage.items.find(s => s.id === it.id))
        const customItems = stgData.customItems
        const stageDone = visibleItems.filter(it => it.completed).length + customItems.filter(it => it.completed).length
        const stageTotal = visibleItems.length + customItems.length
        const stagePct = stageTotal > 0 ? Math.round(stageDone / stageTotal * 100) : 0
        const isOpen = openStages[stage.id] !== false

        return (
          <div key={stage.id} style={{ background: '#fff', borderRadius: 14, marginBottom: 10, boxShadow: '0 4px 20px rgba(255,107,157,.1)', overflow: 'hidden', border: '1.5px solid var(--pk4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleStage(stage.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 800, flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--pk)', fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap' }}>Step {stageIdx + 1}.</span>
                <span>{stage.name}</span>
                <span style={{ background: 'var(--pk5)', color: 'var(--pk)', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>{stageDone}/{stageTotal} ({stagePct}%)</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text2)', transform: isOpen ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: '.2s', flexShrink: 0 }}>▼</span>
            </div>

            {isOpen && (
              <div style={{ padding: '0 12px 10px' }}>
                {visibleItems.map(it => {
                  const seed = stage.items.find(s => s.id === it.id)!
                  return (
                    <div key={it.id} style={{ borderBottom: '1px solid var(--gray1)', paddingTop: 8, paddingBottom: 4, marginBottom: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 6, paddingRight: 4, paddingBottom: 3 }}>
                        <input type='checkbox' checked={it.completed} onChange={() => toggleItem(stage.id, it.id, false)} style={{ width: 18, height: 18, accentColor: 'var(--pk)', cursor: 'pointer', flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: 13, textDecoration: it.completed ? 'line-through' : 'none', color: it.completed ? 'var(--text2)' : 'var(--text)' }}>{seed.title}</span>
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, fontWeight: 700, flexShrink: 0, ...(seed.req === '필수' ? { background: '#ffe0ea', color: '#e03060' } : { background: '#e8f4ff', color: '#4a80ee' }) }}>{seed.req}</span>
                        <button onClick={() => setInfoItem(seed)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: '2px 4px', color: 'var(--text2)', flexShrink: 0 }}>ℹ️</button>
                      </div>
                      {deadlineInput(stage.id, it.id, it.deadline || '', false)}
                    </div>
                  )
                })}

                {customItems.map(it => (
                  <div key={it.id} style={{ borderBottom: '1px solid var(--gray1)', paddingTop: 8, paddingBottom: 4, marginBottom: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 6, paddingRight: 4, paddingBottom: 3 }}>
                      <input type='checkbox' checked={it.completed} onChange={() => toggleItem(stage.id, it.id, true)} style={{ width: 18, height: 18, accentColor: 'var(--pk)', cursor: 'pointer', flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13, textDecoration: it.completed ? 'line-through' : 'none', color: it.completed ? 'var(--text2)' : 'var(--text)' }}>{it.title}</span>
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, fontWeight: 700, background: '#f0e8ff', color: '#8a4a9e', flexShrink: 0 }}>커스텀</span>
                      <button onClick={() => delCustomItem(stage.id, it.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: '2px 4px', color: 'var(--pk3)', flexShrink: 0 }}>🗑️</button>
                    </div>
                    {deadlineInput(stage.id, it.id, it.deadline || '', true)}
                  </div>
                ))}

                <div style={{ display: 'flex', gap: 8, marginTop: 10, paddingLeft: 6 }}>
                  <input style={{ flex: 1, border: '1.5px solid var(--gray2)', borderRadius: 8, padding: '8px 10px', fontSize: 13, outline: 'none', background: 'var(--pk5)' }} placeholder='항목 추가...' value={addInputs[stage.id] || ''} onChange={e => setAddInputs(prev => ({ ...prev, [stage.id]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && addCustomItem(stage.id)} />
                  <button onClick={() => addCustomItem(stage.id)} style={{ background: 'var(--pk)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>추가</button>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {infoItem && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setInfoItem(null)}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 24, width: 320, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>{infoItem.title}</div>
            {([['필수여부', infoItem.req], ['우선순위', infoItem.pri], ['예상비용', infoItem.cost], ['타임라인', infoItem.time], ['메모', infoItem.note]] as [string, string][]).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13 }}><span style={{ color: 'var(--text2)', minWidth: 70, fontWeight: 600 }}>{k}</span><span>{v}</span></div>
            ))}
            <button onClick={() => setInfoItem(null)} style={{ width: '100%', marginTop: 14, background: 'var(--pk)', color: '#fff', border: 'none', borderRadius: 10, padding: 11, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>닫기</button>
          </div>
        </div>
      )}
    </div>
  )
}
