import { supabase } from './supabaseClient'
import { StorageService } from './storage'
import type { Post, Comment, PostAttachment } from '../types'

const BOARD_KEY = 'board_data'
const MIGRATION_DONE_KEY = 'weddingApp:board_migrated_v3'  // bump to force re-run

/* ── Supabase row shape ──────────────────────────────────────── */
interface BoardRow {
  id: string
  title: string
  content: string
  author: string
  is_notice: boolean
  views: number
  likes: number
  comments: Comment[]
  attachments: PostAttachment[]
  created_at: string
  updated_at: string | null
  category?: string
}

function rowToPost(row: BoardRow): Post {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    author: row.author,
    isNotice: row.is_notice,
    views: row.views,
    likes: row.likes,
    comments: (row.comments as unknown as Comment[]) || [],
    attachments: (row.attachments as unknown as PostAttachment[]) || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
    category: row.category ?? '꿀팁 정보',
  }
}

/* ── localStorage fallback ───────────────────────────────────── */
interface BoardData { posts: Post[]; nextId: number }
function loadLocal(): BoardData {
  return StorageService.get<BoardData>(BOARD_KEY) ?? { posts: [], nextId: 1 }
}
function saveLocal(data: BoardData) { StorageService.set(BOARD_KEY, data) }

/* ── Notice seed content ─────────────────────────────────────── */
const NOTICE_TITLE = '📌 딸깍, 결혼비용 계산기 이용 방법 안내'
const NOTICE_CONTENT = `안녕하세요! 딸깍, 결혼비용 계산기를 이용해 주셔서 감사합니다 💍

━━━━━━━━━━━━━━━━━━━━━━━
📋 주요 기능 안내
━━━━━━━━━━━━━━━━━━━━━━━

✅ 전체 일정관리
결혼 준비 전 과정의 체크리스트를 단계별로 확인하세요.
결혼 예정일을 설정하면 각 항목의 마감일이 자동으로 계산됩니다.
직접 항목을 추가·숨김 처리할 수도 있어요.

💒 결혼식 비용 계산기
스드메(스튜디오·드레스·메이크업), 예식장, 기타 비용을 항목별로 계산하세요.
하객 수와 식대를 입력하면 식비도 자동 산출됩니다.

✈️ 신혼여행 계획
DAY별 일정과 예약 현황, 비용을 한눈에 관리하세요.
비행기·숙소·유심 등 기본 항목이 미리 준비되어 있어요.

🏡 신혼집 마련 계획
매매·전세·월세별 자금 계획과 대출 정보를 정리하세요.
인테리어·가전·가구 예산도 함께 관리할 수 있어요.

📝 나만의 메모장
결혼 준비 중 메모할 내용을 자유롭게 기록하세요.

━━━━━━━━━━━━━━━━━━━━━━━
💾 데이터 저장 안내
━━━━━━━━━━━━━━━━━━━━━━━

• 닉네임 + 숫자 6자리 비밀번호로 가입하면 데이터가 저장됩니다.
• 데이터는 사용 중인 기기의 브라우저에 저장되므로, 다른 기기에서는 불러올 수 없어요.
• 둘러보기(게스트) 모드는 저장이 되지 않습니다.

━━━━━━━━━━━━━━━━━━━━━━━
💬 문의 및 개선 요청
━━━━━━━━━━━━━━━━━━━━━━━

메뉴 → 개선 요청 버튼으로 불편한 점이나 원하는 기능을 알려주세요.
더 좋은 서비스로 발전하겠습니다 🙏`

