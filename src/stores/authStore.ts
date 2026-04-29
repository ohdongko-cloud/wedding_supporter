import { create } from 'zustand'
import type { AuthUser, UserData } from '../types'
import { StorageService, userKey } from '../services/storage'
import { CHECKLIST_STAGES } from '../data/checklistSeed'
import { supabase } from '../services/supabaseClient'

export function hashPin(pin: string): string {
  let h = 0
  for (let i = 0; i < pin.length; i++) h = ((h * 31 + pin.charCodeAt(i)) >>> 0)
  return h.toString(36)
}

type CalcState = import('../types').CalcState

function makeDefaultCalcState(catKeys: string[], isWedding = false): CalcState {
  const cats: Record<string, import('../types').CalcCategory> = {}
  catKeys.forEach(c => { cats[c] = { defItems: [], customItems: [] } })
  return {
    budget: 0,
    mealCount: isWedding ? 200 : 0,
    mealPrice: isWedding ? 77000 : 99000,
    mealCustom: 0,
    venueHall: isWedding ? '명동성당' : '',
    venueRoom: isWedding ? '파밀리아홀' : '',
    venueDirect: isWedding ? 200 : 0,
    cats, totalCost: 0,
  }
}

function calcDeadline(weddingDate: Date, time: string): string | undefined {
  if (!time) return undefined
  if (time === 'D-day') return weddingDate.toISOString().slice(0, 10)
  const match = time.match(/^D([+-])(\d+)$/)
  if (!match) return undefined
  const sign = match[1] === '+' ? 1 : -1
  const days = parseInt(match[2])
  const d = new Date(weddingDate)
  d.setDate(d.getDate() + sign * days)
  return d.toISOString().slice(0, 10)
}

function makeDefaultHoneymoonPlan(): import('../types').HoneymoonPlanState {
  const uid = () => Math.random().toString(36).slice(2)
  return {
    budget: 0,
    days: [{
      id: uid(), dayNumber: 1, date: '', isOpen: true,
      items: [
        { id: uid(), time: '', reserved: false, title: '비행기', detail: '', amount: 0, note: '항공편 정보 입력' },
        { id: uid(), time: '', reserved: false, title: '숙소', detail: '', amount: 0, note: '체크인 정보 입력' },
        { id: uid(), time: '', reserved: false, title: '유심', detail: '', amount: 0, note: '현지 유심 또는 포켓와이파이' },
        { id: uid(), time: '', reserved: false, title: '여행자 보험', detail: '', amount: 0, note: '보험사/증권번호 입력' },
      ]
    }]
  }
}

export function buildDefaultUserData(nick: string, pinHash: string): UserData {
  const defaultWeddingDate = new Date()
  defaultWeddingDate.setFullYear(defaultWeddingDate.getFullYear() + 1)
  const weddingDateStr = defaultWeddingDate.toISOString().slice(0, 10)

  const checklist: UserData['checklist'] = {}
  CHECKLIST_STAGES.forEach(s => {
    checklist[s.id] = {
      items: s.items.map(it => ({
        id: it.id,
        completed: false,
        hidden: false,
        deadline: it.time ? calcDeadline(defaultWeddingDate, it.time) : undefined,
      })),
      customItems: [],
    }
  })
  return {
    nick, pinHash, weddingDate: weddingDateStr, totalBudget: 0, checklist,
    calcWedding: makeDefaultCalcState(['wedding', 'studio', 'dress', 'makeup', 'etc'], true),
    calcHoneymoon: makeDefaultCalcState(['flight', 'accommodation', 'food', 'transport', 'activity', 'shopping', 'insurance', 'etc']),
    calcHouse: makeDefaultCalcState(['deposit', 'loan', 'agent', 'moving', 'appliance', 'furniture', 'interior', 'supplies', 'etc']),
    venueName: '',
    memos: [], createdAt: new Date().toISOString(), lastLoginAt: new Date().toISOString(),
    honeymoonPlan: makeDefaultHoneymoonPlan(),
    hasSeenTour: false,
  }
}

// Supabase 동기화 헬퍼
async function syncToCloud(nick: string, pinHash: string, data: UserData) {
  if (!supabase) return
  await supabase.from('users').upsert({
    nick: nick.toLowerCase(),
    pin_hash: pinHash,
    data,
    updated_at: new Date().toISOString(),
  })
}

const ADMIN_HASH = hashPin('kims6804!')

export function seedAdminUser() {
  const existing = StorageService.get<UserData>(userKey('admin'))
  if (existing) {
    StorageService.set(userKey('admin'), { ...existing, pinHash: ADMIN_HASH })
  } else {
    const data = buildDefaultUserData('admin', ADMIN_HASH)
    StorageService.set(userKey('admin'), data)
    StorageService.addToRegistry('admin')
  }
}

