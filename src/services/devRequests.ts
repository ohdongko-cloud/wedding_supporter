import { StorageService } from './storage'

export interface DevRequest {
  id: string
  nick: string
  content: string
  createdAt: string
  isRead: boolean
}

export const DevRequestService = {
  getAll(): DevRequest[] {
    return StorageService.get<DevRequest[]>('devRequests') || []
  },
  add(nick: string, content: string): void {
    const requests = DevRequestService.getAll()
    requests.push({
      id: String(Date.now()),
      nick,
      content,
      createdAt: new Date().toISOString(),
      isRead: false,
    })
    StorageService.set('devRequests', requests)
  },
  markRead(id: string): void {
    const requests = DevRequestService.getAll()
    const req = requests.find(r => r.id === id)
    if (req) { req.isRead = true; StorageService.set('devRequests', requests) }
  },
  deleteAll(): void {
    StorageService.set('devRequests', [])
  },
  getUnreadCount(): number {
    return DevRequestService.getAll().filter(r => !r.isRead).length
  },
}
