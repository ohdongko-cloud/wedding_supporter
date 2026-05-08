import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { CHECKLIST_STAGES } from '../data/checklistSeed'
import { BoardService } from '../services/boardService'
import { WeeklyTasks } from '../components/ChecklistWidgets'
import type { DeadlineItem } from '../components/ChecklistWidgets'
import type { CalcState, Post } from '../types'
import OnboardingWizard, { type OnboardingResult } from '../components/OnboardingWizard'
import { ChecklistIcon, RingIcon, PlaneIcon, HouseHeartIcon } from '../components/icons/AppIcons'

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

const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const userData = useAuthStore(s => s.userData)!
  const setUserData = useAuthStore(s => s.setUserData)
  const saveUserData = useAuthStore(s => s.saveUserData)
  const isGuest = user?.nick === '게스트'

  const [weddingDate, setWeddingDate] = useState(userData.weddingDate || '')
  const [dateMode, setDateMode] = useState<'calendar' | 'manual'>('calendar')
  const [dateEditOpen, setDateEditOpen] = useState(!userData.weddingDate)
  const [saved, setSaved] = useState(false)
  const [guestPopup, setGuestPopup] = useState(false)
  const [recentPosts, setRecentPosts] = useState<Post[]>([])
  const [postsLoading, setPostsLoading] = useState(true)
  const [postsError, setPostsError] = useState(false)
  const showOnboarding = !isGuest && userData.hasSeenOnboarding === false

  async function fetchPosts() {
    setPostsLoading(true)
    setPostsError(false)
    try {
      const posts = await BoardService.getPosts()
      setRecentPosts(posts.filter(p => !p.isNotice).slice(0, 5))
    } catch {
      setPostsError(true)
    } finally {
      setPostsLoading(false)
    }
  }

  useEffect(() => { fetchPosts() }, [])

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') fetchPosts() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  function completeOnboarding({ weddingDate: date, budget, weddingStyle, honeymoonType, housingType, destination }: OnboardingResult) {
    // 신혼여행 예산 자동 세팅
    const HONEY_BUDGETS: Record<string, number> = { simple: 200, basic: 450, luxury: 1000 }
    const honeyBudget = honeymoonType ? HONEY_BUDGETS[honeymoonType] : (userData.honeymoonPlan?.budget || 0)

    const updated = {
      ...userData,
      weddingDate: date || userData.weddingDate,
      totalBudget: budget || userData.totalBudget,
      weddingStyle: weddingStyle ?? userData.weddingStyle,
      honeymoonType: honeymoonType ?? userData.honeymoonType,
      housingType: housingType ?? userData.housingType,
      calcWedding: { ...userData.calcWedding, budget: budget || userData.calcWedding.budget },
      honeymoonPlan: userData.honeymoonPlan
        ? { ...userData.honeymoonPlan, budget: honeyBudget || userData.honeymoonPlan.budget }
        : userData.honeymoonPlan,
      // 신혼집 모드 자동 설정
      houseDetail: housingType && userData.houseDetail
        ? { ...userData.houseDetail, mode: housingType }
        : userData.houseDetail,
      hasSeenOnboarding: true,
      hasSeenTour: true,
    }
    setWeddingDate(date || userData.weddingDate)
    setUserData(updated)
    saveUserData()
    if (destination === 'calculator') {
      navigate('/calc/wedding', { state: { fromOnboarding: true, weddingStyle } })
    }
  }

  // ── 체크리스트 통계 ──
  let total = 0, done = 0
  CHECKLIST_STAGES.forEach(s => {
    const stg = userData.checklist[s.id]; if (!stg) return
    stg.items.forEach((it: any) => { if (!it.hidden) { total++; if (it.completed) done++ } })
    stg.customItems.forEach((it: any) => { total++; if (it.completed) done++ })
  })
  const pct = total > 0 ? Math.round(done / total * 100) : 0

  // ── 마감일 항목 수집 ──
  const deadlineItems: DeadlineItem[] = []
  CHECKLIST_STAGES.forEach(stage => {
    const stg = userData.checklist[stage.id]; if (!stg) return
    stg.items.forEach((it: any) => {
      if (!it.deadline || it.hidden) return
      const seed = stage.items.find((s: any) => s.id === it.id); if (!seed) return
      deadlineItems.push({ stageId: stage.id, itemId: it.id, title: seed.title, deadline: it.deadline, completed: it.completed, isCustom: false, stageName: stage.name })
    })
    stg.customItems.forEach((it: any) => {
      if (!it.deadline) return
      deadlineItems.push({ stageId: stage.id, itemId: it.id, title: it.title, deadline: it.deadline, completed: it.completed, isCustom: true, stageName: stage.name })
    })
  })

  // ── 긴급/예정 카운트 (미완료 기준) ──
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const sevenDaysLater = new Date(today); sevenDaysLater.setDate(today.getDate() + 7)
  const thirtyDaysLater = new Date(today); thirtyDaysLater.setDate(today.getDate() + 30)

  let urgentCount = 0, upcomingCount = 0
  deadlineItems.forEach(it => {
    if (it.completed) return
    const d = new Date(it.deadline); d.setHours(0, 0, 0, 0)
    if (d <= sevenDaysLater) urgentCount++       // 7일 이내 + 마감 지난 것 포함
    else if (d <= thirtyDaysLater) upcomingCount++
  })

  // ── 예산 계산 ──
  const honeymoonTotal = userData.honeymoonPlan
    ? userData.honeymoonPlan.days.reduce((s: number, d: any) => s + d.items.reduce((ss: number, it: any) => ss + (it.amount || 0), 0), 0)
    : calcTotal(userData.calcHoneymoon)
  const honeymoonBudget = userData.honeymoonPlan?.budget || userData.calcHoneymoon.budget || 0

  const weddingCost = calcTotal(userData.calcWedding, true)
  const honeymoonCost = honeymoonTotal
  const houseCost = calcTotal(userData.calcHouse)
  const totalCost = weddingCost + honeymoonCost + houseCost

  const weddingBudget = userData.calcWedding.budget || 0
  const houseBudget = userData.calcHouse.budget || 0
  const budget = weddingBudget + honeymoonBudget + houseBudget
  const remaining = Math.max(0, budget - totalCost)

  // ── D-DAY 계산 ──
  const ddayMs = weddingDate ? new Date(weddingDate).getTime() - Date.now() : null
  const dday = ddayMs !== null ? Math.ceil(ddayMs / 86400000) : null
  const weddingDayStr = weddingDate
    ? (() => { const d = new Date(weddingDate); return isNaN(d.getTime()) ? null : `${weddingDate} (${WEEK_DAYS[d.getDay()]}요일)` })()
    : null

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
    setDateEditOpen(false)
    setTimeout(() => setSaved(false), 2000)
  }

  // ── 세그먼트 바 너비 계산 ──
  function segWidth(cost: number) {
    if (budget <= 0 || totalCost <= 0) return 0
    return Math.round((cost / Math.max(budget, totalCost)) * 100)
  }
  const wPct = segWidth(weddingCost)
  const hoPct = segWidth(honeymoonCost)
  const houPct = segWidth(houseCost)
  const remPct = budget > 0 ? Math.max(0, 100 - wPct - hoPct - houPct) : 0

  return (
    <div>
      {guestPopup && <GuestPopup onClose={() => setGuestPopup(false)} />}
      {showOnboarding && <OnboardingWizard nick={userData.nick} onComplete={completeOnboarding} />}

      {/* ══════════════════════════════════════
          1. 히어로 카드 (개인화·설렘 중심)
      ══════════════════════════════════════ */}
      {(() => {
        // 진행률 기반 동기부여 메시지
        const motiv = pct >= 100 ? '모든 준비 완료! 이제 그 날만 기다려요 💒'
          : pct >= 81  ? '완성이 눈앞이에요! 마지막 마무리만 남았어요 🎉'
          : pct >= 61  ? '거의 다 왔어요! 이 속도면 완벽해요 💪'
          : pct >= 41  ? '절반 이상 왔어요! 잘 하고 있어요 ✨'
          : pct >= 21  ? '첫 단계들을 잘 마쳤어요! 하나씩 해나가고 있어요 💕'
          : pct >= 1   ? '결혼 준비를 시작했어요! 설레는 여정의 시작이에요 💍'
          : '결혼 예정일을 설정하고 준비를 시작해볼까요? 💍'
        const ddayStr = dday === null ? null
          : dday > 0 ? `D-${dday}` : dday === 0 ? 'D-DAY' : `D+${Math.abs(dday)}`
        const nick = isGuest ? '예비부부' : (userData.nick || '예비부부')
        const remaining = Math.max(0, budget - totalCost)
        const isOver = budget > 0 && totalCost > budget

        return (
          <div data-tour="wedding-date" style={{
            background: 'linear-gradient(135deg, var(--pk), var(--mn))',
            borderRadius: 'var(--r-lg)',
            padding: 'clamp(14px,4vw,18px)',
            color: '#fff',
            marginBottom: 'var(--gap-md)',
            boxShadow: '0 6px 24px rgba(255,107,157,.35)',
          }}>
            {/* ① 개인화 타이틀 */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 'clamp(16px,5vw,19px)', fontWeight: 900, lineHeight: 1.2 }}>
                💒 {nick}님의 결혼식
              </div>
              <div style={{ fontSize: 'var(--fs-xs)', opacity: .88, fontWeight: 600, marginTop: 4, fontStyle: 'italic' }}>
                {motiv}
              </div>
            </div>

            {/* ② D-DAY + 날짜 인라인 */}
            {ddayStr ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
                <div style={{ fontSize: 'clamp(22px,7vw,28px)', fontWeight: 900, lineHeight: 1, letterSpacing: '-1px' }}>
                  {ddayStr}
                </div>
                {weddingDayStr && (
                  <div style={{ fontSize: 'var(--fs-xs)', opacity: .82, fontWeight: 600, lineHeight: 1.5 }}>
                    {weddingDayStr}<br />
                    <span style={{ opacity: .85 }}>💕 우리의 특별한 날</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, opacity: .9, marginBottom: 12 }}>
                📅 결혼 예정일을 설정해주세요
              </div>
            )}

            {/* ③ 핵심 지표 3칩 */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              {[
                { val: `${pct}%`,                    sub: '✅ 준비 완료' },
                { val: `${fmt(totalCost)}만`,         sub: '💰 예상 비용' },
                { val: budget > 0 ? (isOver ? `-${fmt(totalCost - budget)}만` : `+${fmt(remaining)}만`) : '미설정',
                  sub: '예산 여유',
                  valColor: budget > 0 ? (isOver ? '#ffd0d0' : '#a8ffdf') : 'rgba(255,255,255,.6)' },
              ].map(({ val, sub, valColor }) => (
                <div key={sub} style={{ flex: 1, background: 'rgba(255,255,255,.18)', borderRadius: 10, padding: 'clamp(7px,2vw,9px) 4px', textAlign: 'center' }}>
                  <div style={{ fontSize: 'clamp(13px,4.5vw,16px)', fontWeight: 900, lineHeight: 1, marginBottom: 3, color: valColor ?? '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {val}
                  </div>
                  <div style={{ fontSize: 9, opacity: .82, fontWeight: 600 }}>{sub}</div>
                </div>
              ))}
            </div>

            {/* ④ 준비율 바 */}
            <div style={{ height: 4, background: 'rgba(255,255,255,.25)', borderRadius: 2, overflow: 'hidden', marginBottom: 10 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: '#fff', borderRadius: 2, transition: 'width .6s ease' }} />
            </div>

            {/* ⑤ 날짜 변경 칩 + 긴급/예정 배지 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
              <button
                onClick={() => setDateEditOpen(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.35)', color: '#fff', borderRadius: 20, padding: '5px 12px', fontSize: 'var(--fs-xs)', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                📅 {dateEditOpen ? '닫기 ▲' : '날짜 변경 ✎'}
              </button>
              <div style={{ display: 'flex', gap: 5 }}>
                {urgentCount > 0 && (
                  <div style={{ background: 'rgba(255,80,60,.35)', border: '1px solid rgba(255,120,100,.5)', borderRadius: 8, padding: '4px 9px', fontSize: 'var(--fs-xs)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    ⚡ 긴급 {urgentCount}
                  </div>
                )}
                {upcomingCount > 0 && (
                  <div style={{ background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.3)', borderRadius: 8, padding: '4px 9px', fontSize: 'var(--fs-xs)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    📅 예정 {upcomingCount}
                  </div>
                )}
              </div>
            </div>

            {/* ⑥ 날짜 입력 패널 (펼침) */}
            {dateEditOpen && (
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 'var(--fs-xs)', opacity: .85, fontWeight: 600 }}>결혼 예정일</span>
                  <button
                    onClick={() => setDateMode(m => m === 'calendar' ? 'manual' : 'calendar')}
                    style={{ background: 'rgba(255,255,255,.25)', border: '1px solid rgba(255,255,255,.4)', color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 'var(--fs-xs)', cursor: 'pointer' }}
                  >
                    {dateMode === 'calendar' ? '숫자 입력' : '달력 선택'}
                  </button>
                </div>
                {dateMode === 'calendar' ? (
                  <input type='date' value={weddingDate} onChange={e => setWeddingDate(e.target.value)}
                    style={{ width: '100%', border: 'none', borderRadius: 10, padding: 'clamp(8px,2.5vw,10px) 12px', fontSize: 'var(--fs-base)', boxSizing: 'border-box', outline: 'none', color: '#333', marginBottom: 8 }} />
                ) : (
                  <input type='text' value={weddingDate} onChange={e => setWeddingDate(e.target.value)}
                    placeholder='YYYY-MM-DD (예: 2026-10-10)'
                    style={{ width: '100%', border: 'none', borderRadius: 10, padding: 'clamp(8px,2.5vw,10px) 12px', fontSize: 'var(--fs-base)', boxSizing: 'border-box', outline: 'none', color: '#333', marginBottom: 8 }} />
                )}
                <button onClick={save} style={{
                  width: '100%', background: saved ? 'rgba(255,255,255,.9)' : '#fff',
                  color: saved ? 'var(--gr)' : 'var(--pk)', border: 'none', borderRadius: 10,
                  padding: 'clamp(9px,2.5vw,11px) 0', fontSize: 'var(--fs-base)', fontWeight: 800, cursor: 'pointer', transition: 'all .2s',
                }}>
                  {saved ? '저장되었습니다 ✓' : '저장하기'}
                </button>
              </div>
            )}
          </div>
        )
      })()}

      {/* ══════════════════════════════════════
          2-B. 신혼여행·신혼집 상태 카드 (NEW)
      ══════════════════════════════════════ */}
      {(() => {
        const hp = userData.honeymoonPlan
        const hd = userData.houseDetail
        const booking = hp?.bookingChecklist ?? []
        const bookingDone = booking.filter((b: any) => b.done).length
        const bookingTotal = booking.length

        // 신혼집 단계 감지
        const mode = hd?.mode ?? 'jeonse'
        const houseStep = (() => {
          if (!hd) return 2
          const hasPriceInput = mode === 'buy' ? !!(hd.buy?.price && parseFloat(hd.buy.price))
            : mode === 'jeonse' ? !!(hd.jeonse?.price && parseFloat(hd.jeonse.price))
            : !!(hd.rent?.deposit || hd.rent?.monthly)
          const hasCashInput = mode === 'buy' ? !!(parseFloat(hd.buy?.cashGroom ?? '0') || parseFloat(hd.buy?.cashBride ?? '0'))
            : mode === 'jeonse' ? !!(parseFloat(hd.jeonse?.cashGroom ?? '0') || parseFloat(hd.jeonse?.cashBride ?? '0'))
            : !!(parseFloat(hd.rent?.cashGroom ?? '0') || parseFloat(hd.rent?.cashBride ?? '0'))
          if (!hasPriceInput || !hasCashInput) return 2
          const hasIncome = mode === 'buy' ? !!(parseFloat(hd.buy?.incomeGroom ?? '0') || parseFloat(hd.buy?.incomeBride ?? '0'))
            : mode === 'jeonse' ? !!parseFloat(hd.jeonse?.loanRate ?? '0') : true
          if (!hasIncome) return 3
          if (!hd.address?.trim()) return 4
          if (!hd.targetMoveIn) return 5
          return 6
        })()

        const houseStepLabel = houseStep <= 2 ? '재정현황 입력 필요'
          : houseStep === 3 ? '대출 전략 수립 중'
          : houseStep === 4 ? '매물 탐색 단계'
          : houseStep === 5 ? '계약 준비 단계'
          : '준비 완료 ✓'

        const housePrice = mode === 'buy' ? parseFloat(hd?.buy?.price ?? '0')
          : mode === 'jeonse' ? parseFloat(hd?.jeonse?.price ?? '0') : 0

        return (
          <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--gap-md)' }}>
            {/* 신혼여행 카드 */}
            <div
              onClick={() => navigate('/honeymoon')}
              style={{ flex: 1, background: '#fff', borderRadius: 'var(--r-lg)', border: '1.5px solid var(--pk4)', padding: '12px 12px', cursor: 'pointer', boxShadow: '0 2px 10px rgba(255,107,157,.07)' }}
            >
              <div style={{ fontSize: 18, marginBottom: 4 }}>✈️</div>
              <div style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 700, marginBottom: 3 }}>신혼여행</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
                {honeymoonCost > 0 ? `${fmt(honeymoonCost)}만` : '미입력'}
              </div>
              {bookingTotal > 0 && (
                <>
                  <div style={{ height: 3, background: 'var(--gray1)', borderRadius: 2, marginBottom: 3 }}>
                    <div style={{ height: '100%', width: `${Math.round(bookingDone / bookingTotal * 100)}%`, background: 'var(--mn)', borderRadius: 2, transition: 'width .5s' }} />
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--pk)', fontWeight: 700 }}>예약 {bookingDone}/{bookingTotal} 완료</div>
                </>
              )}
              {bookingTotal === 0 && (
                <div style={{ fontSize: 9, color: 'var(--text2)', fontWeight: 600 }}>체크리스트 미설정</div>
              )}
            </div>
            {/* 신혼집 카드 */}
            <div
              onClick={() => navigate('/calc/house')}
              style={{ flex: 1, background: '#fff', borderRadius: 'var(--r-lg)', border: '1.5px solid var(--pk4)', padding: '12px 12px', cursor: 'pointer', boxShadow: '0 2px 10px rgba(255,107,157,.07)' }}
            >
              <div style={{ fontSize: 18, marginBottom: 4 }}>🏡</div>
              <div style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 700, marginBottom: 3 }}>
                신혼집 ({mode === 'buy' ? '매매' : mode === 'jeonse' ? '전세' : '월세'})
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
                {housePrice > 0 ? `${housePrice >= 10000 ? `${(housePrice / 10000).toFixed(1)}억` : `${fmt(housePrice)}만`}` : '미입력'}
              </div>
              <div style={{ height: 3, background: 'var(--gray1)', borderRadius: 2, marginBottom: 3 }}>
                <div style={{ height: '100%', width: `${Math.round(Math.min(houseStep - 1, 5) / 5 * 100)}%`, background: 'var(--bl)', borderRadius: 2, transition: 'width .5s' }} />
              </div>
              <div style={{ fontSize: 9, color: 'var(--pk)', fontWeight: 700 }}>{houseStepLabel}</div>
              {!userData.interiorData && (
                <div style={{ marginTop: 4, fontSize: 9, fontWeight: 700, background: '#fef3c7', color: '#d97706', borderRadius: 20, padding: '2px 7px', display: 'inline-block' }}>인테리어 미설정</div>
              )}
            </div>
          </div>
        )
      })()}

      {/* ══════════════════════════════════════
          2-C. 다음 할 일 제안 카드 (NEW)
      ══════════════════════════════════════ */}
      {(() => {
        const actions: { icon: string; text: string; sub: string; path: string }[] = []
        const hp = userData.honeymoonPlan
        const hd = userData.houseDetail
        const booking = hp?.bookingChecklist ?? []

        // 신혼여행 - 출발일 미설정
        if (!hp?.departureDate) {
          actions.push({ icon: '✈️', text: '신혼여행 출발일을 입력해주세요', sub: '출발·귀국일 설정 → D-DAY 카운트다운 시작', path: '/honeymoon' })
        }
        // 신혼여행 - 미완료 예약 항목
        const pendingBooking = booking.filter((b: any) => !b.done)
        if (pendingBooking.length > 0) {
          actions.push({ icon: '📋', text: `여행 예약 ${pendingBooking.length}건 미완료`, sub: pendingBooking.slice(0, 2).map((b: any) => b.label).join(', '), path: '/honeymoon' })
        }
        // 인테리어 비용 미설정
        if (!userData.interiorData) {
          actions.push({ icon: '🛋️', text: '인테리어 예산을 계획해보세요', sub: '신혼집 탭 하단에서 항목별 견적을 바로 설정할 수 있어요', path: '/calc/house' })
        }
        // 신혼집 - 금액 미입력
        const houseMode = hd?.mode ?? 'jeonse'
        const hasPriceInput = houseMode === 'buy' ? !!(hd?.buy?.price && parseFloat(hd.buy.price))
          : houseMode === 'jeonse' ? !!(hd?.jeonse?.price && parseFloat(hd.jeonse.price))
          : !!(hd?.rent?.deposit || hd?.rent?.monthly)
        if (!hasPriceInput) {
          actions.push({ icon: '🏡', text: '신혼집 목표 금액을 입력해주세요', sub: '금액 입력 후 대출·현금 분석이 시작돼요', path: '/calc/house' })
        } else {
          const hasIncome = houseMode === 'buy' ? !!(parseFloat(hd?.buy?.incomeGroom ?? '0') || parseFloat(hd?.buy?.incomeBride ?? '0'))
            : houseMode === 'jeonse' ? !!parseFloat(hd?.jeonse?.loanRate ?? '0') : true
          if (!hasIncome && houseMode !== 'rent') {
            actions.push({ icon: '💰', text: '신혼집 대출 전략을 수립해주세요', sub: houseMode === 'buy' ? '연소득 입력 → DSR 기준 대출 한도 계산' : '전세대출 금리 입력 → 월 이자 계산', path: '/calc/house' })
          }
        }

        if (actions.length === 0) return null
        return (
          <div style={{ background: 'linear-gradient(135deg, #fff5f9, #f5f0ff)', border: '1.5px solid var(--pk4)', borderRadius: 'var(--r-lg)', padding: '12px 14px', marginBottom: 'var(--gap-md)' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text2)', marginBottom: 8 }}>🎯 지금 바로 하면 좋은 것들</div>
            {actions.slice(0, 3).map((action, i) => (
              <div
                key={i}
                onClick={() => navigate(action.path)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: i < Math.min(actions.length, 3) - 1 ? '1px solid rgba(255,107,157,.1)' : 'none', cursor: 'pointer' }}
              >
                <div style={{ fontSize: 18, flexShrink: 0 }}>{action.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>{action.text}</div>
                  <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 1 }}>{action.sub}</div>
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--pk)', background: 'var(--pk4)', border: 'none', borderRadius: 8, padding: '4px 10px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  바로가기 →
                </div>
              </div>
            ))}
          </div>
        )
      })()}

      {/* ══════════════════════════════════════
          3. 예산 현황 (세그먼트 바)
      ══════════════════════════════════════ */}
      <div
        data-tour="budget"
        className="card"
        onClick={() => navigate('/calc')}
        style={{ marginBottom: 'var(--gap-md)', cursor: 'pointer', transition: 'box-shadow .15s', userSelect: 'none' }}
        onTouchStart={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(255,107,157,.15)')}
        onTouchEnd={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,107,157,.1)')}
      >
        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 'var(--fs-base)', fontWeight: 800, color: 'var(--text)' }}>예산 현황</span>
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--pk)', fontWeight: 700 }}>계산기 →</span>
        </div>

        {/* 총 예산 / 잔여 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text2)' }}>
            총 예산 <strong style={{ color: 'var(--text)', fontWeight: 800 }}>{budget > 0 ? `${fmt(budget)}만원` : '미설정'}</strong>
          </span>
          <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text2)' }}>
            잔여 <strong style={{ color: remaining > 0 ? 'var(--gr)' : 'var(--or)', fontWeight: 800 }}>
              {budget > 0 ? `${fmt(remaining)}만원` : '-'}
            </strong>
          </span>
        </div>

        {/* 세그먼트 바 */}
        <div style={{
          display: 'flex', height: 18, borderRadius: 9,
          overflow: 'hidden', marginBottom: 10,
          background: 'var(--pk4)',
          gap: 0,
        }}>
          {wPct > 0 && (
            <div style={{ width: `${wPct}%`, background: 'var(--pk)', transition: 'width .5s', minWidth: wPct > 0 ? 4 : 0 }} />
          )}
          {hoPct > 0 && (
            <div style={{ width: `${hoPct}%`, background: 'var(--mn)', transition: 'width .5s', minWidth: hoPct > 0 ? 4 : 0 }} />
          )}
          {houPct > 0 && (
            <div style={{ width: `${houPct}%`, background: 'var(--bl)', transition: 'width .5s', minWidth: houPct > 0 ? 4 : 0 }} />
          )}
          {remPct > 0 && (
            <div style={{ flex: 1, background: 'var(--pk4)', minWidth: 4 }} />
          )}
          {budget === 0 && wPct === 0 && hoPct === 0 && houPct === 0 && (
            <div style={{ flex: 1, background: 'var(--pk4)' }} />
          )}
        </div>

        {/* 범례 */}
        <div style={{ display: 'flex', gap: 'clamp(6px,2vw,12px)', flexWrap: 'wrap' }}>
          {[
            { label: '결혼식', cost: weddingCost, color: 'var(--pk)' },
            { label: '신혼여행', cost: honeymoonCost, color: 'var(--mn)' },
            { label: '신혼집', cost: houseCost, color: 'var(--bl)' },
          ].map(({ label, cost, color }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--fs-xs)', color: 'var(--text2)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />
              {label} <strong style={{ color: 'var(--text)', fontWeight: 700 }}>{fmt(cost)}만</strong>
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════
          4. 이번주 할 일
      ══════════════════════════════════════ */}
      <WeeklyTasks deadlineItems={deadlineItems} onToggle={toggleItem} />

      {/* ══════════════════════════════════════
          5. 빠른 메뉴 (2×2)
      ══════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap-sm)', marginBottom: 'var(--gap-md)' }}>
        {([
          { path: '/checklist',   Icon: ChecklistIcon,  label: '전체 일정관리', sub: `${pct}% 완료`,              tour: 'nav-checklist' },
          { path: '/calc/wedding',Icon: RingIcon,        label: '결혼식 비용',   sub: `${fmt(weddingCost)}만원`,   tour: 'nav-wedding' },
          { path: '/honeymoon',   Icon: PlaneIcon,       label: '신혼여행 계획', sub: `${fmt(honeymoonCost)}만원`, tour: undefined },
          { path: '/calc/house',  Icon: HouseHeartIcon,  label: '신혼집 마련',   sub: `${fmt(houseCost)}만원`,     tour: undefined },
        ] as const).map(q => (
          <button
            key={q.path}
            data-tour={q.tour}
            onClick={() => navigate(q.path)}
            style={{
              background: '#fff',
              border: '1.5px solid var(--pk4)',
              borderRadius: 'var(--r-lg)',
              padding: 'clamp(12px,3.5vw,16px) clamp(8px,2.5vw,12px)',
              textAlign: 'center',
              cursor: 'pointer',
              color: 'var(--text)',
              transition: 'border-color .15s, box-shadow .15s',
              boxShadow: '0 2px 8px rgba(255,107,157,.07)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
              <q.Icon size={30} active />
            </div>
            <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700 }}>{q.label}</div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--pk)', marginTop: 3, fontWeight: 600 }}>{q.sub}</div>
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════
          6. 최신 게시글
      ══════════════════════════════════════ */}
      <div style={{
        background: '#fff',
        borderRadius: 'var(--r-lg)',
        boxShadow: '0 4px 20px rgba(255,107,157,.1)',
        border: '1.5px solid var(--pk4)',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: 'clamp(10px,3vw,14px) clamp(12px,3.5vw,16px)',
          borderBottom: '1px solid var(--gray1)',
        }}>
          <span style={{ fontSize: 'var(--fs-base)', fontWeight: 800 }}>💬 최신 게시글</span>
          <button
            onClick={() => navigate('/board')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--fs-xs)', color: 'var(--pk)', fontWeight: 700 }}
          >
            전체보기 →
          </button>
        </div>

        {/* 로딩 스켈레톤 */}
        {postsLoading && (
          <div>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ padding: 'clamp(10px,3vw,14px) clamp(12px,3.5vw,16px)', borderBottom: i < 2 ? '1px solid var(--gray1)' : 'none' }}>
                <div style={{ height: 13, width: '60%', background: 'linear-gradient(90deg,var(--gray1) 25%,var(--pk4) 50%,var(--gray1) 75%)', backgroundSize: '200% 100%', borderRadius: 6, marginBottom: 8, animation: 'skeletonShimmer 1.4s infinite' }} />
                <div style={{ height: 10, width: '85%', background: 'linear-gradient(90deg,var(--gray1) 25%,var(--pk4) 50%,var(--gray1) 75%)', backgroundSize: '200% 100%', borderRadius: 6, animation: 'skeletonShimmer 1.4s infinite .1s' }} />
              </div>
            ))}
          </div>
        )}

        {/* 에러 상태 */}
        {!postsLoading && postsError && (
          <div style={{ padding: 'clamp(16px,5vw,24px)', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>😕</div>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text2)', marginBottom: 12 }}>게시글을 불러올 수 없어요</div>
            <button
              onClick={fetchPosts}
              style={{ background: 'var(--pk5)', border: '1px solid var(--pk4)', color: 'var(--pk)', borderRadius: 8, padding: '6px 16px', fontSize: 'var(--fs-xs)', fontWeight: 700, cursor: 'pointer' }}
            >
              다시 시도
            </button>
          </div>
        )}

        {/* 빈 상태 */}
        {!postsLoading && !postsError && recentPosts.length === 0 && (
          <div style={{ padding: 'clamp(16px,5vw,24px)', fontSize: 'var(--fs-sm)', color: 'var(--text2)', textAlign: 'center' }}>
            등록된 게시글이 없어요.
          </div>
        )}

        {/* 게시글 목록 */}
        {!postsLoading && !postsError && recentPosts.map((post, idx) => (
          <div
            key={post.id}
            onClick={() => navigate('/board', { state: { openPostId: post.id } })}
            style={{
              padding: 'clamp(10px,3vw,14px) clamp(12px,3.5vw,16px)',
              borderBottom: idx < recentPosts.length - 1 ? '1px solid var(--gray1)' : 'none',
              cursor: 'pointer',
            }}
          >
            {/* 제목 */}
            <div style={{
              fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              marginBottom: 4,
            }}>
              {post.title}
            </div>
            {/* 본문 미리보기 2줄 */}
            {post.content && (
              <div style={{
                fontSize: 'var(--fs-xs)', color: 'var(--text2)', lineHeight: 1.55,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                marginBottom: 5,
              }}>
                {post.content.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/g, ' ').trim()}
              </div>
            )}
            {/* 메타 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--fs-xs)', color: 'var(--gray3)' }}>
              <span style={{ fontWeight: 600, color: 'var(--text2)' }}>
                {post.author === 'admin' ? '주인장' : post.author}
              </span>
              <span>·</span>
              <span>👁 {post.views ?? 0}</span>
              <span>❤️ {post.likes ?? 0}</span>
              <span>💬 {(post.comments ?? []).length}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