/* ═══════════════════════════════════════════════════════════════
   BoardService  (Supabase-first, localStorage fallback)
═══════════════════════════════════════════════════════════════ */
export const BoardService = {

  /* ── Read ───────────────────────────────────────────────────── */
  async getPosts(): Promise<Post[]> {
    if (!supabase) return loadLocal().posts
    const { data, error } = await supabase
      .from('board_posts')
      .select('*')
      .order('is_notice', { ascending: false })
      .order('created_at', { ascending: false })
    if (error || !data) return loadLocal().posts

    const serverPosts = data.map(r => rowToPost(r as BoardRow))
    const serverIds = new Set(serverPosts.map(p => p.id))

    // localStorage에만 있는 글을 병합 (Supabase 미이전 글 보완)
    const local = loadLocal()
    const localOnly = local.posts.filter(p => !serverIds.has(p.id))
    if (localOnly.length > 0) {
      // 없는 글은 Supabase에 background upload (attachments 제외 - base64 크기 제한)
      const rows = localOnly.map(p => ({
        id: p.id, title: p.title, content: p.content, author: p.author,
        is_notice: p.isNotice, views: p.views, likes: p.likes,
        comments: p.comments, attachments: [],
        created_at: p.createdAt, updated_at: p.updatedAt ?? null,
      }))
      void supabase.from('board_posts').upsert(rows, { onConflict: 'id', ignoreDuplicates: true })
      // 현재 렌더링에서도 병합해서 반환
      const merged = [...serverPosts, ...localOnly]
        .sort((a, b) => {
          if (a.isNotice !== b.isNotice) return a.isNotice ? -1 : 1
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
      return merged
    }
    return serverPosts
  },

  async getPost(id: string): Promise<Post | null> {
    if (!supabase) return loadLocal().posts.find(p => p.id === id) ?? null
    const { data, error } = await supabase
      .from('board_posts').select('*').eq('id', id).single()
    if (!error && data) return rowToPost(data as BoardRow)
    // Supabase에 없으면 localStorage에서도 확인 (마이그레이션 전 fallback)
    const localPost = loadLocal().posts.find(p => p.id === id) ?? null
    if (localPost && supabase) {
      // 발견 즉시 Supabase에 업로드 (lazy migration, attachments 제외)
      void supabase.from('board_posts').upsert({
        id: localPost.id, title: localPost.title, content: localPost.content,
        author: localPost.author, is_notice: localPost.isNotice,
        views: localPost.views, likes: localPost.likes,
        comments: localPost.comments, attachments: [],
        created_at: localPost.createdAt, updated_at: localPost.updatedAt ?? null,
      }, { onConflict: 'id', ignoreDuplicates: true })
    }
    return localPost
  },

  /* ── Write ──────────────────────────────────────────────────── */
  async createPost(
    author: string, title: string, content: string,
    isNotice = false, attachments: PostAttachment[] = [], category = '꿀팁 정보'
  ): Promise<Post> {
    const now = new Date().toISOString()
    if (!supabase) {
      const local = loadLocal()
      const post: Post = {
        id: String(local.nextId++), title, content, author, isNotice,
        views: 0, likes: 0, comments: [], createdAt: now, attachments, category,
      }
      local.posts.unshift(post); saveLocal(local); return post
    }
    const id = crypto.randomUUID()
    const { data, error } = await supabase
      .from('board_posts')
      // Supabase에는 attachments base64 제외 (크기 제한)
      .insert({ id, title, content, author, is_notice: isNotice, views: 0, likes: 0, comments: [], attachments: [], created_at: now, category })
      .select().single()
    if (error || !data) throw new Error(error?.message ?? 'create failed')
    // 반환 Post에 원본 attachments 복원 (현재 기기에서만 사용 가능)
    return { ...rowToPost(data as BoardRow), attachments }
  },

  async updatePost(id: string, title: string, content: string, attachments?: PostAttachment[]): Promise<boolean> {
    if (!supabase) {
      const local = loadLocal()
      const idx = local.posts.findIndex(p => p.id === id); if (idx === -1) return false
      local.posts[idx] = { ...local.posts[idx], title, content, updatedAt: new Date().toISOString(), attachments: attachments ?? local.posts[idx].attachments }
      saveLocal(local); return true
    }
    const upd: Record<string, unknown> = { title, content, updated_at: new Date().toISOString() }
    if (attachments !== undefined) upd.attachments = attachments
    const { error } = await supabase.from('board_posts').update(upd).eq('id', id)
    return !error
  },

  async deletePost(id: string): Promise<boolean> {
    // localStorage에서 항상 삭제 (재병합 방지)
    const local = loadLocal()
    const localIdx = local.posts.findIndex(p => p.id === id)
    if (localIdx !== -1) { local.posts.splice(localIdx, 1); saveLocal(local) }

    if (!supabase) return localIdx !== -1
    const { error } = await supabase.from('board_posts').delete().eq('id', id)
    return !error
  },

  /* ── Views / Likes ──────────────────────────────────────────── */
  async incrementView(id: string): Promise<void> {
    if (supabase) {
      const { data } = await supabase.from('board_posts').select('views').eq('id', id).single()
      if (data) await supabase.from('board_posts').update({ views: (data.views ?? 0) + 1 }).eq('id', id)
    } else {
      const local = loadLocal(); const p = local.posts.find(p => p.id === id)
      if (p) { p.views++; saveLocal(local) }
    }
  },

  async toggleLike(id: string, add: boolean): Promise<void> {
    if (supabase) {
      const { data } = await supabase.from('board_posts').select('likes').eq('id', id).single()
      if (data) {
        const next = Math.max(0, (data.likes ?? 0) + (add ? 1 : -1))
        await supabase.from('board_posts').update({ likes: next }).eq('id', id)
      }
    } else {
      const local = loadLocal(); const p = local.posts.find(p => p.id === id)
      if (p) { p.likes = Math.max(0, p.likes + (add ? 1 : -1)); saveLocal(local) }
    }
  },

  /* ── Comments ───────────────────────────────────────────────── */
  async addComment(postId: string, author: string, content: string): Promise<Comment | null> {
    const comment: Comment = { author, content, createdAt: new Date().toISOString() }
    if (!supabase) {
      const local = loadLocal(); const p = local.posts.find(p => p.id === postId); if (!p) return null
      p.comments.push(comment); saveLocal(local); return comment
    }
    const { data: row } = await supabase.from('board_posts').select('comments').eq('id', postId).single()
    if (!row) return null
    const comments = [...((row.comments as unknown as Comment[]) || []), comment]
    const { error } = await supabase.from('board_posts').update({ comments }).eq('id', postId)
    return error ? null : comment
  },

  async deleteComment(postId: string, idx: number): Promise<boolean> {
    if (!supabase) {
      const local = loadLocal(); const p = local.posts.find(p => p.id === postId)
      if (!p || idx < 0 || idx >= p.comments.length) return false
      p.comments.splice(idx, 1); saveLocal(local); return true
    }
    const { data: row } = await supabase.from('board_posts').select('comments').eq('id', postId).single()
    if (!row) return false
    const comments = [...((row.comments as unknown as Comment[]) || [])]
    if (idx < 0 || idx >= comments.length) return false
    comments.splice(idx, 1)
    const { error } = await supabase.from('board_posts').update({ comments }).eq('id', postId)
    return !error
  },

  /* ── Seed notice ────────────────────────────────────────────── */
  async seedNotice(): Promise<void> {
    if (!supabase) {
      const local = loadLocal()
      if (local.posts.some(p => p.id === 'notice-1')) return
      const notice: Post = {
        id: 'notice-1', title: NOTICE_TITLE, content: NOTICE_CONTENT,
        author: 'admin', isNotice: true, views: 0, likes: 0, comments: [],
        createdAt: '2026-04-29T00:00:00.000Z', category: '공지',
      }
      local.posts.unshift(notice); saveLocal(local); return
    }
    const { data } = await supabase.from('board_posts').select('id').eq('id', 'notice-1').maybeSingle()
    if (data) return
    await supabase.from('board_posts').insert({
      id: 'notice-1', title: NOTICE_TITLE, content: NOTICE_CONTENT,
      author: 'admin', is_notice: true, views: 0, likes: 0, comments: [], attachments: [],
      created_at: '2026-04-29T00:00:00.000Z', category: '공지',
    })
  },

  /* ── Migrate localStorage → Supabase ── */
  async migrateFromLocalStorage(): Promise<void> {
    if (!supabase) return
    const local = loadLocal()
    if (local.posts.length === 0) {
      localStorage.setItem(MIGRATION_DONE_KEY, '1')
      return
    }
    if (localStorage.getItem(MIGRATION_DONE_KEY)) return

    // Supabase에 없는 글만 골라서 upsert
    const { data: existing } = await supabase.from('board_posts').select('id')
    const existingIds = new Set((existing || []).map((r: { id: string }) => r.id))
    const toMigrate = local.posts.filter(p => !existingIds.has(p.id))

    if (toMigrate.length > 0) {
      // attachments base64 제외 (크기 초과 방지) - 첨부파일은 작성 기기에서만 확인 가능
      const rows = toMigrate.map(p => ({
        id: p.id, title: p.title, content: p.content, author: p.author,
        is_notice: p.isNotice, views: p.views, likes: p.likes,
        comments: p.comments, attachments: [],
        created_at: p.createdAt, updated_at: p.updatedAt ?? null,
      }))
      // 개별 upsert: 하나 실패해도 나머지 계속 시도
      for (const row of rows) {
        await supabase.from('board_posts').upsert(row, { onConflict: 'id', ignoreDuplicates: true })
      }
    }
    localStorage.setItem(MIGRATION_DONE_KEY, '1')
  },
}
