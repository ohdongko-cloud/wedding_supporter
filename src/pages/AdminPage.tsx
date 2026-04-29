import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { StorageService } from '../services/storage'
import { BoardService } from '../services/boardService'
import { AnalyticsService } from '../services/analytics'
import { DevRequestService } from '../services/devRequests'
import type { UserData, Post } from '../types'
import type { DevRequest } from '../services/devRequests'

type Tab = 'users' | 'board' | 'analytics' | 'devRequests' | 'backup'

function fmtDate(iso?: string) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('ko-KR')
}

function fmtDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function calcProgress(u: UserData): number {
  let total = 0, done = 0
  Object.values(u.checklist).forEach(stage => {
    stage.items.forEach(it => { if (!it.hidden) { total++; if (it.completed) done++ } })
    stage.customItems.forEach(it => { total++; if (it.completed) done++ })
  })
  return total > 0 ? Math.round(done / total * 100) : 0
}

function downloadJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

const SECTION_LABELS: Record<string, string> = {
  'nav:/': '사이드바 → 메인 페이지',
  'nav:/checklist': '사이드바 → 체크리스트',
  'nav:/board': '사이드바 → 꿀팁 정보',
  'nav:/memo': '사이드바 → 메모장',
  'nav:/calc/wedding': '사이드바 → 결혼식 비용 계산기',
  'nav:/calc/honeymoon': '사이드바 → 신혼여행 비용 계산기',
  'nav:/calc/house': '사이드바 → 신혼집 비용 계산기',
  'nav:/admin': '사이드바 → 관리자 페이지',
  'calc:wedding:wedding': '결혼식 계산기 → 결혼식장 선택품목',
  'calc:wedding:studio': '결혼식 계산기 → 스튜디오',
  'calc:wedding:dress': '결혼식 계산기 → 드레스',
  'calc:wedding:makeup': '결혼식 계산기 → 메이크업',
  'calc:wedding:etc': '결혼식 계산기 → 기타',
  'calc:honeymoon:flight': '신혼여행 계산기 → 항공권',
  'calc:honeymoon:accommodation': '신혼여행 계산기 → 숙소',
  'calc:honeymoon:food': '신혼여행 계산기 → 식비',
  'calc:honeymoon:transport': '신혼여행 계산기 → 교통',
  'calc:honeymoon:activity': '신혼여행 계산기 → 액티비티',
  'calc:honeymoon:shopping': '신혼여행 계산기 → 쇼핑',
  'calc:honeymoon:insurance': '신혼여행 계산기 → 여행자보험',
  'calc:honeymoon:etc': '신혼여행 계산기 → 기타',
  'calc:house:deposit': '신혼집 계산기 → 보증금/매매자금',
  'calc:house:loan': '신혼집 계산기 → 대출 관련 비용',
  'calc:house:agent': '신혼집 계산기 → 중개수수료',
  'calc:house:moving': '신혼집 계산기 → 이사비',
  'calc:house:appliance': '신혼집 계산기 → 가전',
  'calc:house:furniture': '신혼집 계산기 → 가구',
  'calc:house:interior': '신혼집 계산기 → 인테리어',
  'calc:house:supplies': '신혼집 계산기 → 생활용품',
  'calc:house:etc': '신혼집 계산기 → 기타',
  'checklist:s1': '체크리스트 → 결혼 의사 확인',
  'checklist:s2': '체크리스트 → 상견례 & 결혼 확정',
  'checklist:s3': '체크리스트 → 예산 & 계획',
  'checklist:s4': '체크리스트 → 결혼식 준비',
  'checklist:s5': '체크리스트 → 신혼집 준비',
  'checklist:s6': '체크리스트 → 신혼여행 준비',
  'checklist:s7': '체크리스트 → 혼인신고',
  'checklist:s8': '체크리스트 → 결혼식 전날',
  'checklist:s9': '체크리스트 → 결혼 후 정리',
}

