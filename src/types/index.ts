export interface AuthUser { nick: string; pinHash: string }
export type RequiredType = '필수' | '선택'
export type Priority = '최상' | '상' | '중' | '하'
export interface ChecklistSeedItem {
  id: string; title: string; req: RequiredType; pri: Priority
  cost: string; time: string; note: string
}
export interface ChecklistSeedStage { id: string; name: string; icon: string; items: ChecklistSeedItem[] }
export interface ChecklistItemState { id: string; completed: boolean; hidden: boolean; deadline?: string }
export interface ChecklistCustomItem { id: string; title: string; completed: boolean; deadline?: string }
export interface ChecklistStageState { items: ChecklistItemState[]; customItems: ChecklistCustomItem[] }
export interface CalcDefItem {
  id: string; name: string; avg: number; customVal: string; checked: boolean; deleted: boolean
  required?: boolean   // ★필수=true, ☆선택=false
  prepStage?: string   // e.g. "D-8개월~"
}
export interface CalcCustomItem { id: string; name: string; price: number; checked: boolean }
export interface CalcCategory { defItems: CalcDefItem[]; customItems: CalcCustomItem[] }
export interface CalcState {
  budget: number; mealCount: number; mealPrice: number; mealCustom: number; _mealTotal?: number
  venueHall: string; venueRoom: string; venueDirect: number
  cats: Record<string, CalcCategory>; totalCost: number
}
export interface Memo { id: string; title: string; content: string; createdAt: string; updatedAt?: string }
export interface Comment { author: string; content: string; createdAt: string }
export interface PostAttachment {
  name: string      // 원본 파일명
  size: number      // bytes
  type: string      // MIME type
  data: string      // base64 data URL
}
export interface Post {
  id: string; title: string; content: string; author: string; isNotice: boolean
  views: number; likes: number; comments: Comment[]; createdAt: string; updatedAt?: string
  attachments?: PostAttachment[]
  category?: string
}
export interface HouseDetailBuy {
  targetContract: string; region: string; price: string
  cashGroom: string; cashBride: string; savingsGroom: string; savingsBride: string
  incomeGroom: string; incomeBride: string; birthGroom: string; birthBride: string
  loanRate: string; loanYears: string; repaymentMethod: string; married: boolean
  existingLoan?: string       // 기존 보유 대출 잔액 (만원)
  loanCondition?: string      // '일반' | '생애최초' | '신혼부부'
}
export interface HouseDetailJeonse {
  targetContract: string; region: string; price: string
  cashGroom: string; cashBride: string; savingsGroom: string; savingsBride: string
  incomeGroom: string; incomeBride: string
  loanRate: string; married: boolean
  existingLoan?: string       // 기존 보유 대출 잔액 (만원)
}
export interface HouseDetailRent {
  region: string; deposit: string; monthly: string
  cashGroom: string; cashBride: string; savingsGroom: string; savingsBride: string
  incomeGroom: string; incomeBride: string
}
export interface HouseDetail {
  mode: 'buy' | 'jeonse' | 'rent'
  targetMoveIn: string
  address: string
  buy: HouseDetailBuy
  jeonse: HouseDetailJeonse
  rent: HouseDetailRent
}
export interface HoneymoonScheduleItem {
  id: string; time: string; reserved: boolean; title: string
  detail: string; amount: number; note: string
}
export interface HoneymoonDay {
  id: string; dayNumber: number; date: string; isOpen: boolean
  items: HoneymoonScheduleItem[]
}
export interface HoneymoonPlanState {
  budget: number
  days: HoneymoonDay[]
}
export interface UserData {
  nick: string; pinHash: string; pinHint?: string; weddingDate: string; totalBudget: number; venueName: string
  checklist: Record<string, ChecklistStageState>
  calcWedding: CalcState; calcHoneymoon: CalcState; calcHouse: CalcState
  memos: Memo[]; createdAt: string; lastLoginAt: string
  houseDetail?: HouseDetail
  honeymoonPlan?: HoneymoonPlanState
  hasSeenTour?: boolean
  hasSeenOnboarding?: boolean
}
export interface SharedSnapshot {
  share_token: string
  owner_nick: string
  snapshot: UserData
  created_at: string
}