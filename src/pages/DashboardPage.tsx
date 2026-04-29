import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { CHECKLIST_STAGES } from '../data/checklistSeed'
import { BoardService } from '../services/boardService'
import { MiniCalendar, WeeklyTasks, MonthTimeline } from '../components/ChecklistWidgets'
import type { DeadlineItem } from '../components/ChecklistWidgets'
import type { CalcState, Post } from '../types'
import TourOverlay from '../components/onboarding/TourOverlay'

function fmt(n: number) { return n.toLocaleString('ko-KR') }

function calcTotal(cs: CalcState, isWedding = false): number {
  let t = 0
  if (isWedding) {
    const effectivePrice = cs.mealPrice === 0 ? (cs.mealCustom || 0) : cs.mealPrice
    t += cs._mealTotal ?? Math.round((cs.mealCount * effectivePrice) / 10000)
    t += cs.venueDirect ?? 0
  }
  Object.values(cs.cats).forEach(cat => {
    cat.defItems.forEach(it => { if (!it.deleted && it.checked) { const v = parseInt(it.customVal) || 0; t += v > 0 ? v : (it.avg || 0) } })
    cat.customItems.forEach(it => { if (it.checked) t += it.price || 0 })
  })
  return t
}

function GuestPopup({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: 290, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>💾</div>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>저장 불가</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 18 }}>게스트 모드에서는 데이터가<br/>저장되지 않아요.<br/>닉네임으로 로그인 후 이용해주세요.</div>
        <button onClick={onClose} style={{ width: '100%', background: 'var(--pk)', color: '#fff', border: 'none', borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>확인</button>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const userData = useAuthStore(s => s.userData)!
  const setUserData = useAuthStore(s => s.setUserData)
  const saveUserData = useAuthStore(s => s.saveUserData)
  const isGuest = user?.nick === '게스트'

  const [weddingDate, setWeddingDate] = useState(userData.weddingDate || '')
  const [dateMode, setDateMode] = useState<'calendar' | 'manual'>('calendar')
  const [saved, setSaved] = useState(false)
  const [guestPopup, setGuestPopup] = useState(false)
  const [recentPosts, setRecentPosts] = useState<Post[]>([])
  const [showTour, setShowTour] = useState(false)

  useEffect(() => {
    const posts = BoardService.getPosts()
    setRecentPosts(posts.slice(0, 4))
  }, [])

  const GUEST_SKIP_KEY = 'ws_guest_tour_skip'

  useEffect(() => {
    if (!isGuest && userData.hasSeenTour === false) {
      const t = setTimeout(() => setShowTour(true), 600)
      return () => clearTimeout(t)
    }
    if (isGuest) {
      const until = localStorage.getItem(GUEST_SKIP_KEY)
      if (!until || Date.now() > parseInt(until)) {
        const t = setTimeout(() => setShowTour(true), 600)
        return () => clearTimeout(t)
      }
    }
  }, [isGuest, userData.hasSeenTour])

  function completeTour() {
    setShowTour(false)
    if (!isGuest) {
      setUserData({ ...userData, hasSeenTour: true })
      saveUserData()
    }
  }

  function skipTourWeek() {
    localStorage.setItem(GUEST_SKIP_KEY, String(Date.now() + 7 * 24 * 60 * 60 * 1000))
    setShowTour(false)
  }

  let total = 0, done = 0
  CHECKLIST_STAGES.forEach(s => {
    const stg = userData.checklist[s.id]; if (!stg) return
    stg.items.forEach(it => { if (!it.hidden) { total++; if (it.completed) done++ } })
    stg.customItems.forEach(it => { total++; if (it.completed) done++ })
  })
  const pct = total > 0 ? Math.round(done / total * 100) : 0
  const honeymoonTotal = userData.honeymoonPlan
    ? userData.honeymoonPlan.days.reduce((s, d) => s + d.items.reduce((ss, it) => ss + (it.amount || 0), 0), 0)
    : calcTotal(userData.calcHoneymoon)
  const honeymoonBudget = userData.honeymoonPlan?.budget || userData.calcHoneymoon.budget || 0
  const expected = calcTotal(userData.calcWedding, true) + honeymoonTotal + calcTotal(userData.calcHouse)
  const budget = (userData.calcWedding.budget || 0) + honeymoonBudget + (userData.calcHouse.budget || 0)
  const diff = budget - expected

  const ddayMs = weddingDate ? new Date(weddingDate).getTime() - Date.now() : null
  const dday = ddayMs !== null ? Math.ceil(ddayMs / 86400000) : null

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

  function toggleItem(stageId: string, itemId: string, isCustom: boolean) {
    const cl = JSON.parse(JSON.stringify(userData.checklist)) as typeof userData.checklist
    const stg = cl[stageId]
    if (isCustom) { const it = stg.customItems.find((i: any) => i.id === itemId); if (it) it.completed = !it.completed }
    else { const it = stg.items.find((i: any) => i.id === itemId); if (it) it.completed = !it.completed }
    setUserData({ ...userData, checklist: cl }); saveUserData()
  }

  function save() {
    if (isGuest) { setGuestPopup(true); return }
    setUserData({ ...userData, weddingDate })
    saveUserData()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      {guestPopup && <GuestPopup onClose={() => setGuestPopup(false)} />}
      {showTour && <TourOverlay onComplete={completeTour} onSkipWeek={isGuest ? skipTourWeek : undefined} />}

      {/* Wedding date + D-DAY */}
      <div data-tour="wedding-date" style={{ background: 'linear-gradient(135deg,var(--pk),var(--mn))', borderRadius: 14, padding: '20px', color: '#fff', marginBottom: 14, boxShadow: '0 6px 24px rgba(255,107,157,.3)' }}>
        {dday !== null ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'stretch', marginBottom: 16 }}>
            <div style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,.15)', borderRadius: 12, padding: '14px 8px' }}>
              <div style={{ fontSize: 11, opacity: .8, marginBottom: 4 }}>결혼식까지</div>
              <div style={{ fontSize: 44, fontWeight: 900, lineHeight: 1 }}>
                {dday > 0 ? `D-${dday}` : dday === 0 ? 'D-DAY' : `D+${Math.abs(dday)}`}
              </div>
              <div style={{ fontSize: 12, opacity: .75, marginTop: 6 }}>{weddingDate}</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,.15)', borderRadius: 12, padding: '14px 8px' }}>
              <div style={{ fontSize: 11, opacity: .8, marginBottom: 4 }}>결혼 준비 진척률</div>
              <div style={{ fontSize: 44, fontWeight: 900, lineHeight: 1 }}>{pct}%</div>
              <div style={{ fontSize: 12, opacity: .75, marginTop: 6 }}>{done}/{total}개 완료</div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '8px 0 16px', opacity: .85 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>결혼 예정일을 입력해주세요 💍</div>
          </div>
        )}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, opacity: .85, fontWeight: 600 }}>결혼 예정일</span>
            <button
              onClick={() => setDateMode(m => m === 'calendar' ? 'manual' : 'calendar')}
              style={{ background: 'rgba(255,255,255,.25)', border: '1px solid rgba(255,255,255,.4)', color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 11, cursor: 'pointer' }}
            >
              {dateMode === 'calendar' ? '숫자 입력' : '달력 선택'}
            </button>
          </div>
          {dateMode === 'calendar' ? (
            <input type='date' value={weddingDate} onChange={e => setWeddingDate(e.target.value)} style={{ width: '100%', border: 'none', borderRadius: 10, padding: '10px 12px', fontSize: 14, boxSizing: 'border-box', outline: 'none', color: '#333' }} />
          ) : (
            <input type='text' value={weddingDate} onChange={e => setWeddingDate(e.target.value)} placeholder='YYYY-MM-DD (예: 2026-10-10)' style={{ width: '100%', border: 'none', borderRadius: 10, padding: '10px 12px', fontSize: 14, boxSizing: 'border-box', outline: 'none', color: '#333' }} />
          )}
        </div>
        <button onClick={save} style={{ width: '100%', background: saved ? 'rgba(255,255,255,.9)' : '#fff', color: saved ? 'var(--gr)' : 'var(--pk)', border: 'none', borderRadius: 10, padding: '11px 0', fontSize: 14, fontWeight: 800, cursor: 'pointer', transition: 'all .2s' }}>
          {saved ? '저장되었습니다 ✓' : '저장하기'}
        </button>
      </div>

      {/* Checklist progress section */}
      <div data-tour="progress" style={{ background: 'linear-gradient(135deg,var(--pk),var(--mn))', borderRadius: 14, padding: '16px 16px 14px', marginBottom: 14, boxShadow: '0 6px 24px rgba(255,107,157,.2)' }}>
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

      {/* Mini calendar */}
      <MiniCalendar deadlineItems={deadlineItems} />

      {/* This week's tasks */}
      <WeeklyTasks deadlineItems={deadlineItems} onToggle={toggleItem} />

      {/* Budget summary */}
      <div data-tour="budget" style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', borderRadius: 14, padding: '18px 20px', color: '#fff', marginBottom: 14, boxShadow: '0 6px 24px rgba(102,126,234,.25)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, opacity: .85, marginBottom: 12 }}>예산 현황</div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          {[
            { label: '총 예산', val: budget > 0 ? `${fmt(budget)}만원` : '미설정', sub: '' },
            { label: '예상 비용', val: `${fmt(expected)}만원`, sub: '결혼식+신혼여행+신혼집' },
            { label: '차액', val: budget > 0 ? `${diff >= 0 ? '+' : ''}${fmt(diff)}만원` : '-', sub: '', warn: budget > 0 && diff < 0 },
          ].map(({ label, val, sub, warn }) => (
            <div key={label} style={{ flex: 1, background: 'rgba(255,255,255,.15)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, opacity: .8, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: warn ? '#ffd0d0' : '#fff' }}>{val}</div>
              {sub && <div style={{ fontSize: 9, opacity: .7, marginTop: 3 }}>{sub}</div>}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, opacity: .7, textAlign: 'center', marginTop: 4 }}>
          각 계산기에서 목표 예산을 설정하면 여기에 합산됩니다
        </div>
      </div>

      {/* Quick navigation */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        {[
          { path: '/checklist', icon: '✅', label: '전체 일정관리', sub: `${pct}% 완료`, tour: 'nav-checklist' },
          { path: '/calc/wedding', icon: '💒', label: '결혼식 비용 계산기', sub: `${fmt(calcTotal(userData.calcWedding, true))}만원`, tour: 'nav-wedding' },
          { path: '/honeymoon', icon: '✈️', label: '신혼여행 계획', sub: `${fmt(honeymoonTotal)}만원`, tour: undefined },
          { path: '/calc/house', icon: '🏡', label: '신혼집 마련 계획', sub: `${fmt(calcTotal(userData.calcHouse))}만원`, tour: undefined },
        ].map(q => (
          <button key={q.path} data-tour={q.tour} onClick={() => navigate(q.path)} style={{ background: '#fff', border: '1.5px solid var(--pk4)', borderRadius: 14, padding: '14px 12px', textAlign: 'center', cursor: 'pointer', color: 'var(--text)' }}>
            <span style={{ fontSize: 24, display: 'block', marginBottom: 4 }}>{q.icon}</span>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{q.label}</div>
            <div style={{ fontSize: 11, color: 'var(--pk)', marginTop: 3 }}>{q.sub}</div>
          </button>
        ))}
      </div>

      {/* Recent board posts */}
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 4px 20px rgba(255,107,157,.1)', border: '1.5px solid var(--pk4)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--gray1)' }}>
          <span style={{ fontSize: 14, fontWeight: 800 }}>📋 최근 게시글</span>
          <button onClick={() => navigate('/board')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--pk)', fontWeight: 700 }}>전체보기 →</button>
        </div>
        {recentPosts.length === 0 ? (
          <div style={{ padding: '20px 16px', fontSize: 13, color: 'var(--text2)', textAlign: 'center' }}>등록된 게시글이 없어요.</div>
        ) : recentPosts.map((post, idx) => (
          <div key={post.id} onClick={() => navigate('/board')} style={{ padding: '11px 16px', borderBottom: idx < recentPosts.length - 1 ? '1px solid var(--gray1)' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            {post.isNotice && <span style={{ background: 'var(--pk)', color: '#fff', borderRadius: 4, padding: '1px 5px', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>공지</span>}
            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</span>
            <span style={{ fontSize: 11, color: 'var(--text2)', flexShrink: 0 }}>{post.author}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