export default function AdminPage() {
  const user = useAuthStore(s => s.user)!
  const [tab, setTab] = useState<Tab>('users')
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [posts, setPosts] = useState<Post[]>(() => BoardService.getPosts())
  const [analyticsData, setAnalyticsData] = useState<Record<string, number>>(() => AnalyticsService.getAll())
  const [devRequests, setDevRequests] = useState<DevRequest[]>(() => DevRequestService.getAll())

  if (user.nick !== 'admin') {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text2)', fontSize: 15 }}>
        🔒 접근 권한이 없습니다.
      </div>
    )
  }

  const registry: string[] = StorageService.get<string[]>('registry') || []
  const allUsers: UserData[] = registry
    .map(nick => StorageService.get<UserData>(nick.toLowerCase()))
    .filter((u): u is UserData => u !== null && u.nick !== 'admin')

  function deletePost(id: string) {
    if (!confirm('글을 삭제할까요?')) return
    BoardService.deletePost(id)
    setPosts(BoardService.getPosts())
  }

  function resetAnalytics() {
    if (!confirm('통계를 초기화할까요?')) return
    AnalyticsService.reset()
    setAnalyticsData({})
  }

  function markRequestRead(id: string) {
    DevRequestService.markRead(id)
    setDevRequests(DevRequestService.getAll())
  }

  function deleteAllRequests() {
    if (!confirm('개발 요청을 모두 삭제할까요?')) return
    DevRequestService.deleteAll()
    setDevRequests([])
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'users', label: '사용자' },
    { key: 'board', label: '게시판' },
    { key: 'analytics', label: '통계' },
    { key: 'devRequests', label: `요청${devRequests.filter(r => !r.isRead).length > 0 ? ` (${devRequests.filter(r => !r.isRead).length})` : ''}` },
    { key: 'backup', label: '백업' },
  ]

  // Analytics sorted entries
  const analyticsEntries = Object.entries(analyticsData)
    .sort((a, b) => b[1] - a[1])
  const totalClicks = analyticsEntries.reduce((s, [, v]) => s + v, 0)

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#fff', borderRadius: 12, padding: 5, boxShadow: '0 2px 12px rgba(255,107,157,.08)', border: '1.5px solid var(--pk4)', overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setSelectedUser(null) }} style={{ flex: 1, border: 'none', borderRadius: 8, padding: '10px 6px', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: '.15s', background: tab === t.key ? 'var(--pk)' : 'none', color: tab === t.key ? '#fff' : 'var(--text2)', whiteSpace: 'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Users tab */}
      {tab === 'users' && (
        selectedUser ? (
          <div>
            <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--pk)', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>← 목록으로</button>
            <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 4px 20px rgba(255,107,157,.1)', border: '1.5px solid var(--pk4)', marginBottom: 12 }}>
              <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 14, color: 'var(--pk)' }}>{selectedUser.nick}</div>
              {([
                ['가입일', fmtDate(selectedUser.createdAt)],
                ['마지막 로그인', fmtDate(selectedUser.lastLoginAt)],
                ['결혼 예정일', selectedUser.weddingDate || '미설정'],
                ['총 예산', selectedUser.totalBudget > 0 ? `${Math.round(selectedUser.totalBudget / 10000).toLocaleString()}만원` : '미설정'],
                ['체크리스트 진행률', `${calcProgress(selectedUser)}%`],
                ['메모 수', `${(selectedUser.memos || []).length}개`],
                ['결혼식 예상비용', `${Math.round((selectedUser.calcWedding?.totalCost || 0) / 10000).toLocaleString()}만원`],
                ['신혼여행 예상비용', `${Math.round((selectedUser.calcHoneymoon?.totalCost || 0) / 10000).toLocaleString()}만원`],
                ['신혼집 예상비용', `${Math.round((selectedUser.calcHouse?.totalCost || 0) / 10000).toLocaleString()}만원`],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: 12, marginBottom: 9, fontSize: 13, borderBottom: '1px solid var(--gray1)', paddingBottom: 9 }}>
                  <span style={{ color: 'var(--text2)', minWidth: 120, fontWeight: 600 }}>{k}</span>
                  <span style={{ fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
            <button onClick={() => downloadJSON(selectedUser, `user_${selectedUser.nick}_${Date.now()}.json`)} style={{ width: '100%', background: 'var(--pk)', color: '#fff', border: 'none', borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              📥 이 사용자 데이터 JSON 다운로드
            </button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 10 }}>총 {allUsers.length}명</div>
            <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 4px 20px rgba(255,107,157,.1)', border: '1.5px solid var(--pk4)', overflow: 'hidden' }}>
              {allUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)', fontSize: 14 }}>등록된 사용자가 없습니다.</div>
              ) : allUsers.map((u, idx) => (
                <div key={u.nick} onClick={() => setSelectedUser(u)} style={{ display: 'flex', alignItems: 'center', padding: '13px 16px', borderBottom: idx < allUsers.length - 1 ? '1px solid var(--gray1)' : 'none', cursor: 'pointer', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{u.nick}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                      가입: {fmtDate(u.createdAt)} · 진행률 {calcProgress(u)}% · 메모 {(u.memos || []).length}개
                    </div>
                  </div>
                  <span style={{ fontSize: 18, color: 'var(--text2)' }}>›</span>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* Board tab */}
      {tab === 'board' && (
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 4px 20px rgba(255,107,157,.1)', border: '1.5px solid var(--pk4)', overflow: 'hidden' }}>
          {posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)', fontSize: 14 }}>게시글이 없습니다.</div>
          ) : posts.map((post, idx) => (
            <div key={post.id} style={{ padding: '13px 16px', borderBottom: idx < posts.length - 1 ? '1px solid var(--gray1)' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {post.isNotice && '[공지] '}{post.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                  {post.author} · {fmtDate(post.createdAt)} · 댓글 {post.comments.length} · 조회 {post.views}
                </div>
              </div>
              <button onClick={() => deletePost(post.id)} style={{ background: 'none', border: '1.5px solid #ffcdd2', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer', color: '#e57373', fontWeight: 600, flexShrink: 0 }}>삭제</button>
            </div>
          ))}
        </div>
      )}

      {/* Analytics tab */}
      {tab === 'analytics' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>총 {totalClicks.toLocaleString()}번 클릭</div>
            <button onClick={resetAnalytics} style={{ background: 'none', border: '1.5px solid #ffcdd2', borderRadius: 8, padding: '5px 12px', fontSize: 12, cursor: 'pointer', color: '#e57373', fontWeight: 600 }}>초기화</button>
          </div>
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 4px 20px rgba(255,107,157,.1)', border: '1.5px solid var(--pk4)', overflow: 'hidden' }}>
            {analyticsEntries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)', fontSize: 14 }}>아직 집계된 클릭이 없습니다.</div>
            ) : analyticsEntries.map(([key, count], idx) => {
              const pct = totalClicks > 0 ? Math.round(count / totalClicks * 100) : 0
              const label = SECTION_LABELS[key] ?? key
              return (
                <div key={key} style={{ padding: '11px 16px', borderBottom: idx < analyticsEntries.length - 1 ? '1px solid var(--gray1)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
                    <span style={{ fontWeight: 600 }}>{label}</span>
                    <span style={{ color: 'var(--pk)', fontWeight: 700 }}>{count.toLocaleString()}회 ({pct}%)</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--gray1)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--pk)', borderRadius: 3 }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Dev Requests tab */}
      {tab === 'devRequests' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>
              총 {devRequests.length}건 · 미읽음 {devRequests.filter(r => !r.isRead).length}건
            </div>
            <button onClick={deleteAllRequests} style={{ background: 'none', border: '1.5px solid #ffcdd2', borderRadius: 8, padding: '5px 12px', fontSize: 12, cursor: 'pointer', color: '#e57373', fontWeight: 600 }}>전체 삭제</button>
          </div>
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 4px 20px rgba(255,107,157,.1)', border: '1.5px solid var(--pk4)', overflow: 'hidden' }}>
            {devRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)', fontSize: 14 }}>접수된 요청이 없습니다.</div>
            ) : [...devRequests].reverse().map((req, idx) => (
              <div key={req.id} style={{ padding: '13px 16px', borderBottom: idx < devRequests.length - 1 ? '1px solid var(--gray1)' : 'none', background: req.isRead ? '#fff' : 'var(--pk5)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {!req.isRead && <span style={{ background: 'var(--pk)', color: '#fff', borderRadius: 4, padding: '1px 5px', fontSize: 10, fontWeight: 700 }}>NEW</span>}
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{req.nick}</span>
                    <span style={{ fontSize: 11, color: 'var(--text2)' }}>{fmtDateTime(req.createdAt)}</span>
                  </div>
                  {!req.isRead && (
                    <button onClick={() => markRequestRead(req.id)} style={{ background: 'none', border: '1.5px solid var(--gray2)', borderRadius: 6, padding: '3px 9px', fontSize: 11, cursor: 'pointer', color: 'var(--text2)', fontWeight: 600 }}>읽음</button>
                  )}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {req.content.length > 120 ? req.content.slice(0, 120) + '...' : req.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Backup tab */}
      {tab === 'backup' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            ['📥 전체 사용자 데이터 JSON 다운로드', () => downloadJSON({ users: allUsers, exportedAt: new Date().toISOString() }, `all_users_${Date.now()}.json`)],
            ['📥 게시글/댓글 데이터 JSON 다운로드', () => downloadJSON({ posts: BoardService.getPosts(), exportedAt: new Date().toISOString() }, `board_${Date.now()}.json`)],
          ].map(([label, fn]) => (
            <button key={label as string} onClick={fn as () => void} style={{ background: '#fff', border: '1.5px solid var(--pk)', borderRadius: 12, padding: '18px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', color: 'var(--pk)', textAlign: 'left' }}>
              {label as string}
            </button>
          ))}
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
            백업 생성: {new Date().toLocaleString('ko-KR')}
          </div>
        </div>
      )}
    </div>
  )
}
