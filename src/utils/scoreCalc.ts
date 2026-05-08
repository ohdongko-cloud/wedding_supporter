// src/utils/scoreCalc.ts
import type { UserData } from '../types'

// ── 1. 예산 배분 완료도 (0~100) ───────────────────────────────────
export function calcBudgetScore(userData: UserData): number {
  let checked = 0, total = 0
  const calcs = [userData.calcWedding, userData.calcHoneymoon, userData.calcHouse]
  calcs.forEach(cs => {
    Object.values(cs.cats).forEach(cat => {
      cat.defItems.forEach(it => {
        if (!it.deleted) { total++; if (it.checked) checked++ }
      })
      cat.customItems.forEach(it => { total++; if (it.checked) checked++ })
    })
  })
  return total > 0 ? Math.round((checked / total) * 100) : 0
}

// ── 2. 영역별 완료도 (ScoreCard 프로그레스 바용) ─────────────────
export function calcAreaScore(cs: UserData['calcWedding']): number {
  let checked = 0, total = 0
  Object.values(cs.cats).forEach(cat => {
    cat.defItems.forEach(it => {
      if (!it.deleted) { total++; if (it.checked) checked++ }
    })
    cat.customItems.forEach(it => { total++; if (it.checked) checked++ })
  })
  return total > 0 ? Math.round((checked / total) * 100) : 0
}

// ── 3. D-day 타임라인 건강도 (0~100) ─────────────────────────────
export function calcTimelineScore(urgentCount: number): number {
  return Math.max(0, 100 - urgentCount * 25)
}

// ── 4. 종합 결혼 준비 스코어 (0~100) ─────────────────────────────
export function calcDdalkakScore(params: {
  checklistPct: number
  urgentCount: number
  userData: UserData
}): number {
  const { checklistPct, urgentCount, userData } = params
  return Math.round(
    checklistPct * 0.40
    + calcBudgetScore(userData) * 0.35
    + calcTimelineScore(urgentCount) * 0.25
  )
}

// ── 5. 점수 레이블 ────────────────────────────────────────────────
export function getScoreLabel(score: number): { text: string; emoji: string } {
  if (score >= 96) return { text: '완벽 준비 완료!', emoji: '🏆' }
  if (score >= 86) return { text: '마무리 단계예요!', emoji: '🎊' }
  if (score >= 71) return { text: '잘 하고 있어요!', emoji: '✨' }
  if (score >= 51) return { text: '순항 중이에요!', emoji: '💪' }
  if (score >= 31) return { text: '하나씩 채워가고 있어요', emoji: '⛵' }
  if (score >= 11) return { text: '첫걸음을 내디뎠어요', emoji: '🌱' }
  return { text: '결혼 준비를 시작해봐요', emoji: '💍' }
}

// ── 6. 전날 점수 캐시 (localStorage, UserData 비침투) ─────────────
const CACHE_KEY = 'weddingApp:scoreCache'

interface ScoreCache { score: number; date: string }

export function saveScoreCache(score: number): void {
  const today = new Date().toISOString().slice(0, 10)
  const cache: ScoreCache = { score, date: today }
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)) } catch { /* ignore */ }
}

export function getYesterdayScore(): number | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const cache: ScoreCache = JSON.parse(raw)
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    return cache.date === yesterday ? cache.score : null
  } catch { return null }
}
