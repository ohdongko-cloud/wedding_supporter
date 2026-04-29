import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { CHECKLIST_STAGES } from '../data/checklistSeed'
import { BoardService } from '../services/boardService'
import type { CalcState, Post } from '../types'

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
  const [venueName, setVenueName] = useState((userData as any).venueName || '')
  const [dateMode, setDateMode] = useState<'calendar' | 'manual'>('calendar')
  const [saved, setSaved] = useState(false)
  const [guestPopup, setGuestPopup] = useState(false)
  const [recentPosts, setRecentPosts] = useState<Post[]>([])

  useEffect(() => {
    const posts = BoardService.getPosts()
    setRecentPosts(posts.slice(0, 4))
  }, [])

  let total = 0, done = 0
  CHECKLIST_STAGES.forEach(s => {
    const stg = userData.checklist[s.id]; if (!stg) return
    stg.items.forEach(it => { if (!it.hidden) { total++; if (it.completed) done++ } })
    stg.customItems.forEach(it => { total++; if (it.completed) done++ })
  })
  const pct = total > 0 ? Math.round(done / total * 100) : 0
  const expected = calcTotal(userData.calcWedding, true) + calcTotal(userData.calcHoneymoon) + calcTotal(userData.calcHouse)
  const budget = (userData.calcWedding.budget || 0) + (userData.calcHoneymoon.budget || 0) + (userData.calcHouse.budget || 0)
  const diff = budget - expected

  const ddayMs = weddingDate ? new Date(weddingDate).getTime() - Date.now() : null
  const dday = ddayMs !== null ? Math.ceil(ddayMs / 86400000) : null

  function save() {
    if (isGuest) { setGuestPopup(true); return }
    const newData = { ...userData, weddingDate, venueName }
    setUserData(newData)
    saveUserData()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      {guestPopup && <GuestPopup onClose={() => setGuestPopup(false)} />}
      {/* Wedding date + D-DAY + progress */}
      <div style={{ background: 'linear-gradient(135deg,var(--pk),var(--mn))', borderRadius: 14, padding: '20px', color: '#fff', marginBottom: 14, boxShadow: '0 6px 24px rgba(255,107,157,.3)' }}>
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

        {/* Date input */}
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
            <input
              type='date'
              value={weddingDate}
              onChange={e => setWeddingDate(e.target.value)}
              style={{ width: '100%', border: 'none', borderRadius: 10, padding: '10px 12px', fontSize: 14, boxSizing: 'border-box', outline: 'none', color: '#333' }}
            />
          ) : (
            <input
              type='text'
              value={weddingDate}
              onChange={e => setWeddingDate(e.target.value)}
              placeholder='YYYY-MM-DD (예: 2026-10-10)'
              style={{ width: '100%', border: 'none', borderRadius: 10, padding: '10px 12px', fontSize: 14, boxSizing: 'border-box', outline: 'none', color: '#333' }}
            />
          )}
        </div>

        {/* Venue name */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12, opacity: .85, fontWeight: 600, marginBottom: 6 }}>결혼식장 이름</div>
          <input
            type='text'
            value={venueName}
            onChange={e => setVenueName(e.target.value)}
            placeholder='예: 명동성당 (선택)'
            style={{ width: '100%', border: 'none', borderRadius: 10, padding: '10px 12px', fontSize: 14, boxSizing: 'border-box', outline: 'none', color: '#333' }}
          />
        </div>

        <button
          onClick={save}
          style={{ width: '100%', background: saved ? 'rgba(255,255,255,.9)' : '#fff', color: saved ? 'var(--gr)' : 'var(--pk)', border: 'none', borderRadius: 10, padding: '11px 0', fontSize: 14, fontWeight: 800, cursor: 'pointer', transition: 'all .2s' }}
        >
          {saved ? '저장되었습니다 ✓' : '저장하기'}
        </button>
      </div>

      {/* Budget summary box */}
      <div style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', borderRadius: 14, padding: '18px 20px', color: '#fff', marginBottom: 14, boxShadow: '0 6px 24px rgba(102,126,234,.25)' }}>
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
          { path: '/checklist', icon: '✅', label: '체크리스트', sub: `${pct}% 완료` },
          { path: '/calc/wedding', icon: '💒', label: '결혼식 비용', sub: `${fmt(calcTotal(userData.calcWedding, true))}만원` },
          { path: '/calc/honeymoon', icon: '✈️', label: '신혼여행 비용', sub: `${fmt(calcTotal(userData.calcHoneymoon))}만원` },
          { path: '/calc/house', icon: '🏡', label: '신혼집 비용', sub: `${fmt(calcTotal(userData.calcHouse))}만원` },
        ].map(q => (
          <button key={q.path} onClick={() => navigate(q.path)} style={{ background: '#fff', border: '1.5px solid var(--pk4)', borderRadius: 14, padding: '14px 12px', textAlign: 'center', cursor: 'pointer', color: 'var(--text)' }}>
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
