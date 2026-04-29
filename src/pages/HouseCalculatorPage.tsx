import { useMemo } from 'react'
import { useAuthStore } from '../stores/authStore'
import type { HouseDetail, HouseDetailBuy, HouseDetailJeonse, HouseDetailRent } from '../types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (!isFinite(n)) return '-'
  if (Math.abs(n) >= 10000) return `${(n / 10000).toFixed(2)}억`
  return `${n.toLocaleString()}만`
}

function fmtWon(n: number): string {
  return fmt(n) + '원'
}

function num(s: string): number {
  const v = parseFloat(s.replace(/,/g, ''))
  return isFinite(v) ? v : 0
}

function monthsBetween(from: Date, to: Date): number {
  return Math.max(0, (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()))
}

// ── Regulation lookup ────────────────────────────────────────────────────────

interface Regulation {
  type: '투기과열지구' | '조정대상지역' | '비규제지역'
  ltvPct: number
  description: string
}

function getRegulation(region: string): Regulation {
  const r = region.trim()
  const hotZones = ['강남구', '서초구', '송파구', '용산구']
  if (hotZones.some(z => r.includes(z))) {
    return { type: '투기과열지구', ltvPct: 40, description: 'LTV 40% 적용, DSR 40% 제한, 2주택자 대출 불가' }
  }
  if (r.includes('서울')) {
    return { type: '조정대상지역', ltvPct: 50, description: 'LTV 50% 적용, DSR 40% 제한, 다주택자 대출 제한' }
  }
  return { type: '비규제지역', ltvPct: 70, description: 'LTV 70% 적용, DSR 40% 제한' }
}

// ── Tax & Fees ───────────────────────────────────────────────────────────────

function acquisitionTaxRate(price: number): number {
  // price in 만원
  if (price <= 60000) return 0.011
  if (price <= 90000) return 0.022
  return 0.033
}

function buyAgentFee(price: number): number {
  // price in 만원
  if (price < 5000) return Math.min(price * 0.006, 25)
  if (price < 20000) return Math.min(price * 0.005, 80)
  if (price < 90000) return price * 0.004
  if (price < 120000) return price * 0.005
  if (price < 150000) return price * 0.006
  return price * 0.007
}

function jeonseAgentFee(price: number): number {
  // price in 만원
  if (price < 5000) return Math.min(price * 0.005, 20)
  if (price < 10000) return Math.min(price * 0.004, 30)
  if (price < 30000) return price * 0.003
  if (price < 60000) return price * 0.004
  return price * 0.005
}

// ── Loan repayment ───────────────────────────────────────────────────────────

