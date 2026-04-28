const PREFIX = 'weddingApp:'
export const StorageService = {
  get<T>(key: string): T | null {
    try { const v = localStorage.getItem(PREFIX + key); return v ? (JSON.parse(v) as T) : null } catch { return null }
  },
  set<T>(key: string, value: T): void {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)) } catch { console.error('storage set failed', key) }
  },
  del(key: string): void { localStorage.removeItem(PREFIX + key) },
  addToRegistry(nick: string): void {
    const lower = nick.toLowerCase()
    const reg: string[] = StorageService.get<string[]>('registry') || []
    if (!reg.includes(lower)) { reg.push(lower); StorageService.set('registry', reg) }
  },
}
export function userKey(nick: string): string { return nick.toLowerCase() }