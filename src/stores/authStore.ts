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

export function buildDefaultUserData(nick: string, pinHash: string, pinHint?: string): UserData {
  const defaultWeddingDate = new Date()
  defaultWeddingDate.setFullYear(defaultWeddingDate.getFullYear() + 1)
  const weddingDateStr = defaultWeddingDate.toISOString().slice(0, 10)

  const checklist: UserData['checklist'] = {}
  CHECKLIST_STAGES.forEach(s => {
    checklist[s.id] = {
      items: s.items.map(it => ({
        id: it.id, completed: false, hidden: false,
        deadline: it.time ? calcDeadline(defaultWeddingDate, it.time) : undefined,
      })),
      customItems: [],
    }
  })
  return {
    nick, pinHash, pinHint, weddingDate: weddingDateStr, totalBudget: 0, checklist,
    calcWedding: makeDefaultCalcState(['wedding', 'studio', 'dress', 'makeup', 'etc'], true),
    calcHoneymoon: makeDefaultCalcState(['flight', 'accommodation', 'food', 'transport', 'activity', 'shopping', 'insurance', 'etc']),
    calcHouse: makeDefaultCalcState(['deposit', 'loan', 'agent', 'moving', 'appliance', 'furniture', 'interior', 'supplies', 'etc']),
    venueName: '',
    memos: [], createdAt: new Date().toISOString(), lastLoginAt: new Date().toISOString(),
    honeymoonPlan: makeDefaultHoneymoonPlan(),
    hasSeenTour: false,
    hasSeenOnboarding: false,
  }
}

async function pushToCloud(nick: string, pinHash: string, data: UserData, updatedAt: string) {
  if (!supabase) return
  await supabase.from('users').upsert({ nick: nick.toLowerCase(), pin_hash: pinHash, data, updated_at: updatedAt })
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
  user: AuthUser | null
  userData: UserData | null
  isDirty: boolean
  localUpdatedAt: string | null
  isSaving: boolean
  isLoading: boolean
  login: (nick: string, pin: string) => Promise<{ ok: boolean; error?: string }>
  register: (nick: string, pin: string, pinHint?: string) => Promise<{ ok: boolean; error?: string }>
  loginAnon: () => void
  logout: () => void
  saveUserData: () => Promise<'saved' | 'conflict' | 'error'>
  forceSave: () => Promise<boolean>
  forceLoadFromCloud: () => Promise<boolean>
  setUserData: (data: UserData) => void
  markDirty: () => void
  markClean: (savedAt: string) => void
  deleteAccount: () => void
}

// ── 로그인 영속성 ──────────────────────────────────────────────
const AUTH_NICK_KEY = 'ws_auth_nick'
const AUTH_PH_KEY   = 'ws_auth_ph'

function saveAuthLocal(nick: string, ph: string) {
  try { localStorage.setItem(AUTH_NICK_KEY, nick); localStorage.setItem(AUTH_PH_KEY, ph) } catch {}
}
function clearAuthLocal() {
  try { localStorage.removeItem(AUTH_NICK_KEY); localStorage.removeItem(AUTH_PH_KEY) } catch {}
}
function loadAuthLocal(): { nick: string; ph: string } | null {
  try {
    const nick = localStorage.getItem(AUTH_NICK_KEY)
    const ph   = localStorage.getItem(AUTH_PH_KEY)
    return (nick && ph) ? { nick, ph } : null
  } catch { return null }
}

