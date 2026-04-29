import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { BoardService } from '../services/boardService'
import type { Post, PostAttachment } from '../types'
import RichEditor from '../components/RichEditor'

declare global { interface Window { Kakao: any } }

const MAX_FILE_SIZE = 3 * 1024 * 1024 // 3MB

function fmtFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return '🖼️'
  if (type.includes('pdf')) return '📄'
  if (type.includes('word') || type.includes('document')) return '📝'
  if (type.includes('sheet') || type.includes('excel')) return '📊'
  if (type.includes('zip') || type.includes('rar')) return '🗜️'
  return '📎'
}

type View = 'list' | 'detail' | 'edit'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}
function displayAuthor(nick: string) { return nick === 'admin' ? '주인장' : nick }

export default function BoardPage() {
  const user = useAuthStore(s => s.user)!
  const isAdmin = user.nick === 'admin'
  const location = useLocation()
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
  const [attachments, setAttachments] = useState<PostAttachment[]>([])
  const [fileError, setFileError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [shareToast, setShareToast] = useState('')

  useEffect(() => {
    const allPosts = BoardService.getPosts()
    setPosts(allPosts)
    // URL ?post=ID 직링크 처리
    const params = new URLSearchParams(location.search)
    const postId = params.get('post')
    if (postId) {
      const target = allPosts.find(p => p.id === postId)
      if (target) {
        BoardService.incrementView(postId)
        const updated = BoardService.getPost(postId)
        setSelected(updated ?? target)
        setView('detail')
      }
    }
  }, []) // eslint-disable-line

  function reload() { setPosts(BoardService.getPosts()) }

  function openDetail(post: Post) {
    BoardService.incrementView(post.id)
    const updated = BoardService.getPost(post.id)
    setSelected(updated ?? post)
    setView('detail')
    reload()
  }

  function openCreate() { setEditData({ title: '', content: '', isNotice: false }); setAttachments([]); setFileError(''); setView('edit') }
  function openEdit(post: Post) { setEditData({ ...post }); setAttachments(post.attachments ? [...post.attachments] : []); setFileError(''); setView('edit') }

  function submitPost() {
    if (!editData?.title?.trim() || !editData?.content?.trim()) return
    if (editData.id) BoardService.updatePost(editData.id, editData.title, editData.content, attachments)
    else BoardService.createPost(user.nick, editData.title, editData.content, editData.isNotice || false, attachments)
    setAttachments([]); reload(); setView('list')
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

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError('')
    const files = Array.from(e.target.files || [])
    const results: PostAttachment[] = [...attachments]
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) { setFileError(`"${file.name}" 파일이 3MB를 초과합니다.`); continue }
      const data = await fileToBase64(file)
      results.push({ name: file.name, size: file.size, type: file.type, data })
    }
    setAttachments(results)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeAttachment(idx: number) {
    setAttachments(prev => prev.filter((_, i) => i !== idx))
  }

  function showToast(msg: string) {
    setShareToast(msg)
    setTimeout(() => setShareToast(''), 2200)
  }

  function getShareUrl(postId: string) {
    const base = window.location.origin + window.location.pathname
    return `${base}?post=${postId}`
  }

  async function copyLink(postId: string) {
    const url = getShareUrl(postId)
    try {
      await navigator.clipboard.writeText(url)
      showToast('링크가 복사됐어요! 📋')
    } catch {
      showToast(url)
    }
  }

  function shareKakao(post: Post) {
    const url = getShareUrl(post.id)
    const imageUrl = `${window.location.origin}/og-image.png`
    // 본문 텍스트 미리보기 (HTML 태그 제거, 최대 60자)
    const plainText = post.content.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 60)
    const description = plainText || '딸깍, 결혼비용 계산기 게시판'

    const kakao = window.Kakao
    if (kakao && kakao.isInitialized?.()) {
      kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: post.title,
          description,
          imageUrl,
          link: { mobileWebUrl: url, webUrl: url },
        },
        buttons: [{ title: '게시글 보기', link: { mobileWebUrl: url, webUrl: url } }],
      })
      return
    }
    // Kakao SDK 미설정 시 Web Share API 사용 (모바일 기본 공유 시트)
    if (navigator.share) {
      navigator.share({ title: post.title, text: description, url }).catch(() => {})
    } else {
      copyLink(post.id)
      showToast('링크 복사됨 — 카카오톡에 붙여넣기 해주세요 📋')
    }
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

        {/* 파일 첨부 */}
        <div style={{ marginTop: 12, padding: '12px 14px', background: 'var(--pk5)', borderRadius: 10, border: '1.5px solid var(--gray2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>📎 파일 첨부</span>
            <span style={{ fontSize: 11, color: 'var(--text2)' }}>최대 3MB / 파일당</span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{ marginLeft: 'auto', background: 'var(--pk)', color: '#fff', border: 'none', borderRadius: 7, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >파일 선택</button>
          </div>
          <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} style={{ display: 'none' }} />
          {fileError && <div style={{ fontSize: 12, color: '#e57373', marginBottom: 6 }}>{fileError}</div>}
          {attachments.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {attachments.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', borderRadius: 7, padding: '6px 10px', border: '1px solid var(--gray2)' }}>
                  <span style={{ fontSize: 16 }}>{getFileIcon(f.type)}</span>
                  <span style={{ flex: 1, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--text2)', flexShrink: 0 }}>{fmtFileSize(f.size)}</span>
                  <button onClick={() => removeAttachment(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e57373', fontSize: 14, flexShrink: 0, padding: 0 }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

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
      <div style={{ position: 'relative' }}>
        {shareToast && (
          <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,.78)', color: '#fff', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 600, zIndex: 9999, whiteSpace: 'nowrap', maxWidth: '90vw', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {shareToast}
          </div>
        )}
        <button onClick={() => { setView('list'); reload() }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--pk)', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>← 목록으로</button>
        <div style={{ background: '#fff', borderRadius: 14, padding: '20px', boxShadow: '0 4px 20px rgba(255,107,157,.1)', border: '1.5px solid var(--pk4)', marginBottom: 12 }}>
          {post.isNotice && <span style={{ background: 'var(--pk)', color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, marginRight: 8 }}>공지</span>}
          <div style={{ fontSize: 18, fontWeight: 800, margin: post.isNotice ? '10px 0 8px' : '0 0 8px' }}>{post.title}</div>
          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>
            <span>{displayAuthor(post.author)}</span><span>{fmtDate(post.createdAt)}</span><span>조회 {post.views}</span>
          </div>
          {post.attachments && post.attachments.length > 0 && (
            <div style={{ marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid var(--gray1)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>📎 첨부파일 ({post.attachments.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {post.attachments.map((f, i) => (
                  <a key={i} href={f.data} download={f.name}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--pk5)', borderRadius: 8, padding: '7px 12px', border: '1px solid var(--pk4)', textDecoration: 'none', color: 'var(--text)' }}>
                    <span style={{ fontSize: 16 }}>{getFileIcon(f.type)}</span>
                    <span style={{ flex: 1, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--text2)', flexShrink: 0 }}>{fmtFileSize(f.size)}</span>
                    <span style={{ fontSize: 11, color: 'var(--pk)', fontWeight: 700, flexShrink: 0 }}>⬇ 다운로드</span>
                  </a>
                ))}
              </div>
            </div>
          )}
          <div
            style={{ fontSize: 14, lineHeight: 1.85, borderTop: '1px solid var(--gray1)', paddingTop: 14, overflowX: 'auto' }}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--gray1)', flexWrap: 'wrap', gap: 8 }}>
            <button onClick={() => toggleLike(post)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: likedIds.has(post.id) ? 'var(--pk5)' : 'var(--gray1)', color: likedIds.has(post.id) ? 'var(--pk)' : 'var(--text2)', border: 'none', borderRadius: 20, padding: '7px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              ❤️ {post.likes}
            </button>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {/* 공유 버튼 */}
              <button onClick={() => copyLink(post.id)} title="링크 복사" style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--gray1)', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: 'var(--text2)' }}>
                🔗 링크 복사
              </button>
              <button onClick={() => shareKakao(post)} title="카카오톡 공유" style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#FEE500', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#3C1E1E' }}>
                💬 카카오 공유
              </button>
              {isOwner && (
                <>
                  <button onClick={() => openEdit(post)} style={{ background: 'none', border: '1.5px solid var(--gray2)', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>수정</button>
                  <button onClick={() => deletePost(post.id)} style={{ background: 'none', border: '1.5px solid #ffcdd2', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', color: '#e57373', fontWeight: 600 }}>삭제</button>
                </>
              )}
            </div>
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
