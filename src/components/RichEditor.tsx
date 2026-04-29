import { useRef, useEffect, useState, useCallback } from 'react'

const MAX_LENGTH = 10000

const FONT_SIZES = [
  { label: '소 (12)', value: '12px' },
  { label: '기본 (14)', value: '14px' },
  { label: '중 (16)', value: '16px' },
  { label: '대 (18)', value: '18px' },
  { label: '특대 (22)', value: '22px' },
]

const PRESET_COLORS = [
  '#000000', '#e03060', '#ff6b9d', '#c77dff',
  '#4a80ee', '#00b894', '#f39c12', '#888888',
]

interface Props {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

// 선택 영역 저장/복원 (color picker로 포커스 이동 시 필요)
function saveSelection(): Range | null {
  const sel = window.getSelection()
  if (sel && sel.rangeCount > 0) return sel.getRangeAt(0).cloneRange()
  return null
}
function restoreSelection(range: Range | null) {
  if (!range) return
  const sel = window.getSelection()
  if (!sel) return
  sel.removeAllRanges()
  sel.addRange(range)
}

// 선택된 텍스트를 span으로 감싸기
function wrapSelectionWithSpan(range: Range, styleKey: string, styleVal: string) {
  if (range.collapsed) return
  const span = document.createElement('span')
  span.style[styleKey as any] = styleVal
  try {
    range.surroundContents(span)
  } catch {
    // 부분 노드 선택 시 fallback
    const fragment = range.extractContents()
    span.appendChild(fragment)
    range.insertNode(span)
  }
}

export default function RichEditor({ value, onChange, placeholder }: Props) {
  const editorRef = useRef<HTMLDivElement>(null)
  const savedRange = useRef<Range | null>(null)
  const [showTablePicker, setShowTablePicker] = useState(false)
  const [tableRows, setTableRows] = useState(3)
  const tableCols = useRef(3)

  // 외부 value 변경 시 동기화 (처음 마운트만)
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value || ''
    }
  }, []) // eslint-disable-line

  const handleInput = useCallback(() => {
    if (!editorRef.current) return
    const text = editorRef.current.innerText || ''
    if (text.length > MAX_LENGTH) {
      // 초과분 제거
      editorRef.current.innerText = text.slice(0, MAX_LENGTH)
      // 커서를 끝으로
      const sel = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(editorRef.current)
      range.collapse(false)
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
    onChange(editorRef.current.innerHTML)
  }, [onChange])

  // ── 서식 ───────────────────────────────────────────

  function applyBold() {
    editorRef.current?.focus()
    document.execCommand('bold', false)
    onChange(editorRef.current?.innerHTML || '')
  }

  function applyFontSize(size: string) {
    editorRef.current?.focus()
    restoreSelection(savedRange.current)
    const range = saveSelection()
    if (range && !range.collapsed) {
      wrapSelectionWithSpan(range, 'fontSize', size)
      onChange(editorRef.current?.innerHTML || '')
    }
  }

  function applyColor(color: string) {
    editorRef.current?.focus()
    restoreSelection(savedRange.current)
    const range = saveSelection()
    if (range && !range.collapsed) {
      wrapSelectionWithSpan(range, 'color', color)
      onChange(editorRef.current?.innerHTML || '')
    }
  }

  function insertTable(rows: number, cols: number) {
    editorRef.current?.focus()
    restoreSelection(savedRange.current)
    const colWidth = Math.floor(100 / cols)
    const html =
      `<table style="border-collapse:collapse;width:100%;margin:8px 0;table-layout:fixed">` +
      Array.from({ length: rows }, () =>
        `<tr>${Array.from({ length: cols }, () =>
          `<td style="border:1.5px solid #ddd;padding:6px 10px;width:${colWidth}%;min-width:40px">&nbsp;</td>`
        ).join('')}</tr>`
      ).join('') +
      `</table><p><br></p>`
    document.execCommand('insertHTML', false, html)
    onChange(editorRef.current?.innerHTML || '')
    setShowTablePicker(false)
  }

  const charCount = (editorRef.current?.innerText || value?.replace(/<[^>]+>/g, '') || '').length

  const toolBtn: React.CSSProperties = {
    background: '#fff',
    border: '1.5px solid var(--gray2)',
    borderRadius: 6,
    padding: '4px 10px',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    color: 'var(--text)',
    lineHeight: 1.4,
  }

  return (
    <div>
      {/* ── 툴바 ── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 5, padding: '8px 10px',
        background: 'var(--pk5)', borderRadius: '10px 10px 0 0',
        border: '1.5px solid var(--gray2)', borderBottom: 'none',
        alignItems: 'center',
      }}>
        {/* 굵게 */}
        <button
          onMouseDown={e => { e.preventDefault(); applyBold() }}
          style={{ ...toolBtn, fontWeight: 900, fontSize: 15 }}
          title="굵게"
        >B</button>

        {/* 폰트 크기 */}
        <select
          onMouseDown={() => { savedRange.current = saveSelection() }}
          onChange={e => { applyFontSize(e.target.value); e.target.value = '' }}
          style={{ ...toolBtn, padding: '4px 6px', fontWeight: 400 }}
          defaultValue=""
        >
          <option value="" disabled>크기</option>
          {FONT_SIZES.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>

        {/* 글자색 — 프리셋 팔레트 */}
        <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              onMouseDown={e => {
                e.preventDefault()
                savedRange.current = saveSelection()
                applyColor(c)
              }}
              title={c}
              style={{
                width: 20, height: 20, borderRadius: '50%',
                background: c, border: '1.5px solid rgba(0,0,0,.12)',
                cursor: 'pointer', flexShrink: 0, padding: 0,
              }}
            />
          ))}
        </div>

        {/* 표 삽입 */}
        <div style={{ position: 'relative' }}>
          <button
            onMouseDown={e => {
              e.preventDefault()
              savedRange.current = saveSelection()
              setShowTablePicker(v => !v)
            }}
            style={toolBtn}
            title="표 삽입"
          >⊞ 표</button>

          {showTablePicker && (
            <div style={{
              position: 'absolute', top: 34, left: 0, zIndex: 100,
              background: '#fff', border: '1.5px solid var(--gray2)',
              borderRadius: 10, padding: 14, boxShadow: '0 8px 24px rgba(0,0,0,.12)',
              minWidth: 180,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>표 크기 설정</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 13 }}>
                <label>행</label>
                <input type="number" min={1} max={20} defaultValue={3}
                  onChange={e => setTableRows(Number(e.target.value))}
                  style={{ width: 48, border: '1.5px solid var(--gray2)', borderRadius: 6, padding: '4px 6px', fontSize: 13, textAlign: 'center' }} />
                <label>열</label>
                <input type="number" min={1} max={10} defaultValue={3}
                  onChange={e => { tableCols.current = Number(e.target.value) }}
                  style={{ width: 48, border: '1.5px solid var(--gray2)', borderRadius: 6, padding: '4px 6px', fontSize: 13, textAlign: 'center' }} />
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => insertTable(tableRows, tableCols.current || 3)}
                  style={{ flex: 1, background: 'var(--pk)', color: '#fff', border: 'none', borderRadius: 7, padding: '7px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >삽입</button>
                <button
                  onClick={() => setShowTablePicker(false)}
                  style={{ flex: 1, background: 'var(--gray1)', color: 'var(--text2)', border: 'none', borderRadius: 7, padding: '7px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >취소</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 에디터 본문 ── */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onMouseUp={() => { savedRange.current = saveSelection() }}
        onKeyUp={() => { savedRange.current = saveSelection() }}
        data-placeholder={placeholder || '내용을 입력하세요'}
        style={{
          minHeight: 220,
          border: '1.5px solid var(--gray2)',
          borderRadius: '0 0 10px 10px',
          padding: '12px 14px',
          fontSize: 14,
          lineHeight: 1.8,
          outline: 'none',
          overflowY: 'auto',
          fontFamily: 'inherit',
          color: 'var(--text)',
        }}
      />

      {/* 글자 수 */}
      <div style={{
        fontSize: 11,
        color: charCount >= MAX_LENGTH * 0.9 ? '#e03060' : 'var(--text2)',
        textAlign: 'right',
        marginTop: 4,
      }}>
        {charCount.toLocaleString()} / {MAX_LENGTH.toLocaleString()}자
      </div>

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #bbb;
          pointer-events: none;
        }
        [contenteditable] table td {
          border: 1.5px solid #ddd !important;
        }
      `}</style>
    </div>
  )
}