function monthlyPayment(principal: number, annualRate: number, years: number, method: string): number {
  const r = annualRate / 100 / 12
  const n = years * 12
  if (principal <= 0) return 0
  if (method === 'equal_principal') {
    // 원금균등 첫 달
    return principal / n + principal * r
  }
  if (method === 'bullet') {
    return principal * r
  }
  // 원리금균등 (default)
  if (r === 0) return principal / n
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

// ── Timeline Component ────────────────────────────────────────────────────────

interface TimelineStep {
  label: string
  daysOffset: number // negative = before move-in, positive = after
}

const BUY_STEPS: TimelineStep[] = [
  { label: '대출상담', daysOffset: -180 },
  { label: '지역임장', daysOffset: -150 },
  { label: '매물탐색', daysOffset: -90 },
  { label: '계약체결', daysOffset: -60 },
  { label: '잔금납부', daysOffset: -30 },
  { label: '소유권이전', daysOffset: 0 },
  { label: '입주', daysOffset: 0 },
  { label: '전입신고', daysOffset: 14 },
]

const JEONSE_STEPS: TimelineStep[] = [
  { label: '대출상담', daysOffset: -90 },
  { label: '지역임장', daysOffset: -75 },
  { label: '계약체결', daysOffset: -60 },
  { label: '잔금+확정일자', daysOffset: 0 },
  { label: '입주', daysOffset: 0 },
  { label: '전입신고', daysOffset: 14 },
]

const RENT_STEPS: TimelineStep[] = [
  { label: '지역임장', daysOffset: -30 },
  { label: '계약체결', daysOffset: -14 },
  { label: '입주', daysOffset: 0 },
  { label: '전입신고', daysOffset: 14 },
]

function Timeline({ moveInDate, steps }: { moveInDate: string; steps: TimelineStep[] }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (!moveInDate) {
    return (
      <div style={{ color: 'var(--text2)', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>
        입주 목표일을 입력하면 타임라인이 표시됩니다.
      </div>
    )
  }

  const anchor = new Date(moveInDate)
  anchor.setHours(0, 0, 0, 0)

  const stepsWithDate = steps.map(s => {
    const d = new Date(anchor)
    d.setDate(d.getDate() + s.daysOffset)
    return { ...s, date: d }
  })

  // Find next upcoming step index
  const nextIdx = stepsWithDate.findIndex(s => s.date >= today)

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, minWidth: steps.length * 80 }}>
        {stepsWithDate.map((s, i) => {
          const isPast = s.date < today
          const isNext = i === nextIdx
          const isToday = s.date.getTime() === today.getTime()
          const nodeColor = isPast ? 'var(--gray2)' : isNext ? 'var(--pk)' : 'var(--pk4)'
          const textColor = isPast ? 'var(--text2)' : isNext ? 'var(--pk)' : 'var(--text)'
          const dateStr = `${s.date.getMonth() + 1}/${s.date.getDate()}`
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{ fontSize: 10, color: textColor, fontWeight: isNext ? 800 : 400, marginBottom: 4, textAlign: 'center', whiteSpace: 'nowrap' }}>
                {s.label}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                {i > 0 && <div style={{ flex: 1, height: 2, background: isPast ? 'var(--gray2)' : 'var(--pk4)' }} />}
                <div style={{
                  width: isNext ? 16 : 12, height: isNext ? 16 : 12,
                  borderRadius: '50%',
                  background: isToday ? 'var(--mn)' : nodeColor,
                  border: isNext ? '2px solid var(--pk)' : 'none',
                  flexShrink: 0,
                  boxShadow: isNext ? '0 0 6px rgba(255,107,157,.5)' : 'none',
                }} />
                {i < stepsWithDate.length - 1 && <div style={{ flex: 1, height: 2, background: 'var(--pk4)' }} />}
              </div>
              <div style={{ fontSize: 9, color: isNext ? 'var(--pk)' : 'var(--text2)', marginTop: 4, textAlign: 'center' }}>
                {dateStr}
              </div>
              {isToday && <div style={{ fontSize: 9, color: 'var(--mn)', fontWeight: 800 }}>오늘</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Default values ────────────────────────────────────────────────────────────

const DEFAULT_BUY: HouseDetailBuy = {
  targetContract: '', region: '', price: '',
  cashGroom: '', cashBride: '', savingsGroom: '', savingsBride: '',
  incomeGroom: '', incomeBride: '', birthGroom: '', birthBride: '',
  loanRate: '4.5', loanYears: '30', repaymentMethod: 'equal_principal_interest', married: false,
}

const DEFAULT_JEONSE: HouseDetailJeonse = {
  targetContract: '', region: '경기도 안산시', price: '20000',
  cashGroom: '', cashBride: '', savingsGroom: '', savingsBride: '',
  incomeGroom: '', incomeBride: '',
  loanRate: '3.5', married: false,
}

const DEFAULT_RENT: HouseDetailRent = {
  region: '', deposit: '', monthly: '',
  cashGroom: '', cashBride: '', savingsGroom: '', savingsBride: '',
  incomeGroom: '', incomeBride: '',
}

const DEFAULT_HOUSE_DETAIL: HouseDetail = {
  mode: 'jeonse', targetMoveIn: '', address: '경기도 안산시',
  buy: DEFAULT_BUY, jeonse: DEFAULT_JEONSE, rent: DEFAULT_RENT,
}

// ── Shared input styles ───────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  border: '1.5px solid var(--gray2)', borderRadius: 8, padding: '8px 10px',
  fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'var(--pk)', marginBottom: 4,
}

const cardStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 14, border: '1.5px solid var(--pk4)',
  padding: 16, marginBottom: 12,
}

// ── FormRow ───────────────────────────────────────────────────────────────────

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={labelStyle}>{label}</div>
      {children}
    </div>
  )
}

function TwoCol({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>{children}</div>
}

// ── Regulation Banner ─────────────────────────────────────────────────────────

function RegBanner({ region }: { region: string }) {
  if (!region.trim()) return null
  const reg = getRegulation(region)
  const color = reg.type === '투기과열지구' ? '#e03060' : reg.type === '조정대상지역' ? '#f59e0b' : '#22c55e'
  return (
    <div style={{ background: color + '18', border: `1.5px solid ${color}`, borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
      <div style={{ fontWeight: 800, color, fontSize: 12 }}>{reg.type} (LTV {reg.ltvPct}%)</div>
      <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{reg.description}</div>
    </div>
  )
}

// ── Summary card row ──────────────────────────────────────────────────────────

function SumRow({ label, value, highlight, color }: { label: string; value: string; highlight?: boolean; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--gray1)' }}>
      <span style={{ fontSize: 12, color: 'var(--text2)' }}>{label}</span>
      <span style={{ fontSize: highlight ? 18 : 13, fontWeight: highlight ? 800 : 600, color: color || (highlight ? 'var(--pk)' : 'var(--text)') }}>
        {value}
      </span>
    </div>
  )
}

// ── BuyTab ────────────────────────────────────────────────────────────────────

function BuyTab({ data, onChange }: { data: HouseDetailBuy; onChange: (d: HouseDetailBuy) => void }) {
  const set = (k: keyof HouseDetailBuy, v: string | boolean) => onChange({ ...data, [k]: v })

  const totalCash = num(data.cashGroom) + num(data.cashBride)
  const totalSavings = num(data.savingsGroom) + num(data.savingsBride)
  const today = new Date()
  const contractDate = data.targetContract ? new Date(data.targetContract) : null
  const months = contractDate ? monthsBetween(today, contractDate) : 0
  const extraSavings = totalSavings * months
  const availableCash = totalCash + extraSavings

  const price = num(data.price)
  const loanRate = num(data.loanRate)
  const loanYears = num(data.loanYears) || 30
  const reg = data.region ? getRegulation(data.region) : null

  const acquisitionTax = price > 0 ? Math.round(price * acquisitionTaxRate(price)) : 0
  const agentFee = price > 0 ? Math.round(buyAgentFee(price)) : 0

  const maxLoanLtv = reg && price > 0 ? Math.round(price * reg.ltvPct / 100) : 0

  const totalIncome = num(data.incomeGroom) + num(data.incomeBride)
  // DSR: 연소득×40%÷12 = 월 상환 가능액; 월이율로 역산
  const monthlyRate = loanRate / 100 / 12
  const n = loanYears * 12
  let maxLoanDsr = 0
  if (totalIncome > 0 && loanRate > 0) {
    const maxMonthly = (totalIncome * 10000) / 12 * 0.4 // 원 단위
    // annuity 역산 → 원 단위
    if (data.repaymentMethod === 'bullet') {
      maxLoanDsr = Math.round(maxMonthly / monthlyRate / 10000)
    } else if (data.repaymentMethod === 'equal_principal') {
      // 첫 달: P/n + P*r = maxMonthly → P = maxMonthly / (1/n + r)
      maxLoanDsr = Math.round(maxMonthly / (1 / n + monthlyRate) / 10000)
    } else {
      // 원리금균등
      if (monthlyRate > 0) {
        maxLoanDsr = Math.round((maxMonthly / (monthlyRate * Math.pow(1 + monthlyRate, n) / (Math.pow(1 + monthlyRate, n) - 1))) / 10000)
      }
    }
  }

  const actualLoan = maxLoanLtv > 0 && maxLoanDsr > 0
    ? Math.min(maxLoanLtv, maxLoanDsr)
    : maxLoanLtv || maxLoanDsr

  const requiredCash = price > 0 ? price - actualLoan + acquisitionTax + agentFee : 0
  const cashBalance = availableCash - requiredCash

  const loanMonthly = actualLoan > 0
    ? Math.round(monthlyPayment(actualLoan * 10000, loanRate, loanYears, data.repaymentMethod) / 10000)
    : 0

  // Table rows 2억~30억 (1억 단위)
  const tableRows = useMemo(() => {
    if (!reg) return []
    return Array.from({ length: 29 }, (_, i) => {
      const p = (i + 2) * 10000 // 만원
      const tax = Math.round(p * acquisitionTaxRate(p))
      const fee = Math.round(buyAgentFee(p))
      const maxL = Math.round(p * reg.ltvPct / 100)
      const needCash = p - maxL + tax + fee
      return { p, tax, fee, needCash, maxL, ltv: reg.ltvPct }
    })
  }, [reg?.ltvPct])

  return (
    <div>
      {/* Input form */}
      <div style={cardStyle}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12, color: 'var(--text)' }}>입력 정보</div>
        <FormRow label="목표 계약 시점">
          <input type="date" value={data.targetContract} onChange={e => set('targetContract', e.target.value)} style={inputStyle} />
        </FormRow>
        <FormRow label="지역 주소 (동 단위)">
          <input type="text" value={data.region} onChange={e => set('region', e.target.value)} placeholder="예: 서울 강남구 역삼동" style={inputStyle} />
        </FormRow>
        <FormRow label="예상 매매가 (만원)">
          <input type="number" value={data.price} onChange={e => set('price', e.target.value)} placeholder="예: 80000" style={inputStyle} />
        </FormRow>
        <FormRow label="보유 현금 (만원)">
          <TwoCol>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신랑</div>
              <input type="number" value={data.cashGroom} onChange={e => set('cashGroom', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신부</div>
              <input type="number" value={data.cashBride} onChange={e => set('cashBride', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
          </TwoCol>
        </FormRow>
        <FormRow label="월 저축액 (만원)">
          <TwoCol>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신랑</div>
              <input type="number" value={data.savingsGroom} onChange={e => set('savingsGroom', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신부</div>
              <input type="number" value={data.savingsBride} onChange={e => set('savingsBride', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
          </TwoCol>
        </FormRow>
        <FormRow label="연소득 (만원, DSR 계산용)">
          <TwoCol>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신랑</div>
              <input type="number" value={data.incomeGroom} onChange={e => set('incomeGroom', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신부</div>
              <input type="number" value={data.incomeBride} onChange={e => set('incomeBride', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
          </TwoCol>
        </FormRow>
        <FormRow label="생년 (4자리)">
          <TwoCol>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신랑</div>
              <input type="number" value={data.birthGroom} onChange={e => set('birthGroom', e.target.value)} placeholder="예: 1993" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신부</div>
              <input type="number" value={data.birthBride} onChange={e => set('birthBride', e.target.value)} placeholder="예: 1995" style={inputStyle} />
            </div>
          </TwoCol>
        </FormRow>
        <FormRow label="대출 조건">
          <TwoCol>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>금리 (%)</div>
              <input type="number" value={data.loanRate} onChange={e => set('loanRate', e.target.value)} step="0.1" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>기간 (년)</div>
              <input type="number" value={data.loanYears} onChange={e => set('loanYears', e.target.value)} style={inputStyle} />
            </div>
          </TwoCol>
        </FormRow>
        <FormRow label="상환 방식">
          <select value={data.repaymentMethod} onChange={e => set('repaymentMethod', e.target.value)} style={{ ...inputStyle, background: '#fff' }}>
            <option value="equal_principal_interest">원리금균등상환</option>
            <option value="equal_principal">원금균등상환</option>
            <option value="bullet">만기일시상환</option>
          </select>
        </FormRow>
        <FormRow label="혼인신고">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
            <input type="checkbox" checked={data.married} onChange={e => set('married', e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--pk)' }} />
            혼인신고 완료
          </label>
        </FormRow>
      </div>

      {/* Summary */}
      <div style={cardStyle}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12, color: 'var(--text)' }}>재무 요약</div>
        <SumRow label="총 보유 현금" value={fmtWon(totalCash)} />
        <SumRow label={`추가 저축 예상 (${months}개월)`} value={fmtWon(extraSavings)} />
        <SumRow label="확보 가능 현금 합계" value={fmtWon(availableCash)} highlight />
        <SumRow label="예상 매매가" value={price > 0 ? fmtWon(price) : '-'} />
        <SumRow label="취득세 (등록세 포함)" value={price > 0 ? fmtWon(acquisitionTax) : '-'} />
        <SumRow label="중개수수료" value={price > 0 ? fmtWon(agentFee) : '-'} />
        <SumRow label="최대 대출 (LTV)" value={maxLoanLtv > 0 ? fmtWon(maxLoanLtv) : '-'} />
        <SumRow label="DSR 기준 최대 대출" value={maxLoanDsr > 0 ? fmtWon(maxLoanDsr) : '-'} />
        <SumRow label="실질 대출 가능액" value={actualLoan > 0 ? fmtWon(actualLoan) : '-'} highlight />
        <SumRow label="필요 현금 합계" value={requiredCash > 0 ? fmtWon(requiredCash) : '-'} />
        <SumRow
          label="현금 부족 / 여유"
          value={requiredCash > 0 ? (cashBalance >= 0 ? `+${fmtWon(cashBalance)} 여유` : `${fmtWon(cashBalance)} 부족`) : '-'}
          highlight
          color={requiredCash > 0 ? (cashBalance >= 0 ? '#22c55e' : '#e03060') : undefined}
        />
        <SumRow label="월 상환액 (예상)" value={loanMonthly > 0 ? fmtWon(loanMonthly) + '/월' : '-'} />
      </div>

      {/* Table */}
      <div style={cardStyle}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10, color: 'var(--text)' }}>매매가별 분석표</div>
        {reg && <RegBanner region={data.region} />}
        {!reg && (
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10 }}>지역 주소를 입력하면 규제지역 정보가 표시됩니다.</div>
        )}
        <div style={{ overflowX: 'auto', maxHeight: 360, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--pk5)', zIndex: 1 }}>
              <tr>
                {['매매가', '취득세', '중개수수료', '필요현금', '최대대출', 'LTV'].map(h => (
                  <th key={h} style={{ padding: '8px 4px', fontWeight: 700, color: 'var(--pk)', textAlign: 'right', whiteSpace: 'nowrap', borderBottom: '1.5px solid var(--pk4)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map(row => {
                const isHighlight = price > 0 && Math.abs(row.p - price) < 5001
                return (
                  <tr key={row.p} style={{ background: isHighlight ? 'var(--pk5)' : undefined }}>
                    {[fmt(row.p), fmt(row.tax), fmt(row.fee), fmt(row.needCash), fmt(row.maxL), `${row.ltv}%`].map((v, j) => (
                      <td key={j} style={{ padding: '6px 4px', textAlign: 'right', borderBottom: '1px solid var(--gray1)', fontWeight: isHighlight && j === 0 ? 800 : 400, color: isHighlight && j === 0 ? 'var(--pk)' : undefined }}>
                        {v}
                      </td>
                    ))}
                  </tr>
                )
              })}
              {tableRows.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 16, color: 'var(--text2)', fontSize: 12 }}>지역을 입력하면 분석표가 표시됩니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── JeonseTab ─────────────────────────────────────────────────────────────────

function JeonseTab({ data, onChange }: { data: HouseDetailJeonse; onChange: (d: HouseDetailJeonse) => void }) {
  const set = (k: keyof HouseDetailJeonse, v: string | boolean) => onChange({ ...data, [k]: v })

  const totalCash = num(data.cashGroom) + num(data.cashBride)
  const totalSavings = num(data.savingsGroom) + num(data.savingsBride)
  const today = new Date()
  const contractDate = data.targetContract ? new Date(data.targetContract) : null
  const months = contractDate ? monthsBetween(today, contractDate) : 0
  const extraSavings = totalSavings * months
  const availableCash = totalCash + extraSavings

  const price = num(data.price)
  const loanRate = num(data.loanRate)

  const agentFee = price > 0 ? Math.round(jeonseAgentFee(price)) : 0

  // 전세대출: 일반 80%, 신혼 최대 3억
  const loanLimit80 = price > 0 ? Math.round(price * 0.8) : 0
  const loanLimitNewlywed = price > 0 ? Math.min(loanLimit80, 30000) : 0
  const actualLoan = data.married ? loanLimitNewlywed : loanLimit80

  const requiredCash = price > 0 ? price - actualLoan + agentFee : 0
  const cashBalance = availableCash - requiredCash

  const monthlyInterest = actualLoan > 0 ? Math.round(actualLoan * loanRate / 100 / 12) : 0

  // Table: 1억~20억 (5천만 단위)
  const tableRows = useMemo(() => {
    return Array.from({ length: 38 }, (_, i) => {
      const p = (i + 2) * 5000 // 1억부터 (2×5000=10000만)
      const fee = Math.round(jeonseAgentFee(p))
      const limit = Math.round(p * 0.8)
      const needCash = p - limit + fee
      const note = p <= 30000 && p * 0.8 <= 30000 ? '신혼특례가능' : p <= 30000 ? `신혼한도3억` : '-'
      return { p, fee, limit, needCash, note }
    })
  }, [])

  return (
    <div>
      <div style={cardStyle}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12, color: 'var(--text)' }}>입력 정보</div>
        <FormRow label="목표 계약 시점">
          <input type="date" value={data.targetContract} onChange={e => set('targetContract', e.target.value)} style={inputStyle} />
        </FormRow>
        <FormRow label="지역 주소">
          <input type="text" value={data.region} onChange={e => set('region', e.target.value)} placeholder="예: 서울 마포구 합정동" style={inputStyle} />
        </FormRow>
        <FormRow label="예상 전세가 (만원)">
          <input type="number" value={data.price} onChange={e => set('price', e.target.value)} placeholder="예: 40000" style={inputStyle} />
        </FormRow>
        <FormRow label="보유 현금 (만원)">
          <TwoCol>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신랑</div>
              <input type="number" value={data.cashGroom} onChange={e => set('cashGroom', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신부</div>
              <input type="number" value={data.cashBride} onChange={e => set('cashBride', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
          </TwoCol>
        </FormRow>
        <FormRow label="월 저축액 (만원)">
          <TwoCol>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신랑</div>
              <input type="number" value={data.savingsGroom} onChange={e => set('savingsGroom', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신부</div>
              <input type="number" value={data.savingsBride} onChange={e => set('savingsBride', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
          </TwoCol>
        </FormRow>
        <FormRow label="연소득 (만원)">
          <TwoCol>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신랑</div>
              <input type="number" value={data.incomeGroom} onChange={e => set('incomeGroom', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신부</div>
              <input type="number" value={data.incomeBride} onChange={e => set('incomeBride', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
          </TwoCol>
        </FormRow>
        <FormRow label="전세대출 금리 (%)">
          <input type="number" value={data.loanRate} onChange={e => set('loanRate', e.target.value)} step="0.1" style={inputStyle} />
        </FormRow>
        <FormRow label="혼인신고">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
            <input type="checkbox" checked={data.married} onChange={e => set('married', e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--pk)' }} />
            혼인신고 완료 (신혼부부 특례 적용)
          </label>
        </FormRow>
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12, color: 'var(--text)' }}>재무 요약</div>
        <SumRow label="총 보유 현금" value={fmtWon(totalCash)} />
        <SumRow label={`추가 저축 예상 (${months}개월)`} value={fmtWon(extraSavings)} />
        <SumRow label="확보 가능 현금 합계" value={fmtWon(availableCash)} highlight />
        <SumRow label="예상 전세가" value={price > 0 ? fmtWon(price) : '-'} />
        <SumRow label="전세 중개수수료" value={price > 0 ? fmtWon(agentFee) : '-'} />
        <SumRow label="전세자금대출 한도 (일반 80%)" value={loanLimit80 > 0 ? fmtWon(loanLimit80) : '-'} />
        {data.married && <SumRow label="신혼부부 특례 한도 (80%, 최대 3억)" value={loanLimitNewlywed > 0 ? fmtWon(loanLimitNewlywed) : '-'} />}
        <SumRow label="적용 대출 한도" value={actualLoan > 0 ? fmtWon(actualLoan) : '-'} highlight />
        <SumRow label="필요 현금 (전세가-대출+수수료)" value={requiredCash > 0 ? fmtWon(requiredCash) : '-'} />
        <SumRow
          label="현금 부족 / 여유"
          value={requiredCash > 0 ? (cashBalance >= 0 ? `+${fmtWon(cashBalance)} 여유` : `${fmtWon(Math.abs(cashBalance))} 부족`) : '-'}
          highlight
          color={requiredCash > 0 ? (cashBalance >= 0 ? '#22c55e' : '#e03060') : undefined}
        />
        <SumRow label="월 이자 (이자만 납부 기준)" value={monthlyInterest > 0 ? fmtWon(monthlyInterest) + '/월' : '-'} />
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10, color: 'var(--text)' }}>전세가별 분석표</div>
        {data.region && <RegBanner region={data.region} />}
        <div style={{ overflowX: 'auto', maxHeight: 360, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--pk5)', zIndex: 1 }}>
              <tr>
                {['전세가', '중개수수료', '전세대출(80%)', '필요현금', '비고'].map(h => (
                  <th key={h} style={{ padding: '8px 4px', fontWeight: 700, color: 'var(--pk)', textAlign: 'right', whiteSpace: 'nowrap', borderBottom: '1.5px solid var(--pk4)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map(row => {
                const isHighlight = price > 0 && Math.abs(row.p - price) < 2501
                return (
                  <tr key={row.p} style={{ background: isHighlight ? 'var(--pk5)' : undefined }}>
                    {[fmt(row.p), fmt(row.fee), fmt(row.limit), fmt(row.needCash), row.note].map((v, j) => (
                      <td key={j} style={{ padding: '6px 4px', textAlign: 'right', borderBottom: '1px solid var(--gray1)', fontWeight: isHighlight && j === 0 ? 800 : 400, color: isHighlight && j === 0 ? 'var(--pk)' : j === 4 ? '#f59e0b' : undefined }}>
                        {v}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── RentTab ───────────────────────────────────────────────────────────────────

function RentTab({ data, onChange }: { data: HouseDetailRent; onChange: (d: HouseDetailRent) => void }) {
  const set = (k: keyof HouseDetailRent, v: string) => onChange({ ...data, [k]: v })

  const totalCash = num(data.cashGroom) + num(data.cashBride)
  const deposit = num(data.deposit)
  const monthly = num(data.monthly)
  const depositBalance = totalCash - deposit

  const totalIncome = num(data.incomeGroom) + num(data.incomeBride)
  const monthlyIncome = totalIncome > 0 ? totalIncome / 12 : 0
  const rentRatioPct = monthlyIncome > 0 ? ((monthly / monthlyIncome) * 100).toFixed(1) : null

  // 전세 전환: 월세×100 + 보증금
  const jeonseEquiv = monthly * 100 + deposit

  // 매매 전환 참고 (전세의 약 120%)
  const buyEquiv = jeonseEquiv * 1.2

  return (
    <div>
      <div style={cardStyle}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12, color: 'var(--text)' }}>입력 정보</div>
        <FormRow label="지역 주소">
          <input type="text" value={data.region} onChange={e => set('region', e.target.value)} placeholder="예: 서울 은평구 응암동" style={inputStyle} />
        </FormRow>
        <FormRow label="보증금 (만원)">
          <input type="number" value={data.deposit} onChange={e => set('deposit', e.target.value)} placeholder="예: 5000" style={inputStyle} />
        </FormRow>
        <FormRow label="월세 (만원)">
          <input type="number" value={data.monthly} onChange={e => set('monthly', e.target.value)} placeholder="예: 80" style={inputStyle} />
        </FormRow>
        <FormRow label="보유 현금 (만원)">
          <TwoCol>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신랑</div>
              <input type="number" value={data.cashGroom} onChange={e => set('cashGroom', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신부</div>
              <input type="number" value={data.cashBride} onChange={e => set('cashBride', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
          </TwoCol>
        </FormRow>
        <FormRow label="월 저축액 (만원)">
          <TwoCol>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신랑</div>
              <input type="number" value={data.savingsGroom} onChange={e => set('savingsGroom', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신부</div>
              <input type="number" value={data.savingsBride} onChange={e => set('savingsBride', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
          </TwoCol>
        </FormRow>
        <FormRow label="연소득 (만원)">
          <TwoCol>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신랑</div>
              <input type="number" value={data.incomeGroom} onChange={e => set('incomeGroom', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>신부</div>
              <input type="number" value={data.incomeBride} onChange={e => set('incomeBride', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
          </TwoCol>
        </FormRow>
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12, color: 'var(--text)' }}>재무 분석</div>
        <SumRow label="총 보유 현금" value={fmtWon(totalCash)} />
        <SumRow label="보증금" value={deposit > 0 ? fmtWon(deposit) : '-'} />
        <SumRow
          label="보증금 충당 (현금 - 보증금)"
          value={deposit > 0 ? (depositBalance >= 0 ? `+${fmtWon(depositBalance)} 여유` : `${fmtWon(Math.abs(depositBalance))} 부족`) : '-'}
          highlight
          color={deposit > 0 ? (depositBalance >= 0 ? '#22c55e' : '#e03060') : undefined}
        />
        <SumRow label="월세" value={monthly > 0 ? fmtWon(monthly) + '/월' : '-'} />
        <SumRow label="관리비 예상 (참고)" value={monthly > 0 ? `약 ${Math.round(monthly * 0.15)}만원 내외` : '-'} />
        <SumRow
          label="월 소득 대비 월세 비율"
          value={rentRatioPct ? `${rentRatioPct}%` : '-'}
          color={rentRatioPct ? (parseFloat(rentRatioPct) > 30 ? '#e03060' : '#22c55e') : undefined}
        />
        <SumRow label="전세 전환 시 예상 전세가" value={jeonseEquiv > 0 ? fmtWon(jeonseEquiv) : '-'} />
        <SumRow label="매매 전환 참고가 (전세×1.2)" value={buyEquiv > 0 ? fmtWon(buyEquiv) : '-'} />
      </div>

      <div style={{ ...cardStyle, background: 'var(--pk5)' }}>
        <div style={{ fontSize: 12, color: 'var(--text2)' }}>
          <strong style={{ color: 'var(--pk)' }}>전세 전환율 안내</strong><br />
          전세 전환가 = 월세 × 100 + 보증금 (전환율 12% 기준 근사치)<br />
          매매 참고가는 실제 시세와 다를 수 있으니 현지 임장을 통해 확인하세요.
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function HouseCalculatorPage() {
  const userData = useAuthStore(s => s.userData)!
  const setUserData = useAuthStore(s => s.setUserData)
  const saveUserData = useAuthStore(s => s.saveUserData)

  const houseDetail: HouseDetail = userData.houseDetail ?? DEFAULT_HOUSE_DETAIL

  function update(next: HouseDetail) {
    // Also keep calcHouse.totalCost in sync
    let totalCost = userData.calcHouse.totalCost
    if (next.mode === 'buy' && next.buy.price) totalCost = num(next.buy.price)
    else if (next.mode === 'jeonse' && next.jeonse.price) totalCost = num(next.jeonse.price)
    else if (next.mode === 'rent' && next.rent.monthly) totalCost = num(next.rent.monthly) * 12
    const newUserData = {
      ...userData,
      houseDetail: next,
      calcHouse: { ...userData.calcHouse, totalCost },
    }
    setUserData(newUserData)
    saveUserData()
  }

  const mode = houseDetail.mode
  const tabs: { key: HouseDetail['mode']; label: string }[] = [
    { key: 'buy', label: '매매' },
    { key: 'jeonse', label: '전세' },
    { key: 'rent', label: '월세' },
  ]

  const timelineSteps = mode === 'buy' ? BUY_STEPS : mode === 'jeonse' ? JEONSE_STEPS : RENT_STEPS

  const budget = userData.calcHouse.budget || 0
  const currentPrice = mode === 'buy' ? num(houseDetail.buy.price) : mode === 'jeonse' ? num(houseDetail.jeonse.price) : 0
  const budgetDiff = budget > 0 && currentPrice > 0 ? budget - currentPrice : null

  function updateBudget(val: number) {
    setUserData({ ...userData, calcHouse: { ...userData.calcHouse, budget: val } })
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 16px 32px' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,var(--pk),var(--mn))', borderRadius: 14, padding: '18px 20px', color: '#fff', marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>신혼집 비용 계산기</div>
        <div style={{ fontSize: 12, opacity: 0.85 }}>매매 · 전세 · 월세 시뮬레이션으로 현명한 집 마련 계획을 세워보세요.</div>
      </div>

      {/* Budget goal — buy / jeonse only */}
      {mode !== 'rent' && (
        <div style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', borderRadius: 14, padding: '16px 20px', color: '#fff', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, opacity: .85, marginBottom: 8 }}>
            🏠 목표 예산 ({mode === 'buy' ? '매매가' : '전세가'} 기준)
          </div>
          <input
            type="number"
            value={budget || ''}
            onChange={e => updateBudget(parseInt(e.target.value) || 0)}
            placeholder="목표 예산 입력 (만원)"
            style={{ width: '100%', border: 'none', borderRadius: 10, padding: '10px 12px', fontSize: 14, boxSizing: 'border-box', outline: 'none', color: '#333' }}
          />
          {budget > 0 && currentPrice > 0 && budgetDiff !== null && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              {[
                { label: '목표 예산', val: fmtWon(budget), warn: false },
                { label: mode === 'buy' ? '매매가' : '전세가', val: fmtWon(currentPrice), warn: false },
                { label: '여유 / 부족', val: budgetDiff >= 0 ? `+${fmtWon(budgetDiff)}` : `${fmtWon(Math.abs(budgetDiff))} 부족`, warn: budgetDiff < 0 },
              ].map(({ label, val, warn }) => (
                <div key={label} style={{ flex: 1, background: 'rgba(255,255,255,.15)', borderRadius: 8, padding: '8px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, opacity: .8, marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: warn ? '#fecaca' : '#fff' }}>{val}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => update({ ...houseDetail, mode: t.key })}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 14, fontWeight: 700,
              border: '1.5px solid var(--pk4)', cursor: 'pointer',
              background: mode === t.key ? 'var(--pk)' : '#fff',
              color: mode === t.key ? '#fff' : 'var(--pk)',
              transition: 'all .15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Common header section */}
      <div style={cardStyle}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12, color: 'var(--text)' }}>기본 정보</div>
        <FormRow label="입주 목표 시점">
          <input
            type="date"
            value={houseDetail.targetMoveIn}
            onChange={e => update({ ...houseDetail, targetMoveIn: e.target.value })}
            style={inputStyle}
          />
        </FormRow>
        <FormRow label="아파트명 / 주소">
          <input
            type="text"
            value={houseDetail.address}
            onChange={e => update({ ...houseDetail, address: e.target.value })}
            placeholder="예: 래미안 퍼스티지 (반포동)"
            style={inputStyle}
          />
        </FormRow>
      </div>

      {/* Timeline */}
      <div style={cardStyle}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10, color: 'var(--text)' }}>준비 타임라인</div>
        <Timeline moveInDate={houseDetail.targetMoveIn} steps={timelineSteps} />
      </div>

      {/* Tab content */}
      {mode === 'buy' && (
        <BuyTab
          data={houseDetail.buy}
          onChange={buy => update({ ...houseDetail, buy })}
        />
      )}
      {mode === 'jeonse' && (
        <JeonseTab
          data={houseDetail.jeonse}
          onChange={jeonse => update({ ...houseDetail, jeonse })}
        />
      )}
      {mode === 'rent' && (
        <RentTab
          data={houseDetail.rent}
          onChange={rent => update({ ...houseDetail, rent })}
        />
      )}
    </div>
  )
}