interface AuthState {
  user: AuthUser | null; userData: UserData | null
  isDirty: boolean; lastSavedAt: string | null; isLoading: boolean
  login: (nick: string, pin: string) => Promise<{ ok: boolean; error?: string }>
  register: (nick: string, pin: string) => Promise<{ ok: boolean; error?: string }>
  loginAnon: () => void; logout: () => void
  saveUserData: () => void; setUserData: (data: UserData) => void
  markDirty: () => void; markClean: () => void
  deleteAccount: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null, userData: null, isDirty: false, lastSavedAt: null, isLoading: false,

  async register(nick, pin) {
    if (nick.trim().length < 2) return { ok: false, error: '닉네임은 2자 이상 입력해주세요.' }
    if (nick.toLowerCase() === 'admin') return { ok: false, error: '사용할 수 없는 닉네임이에요.' }
    if (pin.length < 6) return { ok: false, error: '비밀번호 6자리를 모두 입력해주세요.' }

    set({ isLoading: true })
    // 닉네임 중복 확인: 클라우드 우선, 없으면 로컬
    if (supabase) {
      const { data } = await supabase.from('users').select('nick').eq('nick', nick.toLowerCase()).maybeSingle()
      if (data) { set({ isLoading: false }); return { ok: false, error: '이미 사용 중인 닉네임이에요.' } }
    } else {
      if (StorageService.get<UserData>(userKey(nick))) { set({ isLoading: false }); return { ok: false, error: '이미 사용 중인 닉네임이에요.' } }
    }

    const ph = hashPin(pin)
    const userData = buildDefaultUserData(nick, ph)
    StorageService.set(userKey(nick), userData)
    StorageService.addToRegistry(nick)
    await syncToCloud(nick, ph, userData)
    set({ user: { nick, pinHash: ph }, userData, isLoading: false })
    return { ok: true }
  },

  async login(nick, pin) {
    if (!nick) return { ok: false, error: '닉네임을 입력해주세요.' }
    if (pin.length < 6) return { ok: false, error: '비밀번호 6자리를 모두 입력해주세요.' }

    set({ isLoading: true })
    const ph = hashPin(pin)

    // 클라우드에서 먼저 조회
    if (supabase) {
      const { data: row } = await supabase.from('users').select('pin_hash, data').eq('nick', nick.toLowerCase()).maybeSingle()
      if (row) {
        if (row.pin_hash !== ph) { set({ isLoading: false }); return { ok: false, error: '비밀번호가 일치하지 않아요.' } }
        const userData = row.data as UserData
        userData.lastLoginAt = new Date().toISOString()
        StorageService.set(userKey(nick), userData)
        StorageService.addToRegistry(nick)
        syncToCloud(nick, ph, userData)
        set({ user: { nick, pinHash: ph }, userData, isLoading: false })
        return { ok: true }
      }
    }

    // 로컬 폴백 (Supabase 미설정 or 네트워크 오류 시)
    const saved = StorageService.get<UserData>(userKey(nick))
    if (!saved) { set({ isLoading: false }); return { ok: false, error: '저장된 데이터가 없어요.' } }
    if (saved.pinHash !== ph) { set({ isLoading: false }); return { ok: false, error: '비밀번호가 일치하지 않아요.' } }
    saved.lastLoginAt = new Date().toISOString()
    StorageService.set(userKey(nick), saved)
    StorageService.addToRegistry(nick)
    // 로컬 데이터를 클라우드로 마이그레이션
    syncToCloud(nick, ph, saved)
    set({ user: { nick, pinHash: ph }, userData: saved, isLoading: false })
    return { ok: true }
  },

  loginAnon() {
    const data = buildDefaultUserData('게스트', '')
    set({ user: { nick: '게스트', pinHash: '' }, userData: data, isDirty: false, lastSavedAt: null })
  },

  logout() { set({ user: null, userData: null, isDirty: false, lastSavedAt: null }) },

  saveUserData() {
    const { user, userData } = get()
    if (user && user.nick !== '게스트' && userData) {
      StorageService.set(userKey(user.nick), userData)
      set({ isDirty: false, lastSavedAt: new Date().toISOString() })
      syncToCloud(user.nick, user.pinHash, userData)
    }
  },

  setUserData(data) { set({ userData: data, isDirty: true }) },
  markDirty() { set({ isDirty: true }) },
  markClean() { set({ isDirty: false }) },

  deleteAccount() {
    const { user } = get()
    if (!user || user.nick === '게스트') return
    StorageService.removeFromRegistry(user.nick)
    StorageService.del(userKey(user.nick))
    if (supabase) supabase.from('users').delete().eq('nick', user.nick.toLowerCase())
    set({ user: null, userData: null })
  },
}))
