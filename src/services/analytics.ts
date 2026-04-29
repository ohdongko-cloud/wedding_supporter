import { StorageService } from './storage'

export const AnalyticsService = {
  track(section: string): void {
    const data: Record<string, number> = StorageService.get<Record<string, number>>('analytics') || {}
    data[section] = (data[section] || 0) + 1
    StorageService.set('analytics', data)
  },
  getAll(): Record<string, number> {
    return StorageService.get<Record<string, number>>('analytics') || {}
  },
  reset(): void {
    StorageService.set('analytics', {})
  },
}