// 앱 시작 시 로컬 저장 인증 복구
const _saved = loadAuthLocal()
let _initUser: AuthUser = { nick: '게스트', pinHash: '' }
let _initUserData: UserData = buildDefaultUserData('게스트', '')
if (_saved) {
  const _localData = StorageService.get<UserData>(userKey(_saved.nick))
  if (_localData && _localData.pinHash === _saved.ph) {
    _initUser     = { nick: _saved.nick, pinHash: _saved.ph }
    _initUserData = _localData
  } else {
    clearAuthLocal()
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: _initUser,
  userData: _initUserData,
  isDirty: false, localUpdatedAt: null, isSaving: false, isLoading: false,

  async register(nick, pin, pinHint) {
    if (nick.trim().length < 2) return { ok: false, error: '닉네임은 2자 이상 입력해주세요.' }
    if (nick.toLowerCase() === 'admin') return { ok: false, error: '사용할 수 없는 닉네임이에요.' }
    if (pin.length < 6) return { ok: false, error: '비밀번호 6자리를 모두 입력해주세요.' }

    set({ isLoading: true })
    if (supabase) {
      const { data } = await supabase.from('users').select('nick').eq('nick', nick.toLowerCase()).maybeSingle()
      if (data) { set({ isLoading: false }); return { ok: false, error: '이미 사용 중인 닉네임이에요.' } }
    } else {
      if (StorageService.get<UserData>(userKey(nick))) { set({ isLoading: false }); return { ok: false, error: '이미 사용 중인 닉네임이에요.' } }
    }

    const ph = hashPin(pin)
    // 게스트로 입력한 데이터가 있으면 인계
    const guestData = get().userData
    const hasGuestData = guestData && guestData.nick === '게스트' &&
      (!!guestData.weddingDate || guestData.calcWedding.budget > 0 || guestData.totalBudget > 0)
    const userData = hasGuestData
      ? { ...guestData, nick, pinHash: ph, pinHint: pinHint?.trim() || undefined, createdAt: new Date().toISOString(), lastLoginAt: new Date().toISOString() }
      : buildDefaultUserData(nick, ph, pinHint?.trim() || undefined)
    const now = new Date().toISOString()
    StorageService.set(userKey(nick), userData)
    StorageService.addToRegistry(nick)
    await pushToCloud(nick, ph, userData, now)
    saveAuthLocal(nick, ph)
    set({ user: { nick, pinHash: ph }, userData, localUpdatedAt: now, isLoading: false })
    return { ok: true }
  },

  async login(nick, pin) {
    if (!nick) return { ok: false, error: '닉네임을 입력해주세요.' }
    if (pin.length < 6) return { ok: false, error: '비밀번호 6자리를 모두 입력해주세요.' }
    set({ isLoading: true })
    const ph = hashPin(pin)

    if (supabase) {
      const { data: row } = await supabase.from('users').select('pin_hash, data, updated_at').eq('nick', nick.toLowerCase()).maybeSingle()
      if (row) {
        if (row.pin_hash !== ph) {
          set({ isLoading: false })
          const hint = (row.data as UserData)?.pinHint
          return { ok: false, error: hint ? `비밀번호가 일치하지 않아요.\n힌트: ${hint}` : '비밀번호가 일치하지 않아요.' }
        }
        const userData = row.data as UserData
        userData.lastLoginAt = new Date().toISOString()
        StorageService.set(userKey(nick), userData)
        StorageService.addToRegistry(nick)
        saveAuthLocal(nick, ph)
        set({ user: { nick, pinHash: ph }, userData, localUpdatedAt: row.updated_at ?? null, isLoading: false })
        return { ok: true }
      }
    }

    const saved = StorageService.get<UserData>(userKey(nick))
    if (!saved) { set({ isLoading: false }); return { ok: false, error: '저장된 데이터가 없어요.' } }
    if (saved.pinHash !== ph) {
      set({ isLoading: false })
      const hint = saved.pinHint
      return { ok: false, error: hint ? `비밀번호가 일치하지 않아요.\n힌트: ${hint}` : '비밀번호가 일치하지 않아요.' }
    }
    saved.lastLoginAt = new Date().toISOString()
    StorageService.set(userKey(nick), saved)
    StorageService.addToRegistry(nick)
    const now = new Date().toISOString()
    pushToCloud(nick, ph, saved, now)
    saveAuthLocal(nick, ph)
    set({ user: { nick, pinHash: ph }, userData: saved, localUpdatedAt: now, isLoading: false })
    return { ok: true }
  },

  loginAnon() {
    clearAuthLocal()
    set({ user: { nick: '게스트', pinHash: '' }, userData: buildDefaultUserData('게스트', ''), isDirty: false, localUpdatedAt: null })
  },

  logout() {
    clearAuthLocal()
    set({ user: { nick: '게스트', pinHash: '' }, userData: buildDefaultUserData('게스트', ''), isDirty: false, localUpdatedAt: null })
  },

  async saveUserData() {
    const { user, userData, localUpdatedAt } = get()
    if (!user || user.nick === '게스트' || !userData) return 'saved'
    set({ isSaving: true })

    StorageService.set(userKey(user.nick), userData)

    if (supabase) {
      // 충돌 감지
      const { data: serverRow } = await supabase.from('users').select('updated_at').eq('nick', user.nick.toLowerCase()).maybeSingle()
      if (serverRow && localUpdatedAt && serverRow.updated_at !== localUpdatedAt) {
        set({ isSaving: false })
        return 'conflict'
      }
      const now = new Date().toISOString()
      const { error } = await supabase.from('users').upsert({ nick: user.nick.toLowerCase(), pin_hash: user.pinHash, data: userData, updated_at: now })
      if (error) { set({ isSaving: false }); return 'error' }
      set({ isDirty: false, localUpdatedAt: now, isSaving: false })
    } else {
      const now = new Date().toISOString()
      set({ isDirty: false, localUpdatedAt: now, isSaving: false })
    }
    return 'saved'
  },

  async forceSave() {
    const { user, userData } = get()
    if (!user || user.nick === '게스트' || !userData) return false
    set({ isSaving: true })
    const now = new Date().toISOString()
    StorageService.set(userKey(user.nick), userData)
    if (supabase) {
      const { error } = await supabase.from('users').upsert({ nick: user.nick.toLowerCase(), pin_hash: user.pinHash, data: userData, updated_at: now })
      if (error) { set({ isSaving: false }); return false }
    }
    set({ isDirty: false, localUpdatedAt: now, isSaving: false })
    return true
  },

  async forceLoadFromCloud() {
    const { user } = get()
    if (!user || !supabase) return false
    const { data } = await supabase.from('users').select('data, updated_at').eq('nick', user.nick.toLowerCase()).maybeSingle()
    if (!data) return false
    StorageService.set(userKey(user.nick), data.data)
    set({ userData: data.data, isDirty: false, localUpdatedAt: data.updated_at ?? null })
    return true
  },

  setUserData(data) { set({ userData: data, isDirty: true }) },
  markDirty() { set({ isDirty: true }) },
  markClean(savedAt) { set({ isDirty: false, localUpdatedAt: savedAt }) },

  deleteAccount() {
    const { user } = get()
    if (!user || user.nick === '게스트') return
    StorageService.removeFromRegistry(user.nick)
    StorageService.del(userKey(user.nick))
    if (supabase) supabase.from('users').delete().eq('nick', user.nick.toLowerCase())
    set({ user: null, userData: null })
  },
}))
