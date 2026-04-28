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
}
