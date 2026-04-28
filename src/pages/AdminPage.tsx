import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { StorageService } from '../services/storage'
import { BoardService } from '../services/boardService'
import type { UserData, Post } from '../types'

type Tab = 'users' | 'board' | 'backup'

function fmtDate(iso?: string) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('ko-KR')
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

export default function AdminPage() {
  const user = useAuthStore(s => s.user)!
  const [tab, setTab] = useState<Tab>('users')
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [posts, setPosts] = useState<Post[]>(() => BoardService.getPosts())

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

  const TABS: { key: Tab; label: string }[] = [
    { key: 'users', label: '사용자 목록' },
    { key: 'board', label: '게시판 관리' },
    { key: 'backup', label: '백업' },
  ]

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#fff', borderRadius: 12, padding: 5, boxShadow: '0 2px 12px rgba(255,107,157,.08)', border: '1.5px solid var(--pk4)' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setSelectedUser(null) }} style={{ flex: 1, border: 'none', borderRadius: 8, padding: '10px 6px', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: '.15s', background: tab === t.key ? 'var(--pk)' : 'none', color: tab === t.key ? '#fff' : 'var(--text2)' }}>
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
