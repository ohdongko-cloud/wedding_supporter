import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { BoardService } from '../services/boardService'
import type { Post } from '../types'
import RichEditor from '../components/RichEditor'

type View = 'list' | 'detail' | 'edit'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}
function displayAuthor(nick: string) { return nick === 'admin' ? '주인장' : nick }

export default function BoardPage() {
  const user = useAuthStore(s => s.user)!
  const isAdmin = user.nick === 'admin'
  const [view, setView] = useState<View>('list')
  const [posts, setPosts] = useState<Post[]>([])
  const [selected, setSelected] = useState<Post | null>(null)
  const [editData, setEditData] = useState<Partial<Post> | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [commentInput, setCommentInput] = useState('')
  const [likedIds, setLikedIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(sessionStorage.getItem(`likes_${user.nick}`) || '[]')) } catch { return new Set() }
  })

  useEffect(() => { setPosts(BoardService.getPosts()) }, [])

  function reload() { setPosts(BoardService.getPosts()) }

  function openDetail(post: Post) {
    BoardService.incrementView(post.id)
    const updated = BoardService.getPost(post.id)
    setSelected(updated ?? post)
    setView('detail')
    reload()
  }

  function openCreate() { setEditData({ title: '', content: '', isNotice: false }); setView('edit') }
  function openEdit(post: Post) { setEditData({ ...post }); setView('edit') }

  function submitPost() {
    if (!editData?.title?.trim() || !editData?.content?.trim()) return
    if (editData.id) BoardService.updatePost(editData.id, editData.title, editData.content)
    else BoardService.createPost(user.nick, editData.title, editData.content, editData.isNotice || false)
    reload(); setView('list')
  }

  function deletePost(id: string) {
    if (!confirm('글을 삭제할까요?')) return
    BoardService.deletePost(id); reload(); setView('list')
  }

  function addComment() {
    if (!selected || !commentInput.trim()) return
    BoardService.addComment(selected.id, user.nick, commentInput.trim())
    setCommentInput('')
    const updated = BoardService.getPost(selected.id)
    if (updated) { setSelected(updated); reload() }
  }

  function deleteComment(idx: number) {
    if (!selected) return
    BoardService.deleteComment(selected.id, idx)
    const updated = BoardService.getPost(selected.id)
    if (updated) { setSelected(updated); reload() }
  }

  function toggleLike(post: Post) {
    const liked = likedIds.has(post.id)
    BoardService.toggleLike(post.id, !liked)
    const newSet = new Set(likedIds)
    liked ? newSet.delete(post.id) : newSet.add(post.id)
    setLikedIds(newSet)
    sessionStorage.setItem(`likes_${user.nick}`, JSON.stringify([...newSet]))
    reload()
    const updated = BoardService.getPost(post.id)
    if (updated && selected?.id === post.id) setSelected(updated)
  }

  const filtered = posts.filter(p => p.title.includes(search) || p.author.includes(search))
  const sorted = [...filtered.filter(p => p.isNotice), ...filtered.filter(p => !p.isNotice)]
  const totalPages = Math.ceil(sorted.length / perPage)
  const pagePosts = sorted.slice((page - 1) * perPage, page * perPage)

  /* ---- Edit view ---- */
  if (view === 'edit') {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button onClick={() => setView('list')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--pk)' }}>←</button>
          <span style={{ fontSize: 16, fontWeight: 800 }}>{editData?.id ? '글 수정' : '글 작성'}</span>
        </div>
        {isAdmin && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 13, fontWeight: 600, color: 'var(--pk)', cursor: 'pointer' }}>
            <input type='checkbox' checked={editData?.isNotice || false} onChange={e => setEditData(p => ({ ...p!, isNotice: e.target.checked }))} />
            공지글로 등록
          </label>
        )}
        <input
          value={editData?.title || ''} onChange={e => setEditData(p => ({ ...p!, title: e.target.value }))}
          placeholder='제목을 입력하세요'
          style={{ width: '100%', border: '1.5px solid var(--gray2)', borderRadius: 10, padding: '11px 14px', fontSize: 15, fontWeight: 700, outline: 'none', marginBottom: 10, boxSizing: 'border-box' }}
        />
        <RichEditor
          value={editData?.content || ''}
          onChange={html => setEditData(p => ({ ...p!, content: html }))}
          placeholder='내용을 입력하세요 (최대 10,000자)'
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={() => setView('list')} style={{ flex: 1, background: 'var(--gray1)', color: 'var(--text2)', border: 'none', borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>취소</button>
          <button onClick={submitPost} style={{ flex: 2, background: 'var(--pk)', color: '#fff', border: 'none', borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>저장</button>
        </div>
      </div>
    )
  }

  /* ---- Detail view ---- */
  if (view === 'detail' && selected) {
    const post = BoardService.getPost(selected.id) ?? selected
    const isOwner = post.author === user.nick || isAdmin
    return (
      <div>
        <button onClick={() => { setView('list'); reload() }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--pk)', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>← 목록으로</button>
        <div style={{ background: '#fff', borderRadius: 14, padding: '20px', boxShadow: '0 4px 20px rgba(255,107,157,.1)', border: '1.5px solid var(--pk4)', marginBottom: 12 }}>
          {post.isNotice && <span style={{ background: 'var(--pk)', color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, marginRight: 8 }}>공지</span>}
          <div style={{ fontSize: 18, fontWeight: 800, margin: post.isNotice ? '10px 0 8px' : '0 0 8px' }}>{post.title}</div>
          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>
            <span>{displayAuthor(post.author)}</span><span>{fmtDate(post.createdAt)}</span><span>조회 {post.views}</span>
          </div>
          <div
            style={{ fontSize: 14, lineHeight: 1.85, borderTop: '1px solid var(--gray1)', paddingTop: 14, overflowX: 'auto' }}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--gray1)' }}>
            <button onClick={() => toggleLike(post)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: likedIds.has(post.id) ? 'var(--pk5)' : 'var(--gray1)', color: likedIds.has(post.id) ? 'var(--pk)' : 'var(--text2)', border: 'none', borderRadius: 20, padding: '7px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              ❤️ {post.likes}
            </button>
            {isOwner && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => openEdit(post)} style={{ background: 'none', border: '1.5px solid var(--gray2)', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>수정</button>
                <button onClick={() => deletePost(post.id)} style={{ background: 'none', border: '1.5px solid #ffcdd2', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer', color: '#e57373', fontWeight: 600 }}>삭제</button>
              </div>
            )}
          </div>
        </div>

        {/* Comments */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', boxShadow: '0 4px 20px rgba(255,107,157,.1)', border: '1.5px solid var(--pk4)' }}>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>댓글 {post.comments.length}</div>
          {post.comments.map((c, i) => (
            <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid var(--gray1)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--pk)', marginBottom: 4 }}>
                  {displayAuthor(c.author)} <span style={{ color: 'var(--text2)', fontWeight: 400 }}>{fmtDate(c.createdAt)}</span>
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.6 }}>{c.content}</div>
              </div>
              {(c.author === user.nick || isAdmin) && (
                <button onClick={() => deleteComment(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', fontSize: 12, flexShrink: 0 }}>삭제</button>
              )}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input
              value={commentInput} onChange={e => setCommentInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addComment()}
              placeholder='댓글을 입력하세요'
              style={{ flex: 1, border: '1.5px solid var(--gray2)', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', background: 'var(--pk5)' }}
            />
            <button onClick={addComment} style={{ background: 'var(--pk)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>작성</button>
          </div>
        </div>
      </div>
    )
  }

  /* ---- List view ---- */
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <input
          value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder='제목 / 작성자 검색'
          style={{ flex: 1, minWidth: 150, border: '1.5px solid var(--gray2)', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none' }}
        />
        <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }} style={{ border: '1.5px solid var(--gray2)', borderRadius: 8, padding: '9px 12px', fontSize: 13, cursor: 'pointer' }}>
          <option value={10}>10개</option><option value={15}>15개</option><option value={30}>30개</option>
        </select>
        <button onClick={openCreate} style={{ background: 'var(--pk)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>✏️ 글 작성</button>
      </div>

      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 4px 20px rgba(255,107,157,.1)', border: '1.5px solid var(--pk4)', overflow: 'hidden' }}>
        {pagePosts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text2)', fontSize: 14 }}>
            게시글이 없습니다. 첫 번째 꿀팁을 작성해보세요! ✨
          </div>
        ) : pagePosts.map((post, idx) => (
          <div key={post.id} onClick={() => openDetail(post)} style={{ padding: '13px 16px', borderBottom: idx < pagePosts.length - 1 ? '1px solid var(--gray1)' : 'none', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              {post.isNotice && <span style={{ background: 'var(--pk)', color: '#fff', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>공지</span>}
              <span style={{ fontSize: 14, fontWeight: post.isNotice ? 800 : 600, flex: 1 }}>{post.title}</span>
              {post.comments.length > 0 && <span style={{ fontSize: 12, color: 'var(--pk)', fontWeight: 700, flexShrink: 0 }}>[{post.comments.length}]</span>}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', gap: 10 }}>
              <span>{displayAuthor(post.author)}</span><span>{fmtDate(post.createdAt)}</span><span>조회 {post.views}</span><span>❤️ {post.likes}</span>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14 }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} style={{ width: 32, height: 32, border: 'none', borderRadius: 8, background: p === page ? 'var(--pk)' : 'var(--gray1)', color: p === page ? '#fff' : 'var(--text)', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>{p}</button>
          ))}
        </div>
      )}
    </div>
  )
}
