import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ShareService } from '../services/shareService'
import ViewModeBanner from '../components/ViewModeBanner'
import { CHECKLIST_STAGES } from '../data/checklistSeed'
import type { UserData, CalcState } from '../types'

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

function ReadOnlyDashboard({ data }: { data: UserData }) {
  let total = 0, done = 0
  CHECKLIST_STAGES.forEach(s => {
    const stg = data.checklist[s.id]; if (!stg) return
    stg.items.forEach(it => { if (!it.hidden) { total++; if (it.completed) done++ } })
    stg.customItems.forEach(it => { total++; if (it.completed) done++ })
  })
  const pct = total > 0 ? Math.round(done / total * 100) : 0

  const ddayMs = data.weddingDate ? new Date(data.weddingDate).getTime() - Date.now() : null
  const dday = ddayMs !== null ? Math.ceil(ddayMs / 86400000) : null

  const honeymoonTotal = data.honeymoonPlan
    ? data.honeymoonPlan.days.reduce((s, d) => s + d.items.reduce((ss, it) => ss + (it.amount || 0), 0), 0)
    : calcTotal(data.calcHoneymoon)
  const honeymoonBudget = data.honeymoonPlan?.budget || data.calcHoneymoon.budget || 0
  const weddingCost = calcTotal(data.calcWedding, true)
  const houseCost = calcTotal(data.calcHouse)
  const expected = weddingCost + honeymoonTotal + houseCost
  const budget = (data.calcWedding.budget || 0) + honeymoonBudget + (data.calcHouse.budget || 0)
  const diff = budget - expected

  return (
    <div>
      {/* D-day + progress */}
      <div style={{ background: 'linear-gradient(135deg,var(--pk),var(--mn))', borderRadius: 14, padding: 20, color: '#fff', marginBottom: 14, boxShadow: '0 6px 24px rgba(255,107,157,.3)' }}>
        {dday !== null ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'stretch', marginBottom: 12 }}>
            <div style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,.15)', borderRadius: 12, padding: '14px 8px' }}>
              <div style={{ fontSize: 11, opacity: .8, marginBottom: 4 }}>결혼식까지</div>
              <div style={{ fontSize: 44, fontWeight: 900, lineHeight: 1 }}>
                {dday > 0 ? `D-${dday}` : dday === 0 ? 'D-DAY' : `D+${Math.abs(dday)}`}
              </div>
              <div style={{ fontSize: 12, opacity: .75, marginTop: 6 }}>{data.weddingDate}</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,.15)', borderRadius: 12, padding: '14px 8px' }}>
              <div style={{ fontSize: 11, opacity: .8, marginBottom: 4 }}>결혼 준비 진척률</div>
              <div style={{ fontSize: 44, fontWeight: 900, lineHeight: 1 }}>{pct}%</div>
              <div style={{ fontSize: 12, opacity: .75, marginTop: 6 }}>{done}/{total}개 완료</div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '8px 0 12px', opacity: .85 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>결혼 예정일 미설정</div>
          </div>
        )}
        <div style={{ height: 8, background: 'rgba(255,255,255,.25)', borderRadius: 4 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: '#fff', borderRadius: 4 }} />
        </div>
      </div>

      {/* Budget summary */}
      <div style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', borderRadius: 14, padding: '18px 20px', color: '#fff', marginBottom: 14, boxShadow: '0 6px 24px rgba(102,126,234,.25)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, opacity: .85, marginBottom: 12 }}>예산 현황</div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          {[
            { label: '총 예산', val: budget > 0 ? `${fmt(budget)}만원` : '미설정' },
            { label: '예상 비용', val: `${fmt(expected)}만원` },
            { label: '차액', val: budget > 0 ? `${diff >= 0 ? '+' : ''}${fmt(diff)}만원` : '-', warn: budget > 0 && diff < 0 },
          ].map(({ label, val, warn }) => (
            <div key={label} style={{ flex: 1, background: 'rgba(255,255,255,.15)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, opacity: .8, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: warn ? '#ffd0d0' : '#fff' }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Category breakdown */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '16px', marginBottom: 14, boxShadow: '0 4px 20px rgba(255,107,157,.1)', border: '1.5px solid var(--pk4)' }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>항목별 예상 비용</div>
        {[
          { icon: '💒', label: '결혼식', val: weddingCost },
          { icon: '✈️', label: '신혼여행', val: honeymoonTotal },
          { icon: '🏡', label: '신혼집', val: houseCost },
        ].map(({ icon, label, val }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--gray1)' }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{icon} {label}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--pk)' }}>{fmt(val)}만원</span>
          </div>
        ))}
      </div>

      {/* Checklist stage progress */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '16px', boxShadow: '0 4px 20px rgba(255,107,157,.1)', border: '1.5px solid var(--pk4)' }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>단계별 체크리스트</div>
        {CHECKLIST_STAGES.map(stage => {
          const stg = data.checklist[stage.id]
          if (!stg) return null
          const stgTotal = stg.items.filter(i => !i.hidden).length + stg.customItems.length
          const stgDone = stg.items.filter(i => !i.hidden && i.completed).length + stg.customItems.filter(i => i.completed).length
          const stgPct = stgTotal > 0 ? Math.round(stgDone / stgTotal * 100) : 0
          return (
            <div key={stage.id} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                <span>{stage.name}</span>
                <span style={{ color: 'var(--text2)' }}>{stgDone}/{stgTotal}</span>
              </div>
              <div style={{ height: 6, background: 'var(--gray1)', borderRadius: 3 }}>
                <div style={{ height: '100%', width: `${stgPct}%`, background: 'var(--pk)', borderRadius: 3, transition: 'width .3s' }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function SharedViewPage() {
  const { shareToken } = useParams<{ shareToken: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [ownerNick, setOwnerNick] = useState('')
  const [createdAt, setCreatedAt] = useState('')
  const [data, setData] = useState<UserData | null>(null)

  useEffect(() => {
    if (!shareToken) { setLoading(false); return }
    ShareService.getSnapshot(shareToken).then(result => {
      if (result) {
        setOwnerNick(result.owner_nick)
        setCreatedAt(result.created_at)
        setData(result.snapshot)
      }
      setLoading(false)
    })
  }, [shareToken])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ fontSize: 14, color: 'var(--text2)' }}>불러오는 중...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>😢</div>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>공유 링크를 찾을 수 없어요.</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 24, textAlign: 'center', lineHeight: 1.7 }}>
          링크가 만료되었거나 잘못된 주소일 수 있어요.
        </div>
        <button
          onClick={() => navigate('/auth')}
          style={{ background: 'var(--pk)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
        >
          로그인하러 가기
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header style={{ background: 'linear-gradient(135deg,var(--pk),var(--mn))', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', boxShadow: '0 2px 12px rgba(255,107,157,.3)' }}>
        <span style={{ flex: 1, textAlign: 'center', color: '#fff', fontSize: 16, fontWeight: 800 }}>딸깍, 결혼비용 계산기</span>
      </header>
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '20px 16px 60px' }}>
        <ViewModeBanner ownerNick={ownerNick} createdAt={createdAt} />
        <ReadOnlyDashboard data={data} />
      </main>
    </div>
  )
}
