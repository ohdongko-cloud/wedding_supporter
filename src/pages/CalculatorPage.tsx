import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { CALC_CAT_LABELS, CALC_SEEDS } from '../data/calculatorSeeds'
import type { CalcState, CalcCustomItem } from '../types'

type CalcType = 'wedding' | 'honeymoon' | 'house'

function fmt(n: number) {
  if (Math.abs(n) >= 100000000) return `${(n / 100000000).toFixed(1)}억원`
  if (Math.abs(n) >= 10000) return `${Math.round(n / 10000).toLocaleString()}만원`
  return `${n.toLocaleString()}원`
}

export default function CalculatorPage() {
  const { type = 'wedding' } = useParams<{ type: string }>()
  const calcType = type as CalcType
  const userData = useAuthStore(s => s.userData)!
  const setUserData = useAuthStore(s => s.setUserData)
  const saveUserData = useAuthStore(s => s.saveUserData)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [addInputs, setAddInputs] = useState<Record<string, string>>({})
  const [budgetInput, setBudgetInput] = useState('')

  const calcKey = calcType === 'wedding' ? 'calcWedding' : calcType === 'honeymoon' ? 'calcHoneymoon' : 'calcHouse'
  const calc = userData[calcKey]

  useEffect(() => {
    setBudgetInput(calc.budget > 0 ? String(calc.budget) : '')
    const seeds = CALC_SEEDS[calcType]
    if (!seeds) return
    let changed = false
    const newCats = { ...calc.cats }
    Object.entries(seeds).forEach(([catKey, seedItems]) => {
      const cat = newCats[catKey]
      if (!cat) return
      if (cat.defItems.length === 0) {
        newCats[catKey] = {
          ...cat,
          defItems: seedItems.map(([id, name, avg]) => ({
            id, name, avg, customVal: '', checked: true, deleted: false,
          })),
        }
        changed = true
      }
    })
    if (changed) {
      const recomputed = computeTotal({ ...calc, cats: newCats })
      setUserData({ ...userData, [calcKey]: recomputed })
      saveUserData()
    }
  }, [calcType]) // eslint-disable-line

  function computeTotal(c: CalcState): CalcState {
    let total = 0
    Object.values(c.cats).forEach(cat => {
      cat.defItems.forEach(it => {
        if (it.checked && !it.deleted) total += it.customVal ? Number(it.customVal) || 0 : it.avg
      })
      cat.customItems.forEach(it => { if (it.checked) total += it.price })
    })
    return { ...c, totalCost: total }
  }

  function updateCalc(newCalc: CalcState) {
    const updated = computeTotal(newCalc)
    setUserData({ ...userData, [calcKey]: updated })
    saveUserData()
  }

  function toggleDef(catKey: string, itemId: string) {
    const newCats = { ...calc.cats }
    newCats[catKey] = { ...newCats[catKey], defItems: newCats[catKey].defItems.map(it => it.id === itemId ? { ...it, checked: !it.checked } : it) }
    updateCalc({ ...calc, cats: newCats })
  }

  function setDefAmt(catKey: string, itemId: string, val: string) {
    const newCats = { ...calc.cats }
    newCats[catKey] = { ...newCats[catKey], defItems: newCats[catKey].defItems.map(it => it.id === itemId ? { ...it, customVal: val } : it) }
    updateCalc({ ...calc, cats: newCats })
  }

  function toggleCustom(catKey: string, itemId: string) {
    const newCats = { ...calc.cats }
    newCats[catKey] = { ...newCats[catKey], customItems: newCats[catKey].customItems.map(it => it.id === itemId ? { ...it, checked: !it.checked } : it) }
    updateCalc({ ...calc, cats: newCats })
  }

  function setCustomAmt(catKey: string, itemId: string, val: string) {
    const newCats = { ...calc.cats }
    newCats[catKey] = { ...newCats[catKey], customItems: newCats[catKey].customItems.map(it => it.id === itemId ? { ...it, price: Number(val) || 0 } : it) }
    updateCalc({ ...calc, cats: newCats })
  }

  function delCustom(catKey: string, itemId: string) {
    const newCats = { ...calc.cats }
    newCats[catKey] = { ...newCats[catKey], customItems: newCats[catKey].customItems.filter(it => it.id !== itemId) }
    updateCalc({ ...calc, cats: newCats })
  }

  function addCustom(catKey: string) {
    const name = (addInputs[catKey] || '').trim()
    if (!name) return
    const newItem: CalcCustomItem = { id: 'c' + Date.now(), name, price: 0, checked: true }
    const newCats = { ...calc.cats }
    newCats[catKey] = { ...newCats[catKey], customItems: [...newCats[catKey].customItems, newItem] }
    updateCalc({ ...calc, cats: newCats })
    setAddInputs(prev => ({ ...prev, [catKey]: '' }))
  }

  function saveBudget() {
    const b = Number(budgetInput.replace(/,/g, '')) || 0
    updateCalc({ ...calc, budget: b })
  }

  const catLabels = CALC_CAT_LABELS[calcType] || {}
  const diff = calc.budget - calc.totalCost
  const usedPct = calc.budget > 0 ? Math.min(100, Math.round(calc.totalCost / calc.budget * 100)) : 0

  return (
    <div>
      {/* Summary card */}
      <div style={{ background: 'linear-gradient(135deg,var(--pk),var(--mn))', borderRadius: 14, padding: '18px 20px', color: '#fff', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          {[
            ['목표 예산', calc.budget > 0 ? fmt(calc.budget) : '미설정'],
            ['예상 비용', fmt(calc.totalCost)],
            ['차액', (diff >= 0 ? '+' : '') + fmt(diff)],
          ].map(([label, val]) => (
            <div key={label} style={{ flex: 1, minWidth: 90 }}>
              <div style={{ fontSize: 11, opacity: .75, marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: label === '차액' && diff < 0 ? '#ffd0d0' : '#fff' }}>{val}</div>
            </div>
          ))}
        </div>
        {calc.budget > 0 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: .8, marginBottom: 4 }}>
              <span>예산 사용률</span><span>{usedPct}%</span>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,.3)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${usedPct}%`, background: usedPct > 100 ? '#ff6b6b' : '#fff', borderRadius: 4, transition: 'width .5s' }} />
            </div>
          </>
        )}
      </div>

      {/* Budget input */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', marginBottom: 14, boxShadow: '0 2px 12px rgba(255,107,157,.08)', border: '1.5px solid var(--pk4)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>목표 예산 설정</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type='number' value={budgetInput} onChange={e => setBudgetInput(e.target.value)} onBlur={saveBudget} placeholder='예산 입력 (원)' style={{ flex: 1, border: '1.5px solid var(--gray2)', borderRadius: 8, padding: '9px 12px', fontSize: 14, outline: 'none' }} />
          <button onClick={saveBudget} style={{ background: 'var(--pk)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>저장</button>
        </div>
      </div>

      {/* Categories */}
      {Object.entries(calc.cats).map(([catKey, cat]) => {
        const label = catLabels[catKey] || catKey
        const isOpen = collapsed[catKey] !== true
        const catTotal = [
          ...cat.defItems.filter(it => it.checked && !it.deleted).map(it => it.customVal ? Number(it.customVal) || 0 : it.avg),
          ...cat.customItems.filter(it => it.checked).map(it => it.price),
        ].reduce((a, b) => a + b, 0)

        return (
          <div key={catKey} style={{ background: '#fff', borderRadius: 14, marginBottom: 10, boxShadow: '0 4px 20px rgba(255,107,157,.08)', overflow: 'hidden', border: '1.5px solid var(--pk4)' }}>
            <div onClick={() => setCollapsed(p => ({ ...p, [catKey]: !p[catKey] }))} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', cursor: 'pointer', userSelect: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 800 }}>{label}</span>
                <span style={{ fontSize: 12, color: 'var(--pk)', fontWeight: 700 }}>{fmt(catTotal)}</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text2)', display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'none', transition: '.2s' }}>▼</span>
            </div>

            {isOpen && (
              <div style={{ padding: '0 12px 12px' }}>
                {cat.defItems.filter(it => !it.deleted).map(it => (
                  <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px', borderBottom: '1px solid var(--gray1)' }}>
                    <input type='checkbox' checked={it.checked} onChange={() => toggleDef(catKey, it.id)} style={{ width: 17, height: 17, accentColor: 'var(--pk)', cursor: 'pointer', flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13, color: it.checked ? 'var(--text)' : 'var(--text2)' }}>{it.name}</span>
                    <input
                      type='number'
                      value={it.customVal !== '' ? it.customVal : it.avg}
                      onChange={e => setDefAmt(catKey, it.id, e.target.value)}
                      style={{ width: 120, border: '1.5px solid var(--gray2)', borderRadius: 6, padding: '4px 8px', fontSize: 12, textAlign: 'right', opacity: it.checked ? 1 : 0.45 }}
                    />
                    <span style={{ fontSize: 11, color: 'var(--text2)', minWidth: 14 }}>원</span>
                  </div>
                ))}

                {cat.customItems.map(it => (
                  <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px', borderBottom: '1px solid var(--gray1)' }}>
                    <input type='checkbox' checked={it.checked} onChange={() => toggleCustom(catKey, it.id)} style={{ width: 17, height: 17, accentColor: 'var(--pk)', cursor: 'pointer', flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13 }}>{it.name}</span>
                    <input
                      type='number'
                      value={it.price}
                      onChange={e => setCustomAmt(catKey, it.id, e.target.value)}
                      style={{ width: 120, border: '1.5px solid var(--gray2)', borderRadius: 6, padding: '4px 8px', fontSize: 12, textAlign: 'right' }}
                    />
                    <span style={{ fontSize: 11, color: 'var(--text2)', minWidth: 14 }}>원</span>
                    <button onClick={() => delCustom(catKey, it.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pk3)', fontSize: 14, padding: '2px' }}>🗑️</button>
                  </div>
                ))}

                <div style={{ display: 'flex', gap: 8, marginTop: 10, paddingLeft: 4 }}>
                  <input
                    style={{ flex: 1, border: '1.5px solid var(--gray2)', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none', background: 'var(--pk5)' }}
                    placeholder='항목 추가...'
                    value={addInputs[catKey] || ''}
                    onChange={e => setAddInputs(p => ({ ...p, [catKey]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && addCustom(catKey)}
                  />
                  <button onClick={() => addCustom(catKey)} style={{ background: 'var(--pk)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>추가</button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
