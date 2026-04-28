import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { CHECKLIST_STAGES } from '../data/checklistSeed'
import type { CalcState } from '../types'
function fmt(n: number) { return n.toLocaleString('ko-KR') }
function calcTotal(cs: CalcState): number {
  let t = 0
  t += cs._mealTotal ?? Math.round((cs.mealCount * cs.mealPrice) / 10000)
  t += cs.venueDirect ?? 0
  Object.values(cs.cats).forEach(cat => {
    cat.defItems.forEach(it => { if (!it.deleted && it.checked) { const v = parseInt(it.customVal) || 0; t += v > 0 ? v : (it.avg || 0) } })
    cat.customItems.forEach(it => { if (it.checked) t += it.price || 0 })
  })
  return t
}
export default function DashboardPage() {
  const navigate = useNavigate()
  const userData = useAuthStore(s => s.userData)!
  const setUserData = useAuthStore(s => s.setUserData)
  const saveUserData = useAuthStore(s => s.saveUserData)
  let total = 0, done = 0
  CHECKLIST_STAGES.forEach(s => {
    const stg = userData.checklist[s.id]; if (!stg) return
    stg.items.forEach(it => { if (!it.hidden) { total++; if (it.completed) done++ } })
    stg.customItems.forEach(it => { total++; if (it.completed) done++ })
  })
  const pct = total > 0 ? Math.round(done / total * 100) : 0
  const expected = calcTotal(userData.calcWedding) + calcTotal(userData.calcHoneymoon) + calcTotal(userData.calcHouse)
  const diff = (userData.totalBudget || 0) - expected
  const dday = userData.weddingDate ? Math.ceil((new Date(userData.weddingDate).getTime() - Date.now()) / 86400000) : null
  function editDate() { const d = prompt('결혼 예정일을 입력해주세요 (예: 2026-10-10)', userData.weddingDate || ''); if (d !== null) { setUserData({ ...userData, weddingDate: d }); saveUserData() } }
  function editBudget() { const b = prompt('총 예산을 입력해주세요 (만원 단위)', String(userData.totalBudget || '')); if (b !== null) { setUserData({ ...userData, totalBudget: parseInt(b) || 0 }); saveUserData() } }
  const c: React.CSSProperties = { background:'#fff', borderRadius:14, padding:16, boxShadow:'0 4px 20px rgba(255,107,157,.1)', border:'1.5px solid var(--pk4)', textAlign:'center' }
  const eb: React.CSSProperties = { background:'var(--pk5)', border:'1.5px solid var(--pk4)', color:'var(--pk)', borderRadius:8, padding:'5px 12px', fontSize:12, cursor:'pointer', marginTop:6 }
  return (
    <div>
      <div style={{ background:'linear-gradient(135deg,var(--pk),var(--mn))', borderRadius:14, padding:'22px 24px', color:'#fff', marginBottom:14, boxShadow:'0 6px 24px rgba(255,107,157,.3)' }}>
        <div style={{ fontSize:12, opacity:.8, marginBottom:4 }}>💍 결혼 예정일</div>
        <div style={{ fontSize:28, fontWeight:800 }}>{userData.weddingDate || '날짜를 입력해주세요'}</div>
        {dday !== null && <div style={{ fontSize:13, opacity:.85, marginTop:2 }}>{dday > 0 ? `D-${dday}` : dday === 0 ? 'D-DAY' : `D+${Math.abs(dday)}`}</div>}
        <button onClick={editDate} style={{ background:'rgba(255,255,255,.2)', border:'1.5px solid rgba(255,255,255,.4)', color:'#fff', borderRadius:8, padding:'5px 12px', fontSize:12, cursor:'pointer', marginTop:10 }}>날짜 수정</button>
      </div>
      <div style={{ background:'#fff', borderRadius:14, padding:'16px 20px', boxShadow:'0 4px 20px rgba(255,107,157,.1)', border:'1.5px solid var(--pk4)', marginBottom:14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, fontWeight:700, marginBottom:8 }}><span>💪 결혼 준비 진척률</span><span style={{ color:'var(--pk)' }}>{pct}%</span></div>
        <div style={{ height:12, background:'var(--gray2)', borderRadius:6, overflow:'hidden' }}><div style={{ height:'100%', width:`${pct}%`, background:'linear-gradient(90deg,var(--pk),var(--mn))', borderRadius:6, transition:'width .5s' }} /></div>
        <div style={{ fontSize:12, color:'var(--text2)', marginTop:6 }}>{done}개 완료 / 전체 {total}개</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
        <div style={c}><div style={{ fontSize:11, color:'var(--text2)', fontWeight:600, marginBottom:6 }}>🎯 총 예산</div><div style={{ fontSize:24, fontWeight:800, color:'var(--pk)' }}>{fmt(userData.totalBudget || 0)}<span style={{ fontSize:13, color:'var(--text2)', marginLeft:2 }}>만원</span></div><button onClick={editBudget} style={eb}>수정</button></div>
        <div style={c}><div style={{ fontSize:11, color:'var(--text2)', fontWeight:600, marginBottom:6 }}>💸 예상 비용</div><div style={{ fontSize:24, fontWeight:800, color:'var(--pk)' }}>{fmt(expected)}<span style={{ fontSize:13, color:'var(--text2)', marginLeft:2 }}>만원</span></div><div style={{ fontSize:11, color:'var(--text2)', marginTop:4 }}>결혼식+신혼여행+신혼집</div></div>
        <div style={{ ...c, background: userData.totalBudget ? (diff >= 0 ? '#e8faf5' : '#fff0f3') : '#fff' }}><div style={{ fontSize:11, color:'var(--text2)', fontWeight:600, marginBottom:6 }}>📊 차액</div>{userData.totalBudget ? <div style={{ fontSize:22, fontWeight:800, color:diff>=0?'var(--gr)':'#ee0979' }}>{diff>=0?'+':''}{fmt(diff)}<span style={{ fontSize:13, marginLeft:2 }}>만원</span></div> : <div style={{ fontSize:13, color:'var(--text2)' }}>총 예산 입력 후 표시</div>}</div>
        <div style={c}><div style={{ fontSize:11, color:'var(--text2)', fontWeight:600, marginBottom:6 }}>✅ 체크리스트</div><div style={{ fontSize:24, fontWeight:800, color:'var(--pk)' }}>{done}<span style={{ fontSize:13, color:'var(--text2)', marginLeft:2 }}>/ {total}</span></div></div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        {[{path:'/checklist',icon:'✅',label:'체크리스트'},{path:'/calc/wedding',icon:'💒',label:'결혼식 비용'},{path:'/calc/honeymoon',icon:'✈️',label:'신혼여행 비용'},{path:'/calc/house',icon:'🏡',label:'신혼집 비용'}].map(q => (
          <button key={q.path} onClick={() => navigate(q.path)} style={{ background:'#fff', border:'1.5px solid var(--pk4)', borderRadius:14, padding:16, textAlign:'center', cursor:'pointer', fontSize:13, fontWeight:700, color:'var(--text)' }}>
            <span style={{ fontSize:24, display:'block', marginBottom:6 }}>{q.icon}</span>{q.label}
          </button>
        ))}
      </div>
    </div>
  )
}