import { create } from 'zustand'
import type { AuthUser, UserData } from '../types'
import { StorageService, userKey } from '../services/storage'
import { CHECKLIST_STAGES } from '../data/checklistSeed'

export function hashPin(pin: string): string {
  let h = 0
  for (let i = 0; i < pin.length; i++) h = ((h * 31 + pin.charCodeAt(i)) >>> 0)
  return h.toString(36)
}

type CalcState = import('../types').CalcState

function makeDefaultCalcState(catKeys: string[]): CalcState {
  const cats: Record<string, import('../types').CalcCategory> = {}
  catKeys.forEach(c => { cats[c] = { defItems: [], customItems: [] } })
  return { budget: 0, mealCount: 300, mealPrice: 99000, mealCustom: 0, venueHall: '', venueRoom: '', venueDirect: 0, cats, totalCost: 0 }
}

export function buildDefaultUserData(nick: string, pinHash: string): UserData {
  const checklist: UserData['checklist'] = {}
  CHECKLIST_STAGES.forEach(s => {
    checklist[s.id] = {
      items: s.items.map(it => ({ id: it.id, completed: false, hidden: false })),
      customItems: [],
    }
  })
  return {
    nick, pinHash, weddingDate: '', totalBudget: 0, checklist,
    calcWedding: makeDefaultCalcState(['wedding', 'studio', 'dress', 'makeup', 'etc']),
    calcHoneymoon: makeDefaultCalcState(['flight', 'accommodation', 'food', 'transport', 'activity', 'shopping', 'insurance', 'etc']),
    calcHouse: makeDefaultCalcState(['deposit', 'loan', 'agent', 'moving', 'appliance', 'furniture', 'interior', 'supplies', 'etc']),
    venueName: '',
    memos: [], createdAt: new Date().toISOString(), lastLoginAt: new Date().toISOString(),
  }
}

const ADMIN_HASH = hashPin('kims6804!')

export function seedAdminUser() {
  const existing = StorageService.get<UserData>(userKey('admin'))
  if (existing) {
    // Always sync the admin password hash on every load
    StorageService.set(userKey('admin'), { ...existing, pinHash: ADMIN_HASH })
  } else {
    const data = buildDefaultUserData('admin', ADMIN_HASH)
    StorageService.set(userKey('admin'), data)
    StorageService.addToRegistry('admin')
  }
}

interface AuthState {
  user: AuthUser | null; userData: UserData | null
  login: (nick: string, pin: string) => { ok: boolean; error?: string }
  register: (nick: string, pin: string) => { ok: boolean; error?: string }
  loginAnon: () => void; logout: () => void
  saveUserData: () => void; setUserData: (data: UserData) => void
  deleteAccount: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null, userData: null,
  register(nick, pin) {
    if (nick.trim().length < 2) return { ok: false, error: '닉네임은 2자 이상 입력해주세요.' }
    if (nick.toLowerCase() === 'admin') return { ok: false, error: '사용할 수 없는 닉네임이에요.' }
    if (pin.length < 6) return { ok: false, error: '비밀번호 6자리를 모두 입력해주세요.' }
    const existing = StorageService.get<UserData>(userKey(nick))
    if (existing) return { ok: false, error: '이미 사용 중인 닉네임이에요.' }
    const ph = hashPin(pin)
    const data = buildDefaultUserData(nick, ph)
    StorageService.set(userKey(nick), data)
    StorageService.addToRegistry(nick)
    set({ user: { nick, pinHash: ph }, userData: data })
    return { ok: true }
  },
  login(nick, pin) {
    if (!nick) return { ok: false, error: '닉네임을 입력해주세요.' }
    if (pin.length < 6) return { ok: false, error: '비밀번호 6자리를 모두 입력해주세요.' }
    const saved = StorageService.get<UserData>(userKey(nick))
    if (!saved) return { ok: false, error: '저장된 데이터가 없어요.' }
    if (saved.pinHash !== hashPin(pin)) return { ok: false, error: '비밀번호가 일치하지 않아요.' }
    saved.lastLoginAt = new Date().toISOString()
    StorageService.set(userKey(nick), saved)
    StorageService.addToRegistry(nick)
    set({ user: { nick, pinHash: saved.pinHash }, userData: saved })
    return { ok: true }
  },
  loginAnon() { const data = buildDefaultUserData('게스트', ''); set({ user: { nick: '게스트', pinHash: '' }, userData: data }) },
  logout() { set({ user: null, userData: null }) },
  saveUserData() { const { user, userData } = get(); if (user && user.nick !== '게스트' && userData) StorageService.set(userKey(user.nick), userData) },
  setUserData(data) { set({ userData: data }) },
  deleteAccount() {
    const { user } = get()
    if (!user || user.nick === '게스트') return
    const data = StorageService.get<UserData>(userKey(user.nick))
    if (data) StorageService.set(userKey(user.nick), { ...data, pinHash: '__deleted__' })
    StorageService.removeFromRegistry(user.nick)
    set({ user: null, userData: null })
  },
}))
