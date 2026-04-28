import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import type { Memo } from '../types'

type View = 'list' | 'detail' | 'edit'
const MAX = 50

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export default function MemoPage() {
  const userData = useAuthStore(s => s.userData)!
  const setUserData = useAuthStore(s => s.setUserData)
  const saveUserData = useAuthStore(s => s.saveUserData)
  const [view, setView] = useState<View>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Memo> | null>(null)
  const [search, setSearch] = useState('')
  const [perPage, setPerPage] = useState(10)
  const [page, setPage] = useState(1)

  const memos = userData.memos || []
  const selected = memos.find(m => m.id === selectedId) ?? null

  function saveMemo() {
    if (!editData?.title?.trim()) return
    const now = new Date().toISOString()
    let newMemos: Memo[]
    if (editData.id) {
      newMemos = memos.map(m => m.id === editData.id ? { ...m, title: editData.title!, content: editData.content ?? '', updatedAt: now } : m)
    } else {
      if (memos.length >= MAX) return
      newMemos = [{ id: 'm' + Date.now(), title: editData.title!, content: editData.content ?? '', createdAt: now, updatedAt: now }, ...memos]
    }
    setUserData({ ...userData, memos: newMemos })
    saveUserData()
    setView(editData.id ? 'detail' : 'list')
  }

  function deleteMemo(id: string) {
    if (!confirm('메모를 삭제할까요?')) return
    setUserData({ ...userData, memos: memos.filter(m => m.id !== id) })
    saveUserData()
    if (view !== 'list') setView('list')
  }

  const filtered = memos.filter(m => m.title.includes(search))
  const totalPages = Math.ceil(filtered.length / perPage)
  const pageMemos = filtered.slice((page - 1) * perPage, page * perPage)

  /* ---- Edit view ---- */
  if (view === 'edit') {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button onClick={() => setView(editData?.id ? 'detail' : 'list')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--pk)' }}>←</button>
          <span style={{ fontSize: 16, fontWeight: 800 }}>{editData?.id ? '메모 수정' : '새 메모'}</span>
        </div>
        <input
          value={editData?.title || ''} onChange={e => setEditData(p => ({ ...p!, title: e.target.value }))}
          placeholder='제목'
          style={{ width: '100%', border: '1.5px solid var(--gray2)', borderRadius: 10, padding: '11px 14px', fontSize: 15, fontWeight: 700, outline: 'none', marginBottom: 10, boxSizing: 'border-box' }}
        />
        <textarea
          value={editData?.content || ''}
          onChange={e => setEditData(p => ({ ...p!, content: e.target.value.slice(0, 3000) }))}
          placeholder='내용 (최대 3,000자)'
          rows={18}
          maxLength={3000}
          style={{ width: '100%', border: '1.5px solid var(--gray2)', borderRadius: 10, padding: '11px 14px', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.7, boxSizing: 'border-box' }}
        />
        <div style={{ fontSize: 11, color: (editData?.content || '').length >= 2800 ? '#e03060' : 'var(--text2)', textAlign: 'right', marginBottom: 10 }}>
          {(editData?.content || '').length.toLocaleString()} / 3,000자
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setView(editData?.id ? 'detail' : 'list')} style={{ flex: 1, background: 'var(--gray1)', color: 'var(--text2)', border: 'none', borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>취소</button>
          <button onClick={saveMemo} style={{ flex: 2, background: 'var(--pk)', color: '#fff', border: 'none', borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>저장</button>
        </div>
      </div>
    )
  }

  /* ---- Detail view ---- */
  if (view === 'detail' && selected) {
    return (
      <div>
        <button onClick={() => setView('list')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--pk)', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>← 목록으로</button>
        <div style={{ background: '#fff', borderRadius: 14, padding: '20px', boxShadow: '0 4px 20px rgba(255,107,157,.1)', border: '1.5px solid var(--pk4)' }}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>{selected.title}</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>
            작성: {fmtDate(selected.createdAt)}{selected.updatedAt && selected.updatedAt !== selected.createdAt ? ` · 수정: ${fmtDate(selected.updatedAt)}` : ''}
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.85, whiteSpace: 'pre-wrap', borderTop: '1px solid var(--gray1)', paddingTop: 14, minHeight: 100 }}>{selected.content}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 20, borderTop: '1px solid var(--gray1)', paddingTop: 14 }}>
            <button onClick={() => { setEditData({ ...selected }); setView('edit') }} style={{ flex: 1, background: 'var(--pk5)', color: 'var(--pk)', border: 'none', borderRadius: 10, padding: 11, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>수정</button>
            <button onClick={() => deleteMemo(selected.id)} style={{ flex: 1, background: '#fff0f3', color: '#e57373', border: 'none', borderRadius: 10, padding: 11, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>삭제</button>
          </div>
        </div>
      </div>
    )
  }

  /* ---- List view ---- */
  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg,var(--pk),var(--mn))', borderRadius: 12, padding: '14px 18px', color: '#fff', marginBottom: 14 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>{memos.length} <span style={{ fontSize: 14, opacity: .8, fontWeight: 400 }}>/ {MAX}개</span></div>
        <div style={{ fontSize: 12, opacity: .8, marginTop: 2 }}>저장된 메모</div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <input
          value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder='제목 검색'
          style={{ flex: 1, border: '1.5px solid var(--gray2)', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none' }}
        />
        <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }} style={{ border: '1.5px solid var(--gray2)', borderRadius: 8, padding: '9px 12px', fontSize: 13, cursor: 'pointer' }}>
          <option value={10}>10개</option><option value={15}>15개</option><option value={30}>30개</option>
        </select>
        {memos.length < MAX
          ? <button onClick={() => { setEditData({ title: '', content: '' }); setView('edit') }} style={{ background: 'var(--pk)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>✏️ 메모 작성</button>
          : <div style={{ background: '#ffe0ea', color: 'var(--pk)', borderRadius: 8, padding: '9px 14px', fontSize: 12, fontWeight: 700 }}>최대 {MAX}개 도달</div>
        }
      </div>

      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 4px 20px rgba(255,107,157,.1)', border: '1.5px solid var(--pk4)', overflow: 'hidden' }}>
        {pageMemos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text2)', fontSize: 14 }}>메모가 없습니다. 첫 메모를 작성해보세요! 📝</div>
        ) : pageMemos.map((memo, idx) => (
          <div key={memo.id} onClick={() => { setSelectedId(memo.id); setView('detail') }} style={{ display: 'flex', alignItems: 'center', padding: '13px 16px', borderBottom: idx < pageMemos.length - 1 ? '1px solid var(--gray1)' : 'none', cursor: 'pointer', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{memo.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>{fmtDate(memo.createdAt)}</div>
            </div>
            <button onClick={e => { e.stopPropagation(); deleteMemo(memo.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', fontSize: 16, padding: '4px 6px', flexShrink: 0 }}>🗑️</button>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14 }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} style={{ width: 32, height: 32, border: 'none', borderRadius: 8, background: p === page ? 'var(--pk)' : 'var(--gray1)', color: p === page ? '#fff' : 'var(--text)', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>{p}</button>
          ))}
        </div>
      )}
    </div>
  )
}
