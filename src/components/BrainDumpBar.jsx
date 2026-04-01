import React, { useState, useRef, useEffect, useCallback } from 'react'
import useStore from '../store/useStore'
import { parseDump, formatDuration } from '../utils/parseDump'

const HINTS = [
  { tag: '#프로젝트', color: '#60a5fa', desc: '프로젝트' },
  { tag: '~1h',      color: '#a78bfa', desc: '소요시간' },
  { tag: '!긴급',    color: '#f87171', desc: '긴급'     },
  { tag: '내일',     color: '#4ade80', desc: '날짜'     },
  { tag: '09:00',    color: '#fbbf24', desc: '시간'     },
]

export default function BrainDumpBar() {
  const { projects, addTask } = useStore(s => ({
    projects: s.projects,
    addTask:  s.addTask,
  }))

  const [input,   setInput]   = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef(null)

  const parsed = parseDump(input, projects)
  const proj   = projects.find(p => p.id === parsed.projId)

  const hasMeta = parsed.projId || parsed.urgent || parsed.duration ||
                  parsed.date   || parsed.startTime

  // ── Cmd+K / Ctrl+K 전역 단축키 ───────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // ── 제출 ─────────────────────────────────────────────────
  const handleSubmit = useCallback((e) => {
    e?.preventDefault()
    const text = parsed.text || input.trim()
    if (!text) return

    addTask({
      text,
      projId:    parsed.projId    || null,
      date:      parsed.date      || null,
      startTime: parsed.startTime || null,
      endTime:   parsed.endTime   || null,
      urgent:    parsed.urgent    || false,
      duration:  parsed.duration  || null,
    })
    setInput('')
  }, [parsed, input, addTask])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() }
    if (e.key === 'Escape') { setInput(''); inputRef.current?.blur() }
  }

  const appendTag = (tag) => {
    setInput(v => (v.trimEnd() + ' ' + tag + ' ').trimStart())
    inputRef.current?.focus()
  }

  const isExpanded = focused || input.length > 0

  return (
    <div
      className="flex-shrink-0"
      style={{
        background:  '#0c0c0c',
        borderTop:   '1px solid #1e1e1e',
        transition:  'all 0.15s ease',
      }}
    >
      <form onSubmit={handleSubmit}>
        {/* ── 입력 행 ── */}
        <div className="flex items-center gap-2 px-4" style={{ height: 48 }}>
          {/* 아이콘 */}
          <span style={{ fontSize: 14, color: focused ? '#60a5fa' : '#333', flexShrink: 0, transition: 'color 0.15s' }}>
            ⚡
          </span>

          {/* 입력창 */}
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="할 일 빠르게 입력...  (#프로젝트  ~1h  !긴급  내일  09:00)"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: '#ddd', caretColor: '#60a5fa' }}
          />

          {/* 단축키 힌트 */}
          {!isExpanded && (
            <span className="text-xs flex-shrink-0" style={{ color: '#2a2a2a' }}>⌘K</span>
          )}

          {/* 추가 버튼 */}
          {input.trim() && (
            <button
              type="submit"
              className="px-3 py-1 rounded text-xs font-medium flex-shrink-0"
              style={{ background: '#60a5fa', color: '#000' }}
            >
              추가
            </button>
          )}
        </div>

        {/* ── 파싱된 메타 칩 ── */}
        {isExpanded && hasMeta && (
          <div className="flex items-center gap-1.5 px-4 pb-2.5 flex-wrap">
            {proj && (
              <span className="px-2 py-0.5 rounded-full text-xs"
                style={{ background: proj.color + '18', color: proj.color, border: `1px solid ${proj.color}33` }}>
                {proj.name}
              </span>
            )}
            {!proj && parsed.projTag && (
              <span className="px-2 py-0.5 rounded-full text-xs"
                style={{ background: '#2a2a2a', color: '#666', border: '1px solid #333' }}>
                #{parsed.projTag} (없음)
              </span>
            )}
            {parsed.date && (
              <span className="px-2 py-0.5 rounded-full text-xs"
                style={{ background: '#0f2a1a', color: '#4ade80', border: '1px solid #1a3a2a' }}>
                {parsed.date}
              </span>
            )}
            {parsed.startTime && (
              <span className="px-2 py-0.5 rounded-full text-xs"
                style={{ background: '#2a2a0f', color: '#fbbf24', border: '1px solid #3a3a1a' }}>
                {parsed.startTime}{parsed.endTime ? ` – ${parsed.endTime}` : ''}
              </span>
            )}
            {parsed.duration && (
              <span className="px-2 py-0.5 rounded-full text-xs"
                style={{ background: '#1a1a2a', color: '#a78bfa', border: '1px solid #2a2a3a' }}>
                ~{formatDuration(parsed.duration)}
              </span>
            )}
            {parsed.urgent && (
              <span className="px-2 py-0.5 rounded-full text-xs"
                style={{ background: '#2a0f0f', color: '#f87171', border: '1px solid #3a1a1a' }}>
                긴급
              </span>
            )}
            {parsed.text && (
              <span className="px-2 py-0.5 text-xs" style={{ color: '#444' }}>
                "{parsed.text}"
              </span>
            )}
          </div>
        )}

        {/* ── 힌트 태그 버튼 (빈 상태에서 포커스 시) ── */}
        {isExpanded && !input.trim() && (
          <div className="flex items-center gap-3 px-4 pb-2.5">
            {HINTS.map(({ tag, color, desc }) => (
              <button
                key={tag}
                type="button"
                onMouseDown={e => { e.preventDefault(); appendTag(tag) }}
                className="flex items-center gap-1 text-xs"
                style={{ color: '#444' }}
              >
                <span style={{ color }}>{tag}</span>
                <span>{desc}</span>
              </button>
            ))}
          </div>
        )}
      </form>
    </div>
  )
}
