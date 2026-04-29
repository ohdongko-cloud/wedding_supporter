import { StorageService } from './storage'
import type { Post, Comment } from '../types'

const BOARD_KEY = 'board_data'

interface BoardData { posts: Post[]; nextId: number }

function load(): BoardData {
  return StorageService.get<BoardData>(BOARD_KEY) ?? { posts: [], nextId: 1 }
}
function save(data: BoardData) { StorageService.set(BOARD_KEY, data) }

export const BoardService = {
  getPosts(): Post[] { return load().posts },
  getPost(id: string): Post | null { return load().posts.find(p => p.id === id) ?? null },
  createPost(author: string, title: string, content: string, isNotice = false): Post {
    const data = load()
    const post: Post = {
      id: String(data.nextId++), title, content, author, isNotice,
      views: 0, likes: 0, comments: [], createdAt: new Date().toISOString(),
    }
    data.posts.unshift(post)
    save(data)
    return post
  },
  updatePost(id: string, title: string, content: string): boolean {
    const data = load()
    const idx = data.posts.findIndex(p => p.id === id)
    if (idx === -1) return false
    data.posts[idx] = { ...data.posts[idx], title, content, updatedAt: new Date().toISOString() }
    save(data)
    return true
  },
  deletePost(id: string): boolean {
    const data = load()
    const idx = data.posts.findIndex(p => p.id === id)
    if (idx === -1) return false
    data.posts.splice(idx, 1)
    save(data)
    return true
  },
  incrementView(id: string) {
    const data = load()
    const post = data.posts.find(p => p.id === id)
    if (post) { post.views++; save(data) }
  },
  toggleLike(id: string, add: boolean) {
    const data = load()
    const post = data.posts.find(p => p.id === id)
    if (post) { post.likes = Math.max(0, post.likes + (add ? 1 : -1)); save(data) }
  },
  addComment(postId: string, author: string, content: string): Comment | null {
    const data = load()
    const post = data.posts.find(p => p.id === postId)
    if (!post) return null
    const comment: Comment = { author, content, createdAt: new Date().toISOString() }
    post.comments.push(comment)
    save(data)
    return comment
  },
  deleteComment(postId: string, idx: number): boolean {
    const data = load()
    const post = data.posts.find(p => p.id === postId)
    if (!post || idx < 0 || idx >= post.comments.length) return false
    post.comments.splice(idx, 1)
    save(data)
    return true
  },
  seedNotice(): void {
    const data = load()
    if (data.posts.some(p => p.id === 'notice-1')) return
    const notice: Post = {
      id: 'notice-1',
      title: '📌 딸깍, 결혼비용 계산기 이용 방법 안내',
      content: `안녕하세요! 딸깍, 결혼비용 계산기를 이용해 주셔서 감사합니다 💍

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
💬 문의 및 개발 요청
━━━━━━━━━━━━━━━━━━━━━━━

메뉴 → 개발 요청 버튼으로 불편한 점이나 원하는 기능을 알려주세요.
더 좋은 서비스로 발전하겠습니다 🙏`,
      author: 'admin',
      isNotice: true,
      views: 0,
      likes: 0,
      comments: [],
      createdAt: '2026-04-29T00:00:00.000Z',
    }
    data.posts.unshift(notice)
    save(data)
  },
}
