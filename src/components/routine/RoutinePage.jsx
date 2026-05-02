import React, { useState, useRef, useEffect } from 'react'
import useStore from '../../store/useStore'

const todayStr = new Date().toISOString().split('T')[0]

const DAYS = [
  { label: '월', jsDay: 1 },
  { label: '화', jsDay: 2 },
  { label: '수', jsDay: 3 },
  { label: '목', jsDay: 4 },
  { label: '금', jsDay: 5 },
  { label: '토', jsDay: 6 },
  { label: '일', jsDay: 0 },
]

const COLOR_OPTIONS = [
  '#60a5fa','#34d399','#fbbf24','#f87171','#a78bfa',
  '#fb923c','#38bdf8','#4ade80','#f472b6','#818cf8',
]

const todayJsDay = new Date().getDay()

// ── Time grid constants ──────────────────────────────────────
const H_START     = 5
const H_END       = 23
const PX_PER_HOUR = 64
const TIME_COL_W  = 48
const TOTAL_H     = (H_END - H_START) * PX_PER_HOUR

const toMin    = (t)   => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
const minToY   = (min) => (min - H_START * 60) * PX_PER_HOUR / 60
const minToStr = (min) => {
  const h = Math.floor(Math.min(min, H_END * 60) / 60)
  const m = min % 60
  return `${String(h % 24).padStart(2,'0')}:${String(m).padStart(2,'0')}`
}

// Build hour & half-hour marks
const MARKS = []
for (let h = H_START; h <= H_END; h++) {
  MARKS.push({ min: h * 60, isHour: true, label: `${String(h).padStart(2,'0')}:00` })
  if (h < H_END) MARKS.push({ min: h * 60 + 30, isHour: false })
}

// ── Grid position helper (outside component — uses only constants + el ref) ─
function getGridPos(e, scrollEl) {
  if (!scrollEl) return null
  const rect = scrollEl.getBoundingClientRect()
  const relX  = e.clientX - rect.left + scrollEl.scrollLeft
  const relY  = e.clientY - rect.top  + scrollEl.scrollTop
  if (relX < TIME_COL_W) return null           // clicked on time ruler
  const gridW  = Math.max(1, scrollEl.scrollWidth - TIME_COL_W)
  const colW   = gridW / 7
  const dayIdx = Math.max(0, Math.min(6, Math.floor((relX - TIME_COL_W) / colW)))
  const rawMin = relY / PX_PER_HOUR * 60 + H_START * 60
  const min    = Math.max(H_START * 60, Math.min(H_END * 60, Math.round(rawMin / 15) * 15))
  return { dayIdx, min }
}

// ── RoutineModal ─────────────────────────────────────────────
function RoutineModal({ routine, initial, onClose }) {
  const addRoutine    = useStore(s => s.addRoutine)
  const updateRoutine = useStore(s => s.updateRoutine)

  const isEdit = !!routine?.id

  const [name,      setName]      = useState(routine?.name      ?? '')
  const [startTime, setStartTime] = useState(routine?.startTime ?? initial?.startTime ?? '08:00')
  const [endTime,   setEndTime]   = useState(routine?.endTime   ?? initial?.endTime   ?? '09:00')
  const [color,     setColor]     = useState(routine?.color     ?? '#60a5fa')
  const [days,      setDays]      = useState(new Set(
    routine?.days ?? initial?.days ?? [1,2,3,4,5]
  ))
  const [startDate, setStartDate] = useState(routine?.startDate ?? initial?.startDate ?? todayStr)
  const [endDate,   setEndDate]   = useState(routine?.endDate   ?? '')

  const toggleDay = (jsDay) =>
    setDays(prev => { const n = new Set(prev); n.has(jsDay) ? n.delete(jsDay) : n.add(jsDay); return n })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    const data = { name: name.trim(), startTime, endTime, color, days: [...days], startDate, endDate: endDate || null }
    isEdit ? updateRoutine(routine.id, data) : addRoutine(data)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onMouseDown={e => e.stopPropagation()}
    >
      <div className="rounded-xl p-5 shadow-xl"
        style={{ background: '#1a1a1a', border: '1px solid #2e2e2e', width: 340 }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: '#efefef' }}>
          {isEdit ? '루틴 수정' : '새 루틴'}
        </h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">

          {/* 이름 */}
          <div>
            <label className="block text-xs mb-1" style={{ color: '#888' }}>이름</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="루틴 이름"
              className="w-full px-3 py-2 rounded text-sm outline-none"
              style={{ background: '#131313', border: '1px solid #2e2e2e', color: '#efefef' }}
            />
          </div>

          {/* 시간 */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs mb-1" style={{ color: '#888' }}>시작</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded text-sm outline-none"
                style={{ background: '#131313', border: '1px solid #2e2e2e', color: '#efefef', colorScheme: 'dark' }} />
            </div>
            <div className="flex-1">
              <label className="block text-xs mb-1" style={{ color: '#888' }}>종료</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded text-sm outline-none"
                style={{ background: '#131313', border: '1px solid #2e2e2e', color: '#efefef', colorScheme: 'dark' }} />
            </div>
          </div>

          {/* 요일 */}
          <div>
            <label className="block text-xs mb-2" style={{ color: '#888' }}>반복 요일</label>
            <div className="flex gap-1.5">
              {DAYS.map(d => (
                <button key={d.jsDay} type="button"
                  onClick={() => toggleDay(d.jsDay)}
                  className="w-8 h-8 rounded-full text-xs font-medium transition-all"
                  style={{
                    background: days.has(d.jsDay) ? color + '33' : '#131313',
                    color:      days.has(d.jsDay) ? color        : '#555',
                    border:     days.has(d.jsDay) ? `1px solid ${color}66` : '1px solid #222',
                  }}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* 기간 */}
          <div>
            <label className="block text-xs mb-1.5" style={{ color: '#888' }}>기간</label>
            <div className="flex gap-2 items-center">
              {/* 시작일 */}
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="flex-1 px-2 py-1.5 rounded text-xs outline-none"
                style={{ background: '#131313', border: '1px solid #2e2e2e', color: '#ccc', colorScheme: 'dark' }}
              />
              <span style={{ color: '#444', fontSize: 11, flexShrink: 0 }}>→</span>
              {/* 종료일 */}
              <div className="flex-1 relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  placeholder="없음"
                  className="w-full px-2 py-1.5 rounded text-xs outline-none"
                  style={{
                    background: '#131313',
                    border: `1px solid ${endDate ? '#2e2e2e' : '#1e1e1e'}`,
                    color: endDate ? '#ccc' : '#444',
                    colorScheme: 'dark',
                  }}
                />
                {endDate && (
                  <button
                    type="button"
                    onClick={() => setEndDate('')}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded text-xs"
                    style={{ color: '#666', background: '#222', lineHeight: 1 }}
                  >×</button>
                )}
              </div>
            </div>
            {!endDate && (
              <p className="text-xs mt-1" style={{ color: '#3a3a3a' }}>종료일 미설정 시 계속 반복</p>
            )}
          </div>

          {/* 색상 */}
          <div>
            <label className="block text-xs mb-2" style={{ color: '#888' }}>색상</label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className="w-6 h-6 rounded-full border-2 transition-all"
                  style={{ background: c, borderColor: color === c ? '#fff' : 'transparent' }} />
              ))}
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 mt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-3 py-2 rounded text-sm"
              style={{ background: '#222', color: '#aaa', border: '1px solid #2e2e2e' }}>
              취소
            </button>
            <button type="submit"
              className="flex-1 px-3 py-2 rounded text-sm font-medium"
              style={{ background: color, color: '#000' }}>
              {isEdit ? '저장' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────
export default function RoutinePage() {
  const routines      = useStore(s => s.routines)
  const deleteRoutine = useStore(s => s.deleteRoutine)

  const [modal,   setModal]   = useState(null)
  const [dragVis, setDragVis] = useState(null)
  // dragVis = { startDayIdx, currentDayIdx, startMin, currentMin }

  const scrollRef = useRef(null)
  const dragRef   = useRef(null)   // actual drag state (ref for stable handlers)

  // ── Drag handlers (attached to document once) ──────────────
  useEffect(() => {
    const onMove = (e) => {
      if (!dragRef.current) return
      const pos = getGridPos(e, scrollRef.current)
      if (!pos) return
      dragRef.current = { ...dragRef.current, currentDayIdx: pos.dayIdx, currentMin: pos.min }
      setDragVis({ ...dragRef.current })
    }

    const onUp = () => {
      if (!dragRef.current) return
      const d = dragRef.current
      dragRef.current = null
      setDragVis(null)

      const minDayIdx = Math.min(d.startDayIdx, d.currentDayIdx)
      const maxDayIdx = Math.max(d.startDayIdx, d.currentDayIdx)
      const startMin  = Math.min(d.startMin, d.currentMin)
      const rawEnd    = Math.max(d.startMin, d.currentMin)
      const endMin    = Math.min(rawEnd < startMin + 30 ? startMin + 30 : rawEnd, H_END * 60)
      const days      = DAYS.slice(minDayIdx, maxDayIdx + 1).map(dd => dd.jsDay)

      setModal({ mode: 'add', initial: { startTime: minToStr(startMin), endTime: minToStr(endMin), days, startDate: todayStr } })
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup',   onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup',   onUp)
    }
  }, []) // stable: reads refs, setModal/setDragVis are stable setState refs

  const handleMouseDown = (e) => {
    if (e.button !== 0) return
    const pos = getGridPos(e, scrollRef.current)
    if (!pos) return
    e.preventDefault()
    const init = { startDayIdx: pos.dayIdx, currentDayIdx: pos.dayIdx, startMin: pos.min, currentMin: pos.min }
    dragRef.current = init
    setDragVis(init)
  }

  // Derived values for rendering the drag preview
  const di = dragVis ? {
    minDayIdx: Math.min(dragVis.startDayIdx, dragVis.currentDayIdx),
    maxDayIdx: Math.max(dragVis.startDayIdx, dragVis.currentDayIdx),
    startMin:  Math.min(dragVis.startMin, dragVis.currentMin),
    endMin:    Math.max(dragVis.startMin, dragVis.currentMin),
  } : null

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#0a0a0a' }}>

      {/* ── Header ───────────────────────────────────────── */}
      <div className="px-6 py-4 flex-shrink-0 flex items-center justify-between"
        style={{ borderBottom: '1px solid #1a1a1a' }}>
        <div>
          <h1 className="text-sm font-semibold" style={{ color: '#efefef' }}>데일리 루틴</h1>
          <p className="text-xs mt-0.5" style={{ color: '#555' }}>
            그리드를 드래그하거나 버튼으로 루틴을 추가하세요
          </p>
        </div>
        <button
          onClick={() => setModal({ mode: 'add', initial: {} })}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{ background: '#60a5fa22', color: '#60a5fa', border: '1px solid #60a5fa44' }}
          onMouseEnter={e => e.currentTarget.style.background = '#60a5fa33'}
          onMouseLeave={e => e.currentTarget.style.background = '#60a5fa22'}
        >
          <span style={{ fontSize: 15, lineHeight: 1, marginTop: -1 }}>+</span>
          루틴 추가
        </button>
      </div>

      {/* ── Day headers ──────────────────────────────────── */}
      <div className="flex flex-shrink-0"
        style={{ background: '#0a0a0a', borderBottom: '1px solid #1a1a1a', paddingLeft: TIME_COL_W, minWidth: 560 + TIME_COL_W }}>
        {DAYS.map(({ label, jsDay }) => {
          const isToday = jsDay === todayJsDay
          return (
            <div key={jsDay}
              className="flex-1 flex items-center justify-center gap-1.5 py-2"
              style={{ minWidth: 72, borderLeft: '1px solid #141414' }}>
              <span className="text-xs font-semibold select-none"
                style={{ color: isToday ? '#34d399' : '#555' }}>
                {label}
              </span>
              {isToday && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#34d399' }} />}
            </div>
          )
        })}
      </div>

      {/* ── Time grid ────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-auto"
        style={{ cursor: 'crosshair', userSelect: 'none' }}
        onMouseDown={handleMouseDown}
      >
        <div className="flex" style={{ minWidth: 560 + TIME_COL_W, height: TOTAL_H }}>

          {/* Time ruler */}
          <div className="flex-shrink-0 relative" style={{ width: TIME_COL_W, height: TOTAL_H }}>
            {MARKS.filter(m => m.isHour).map(m => (
              <div key={m.min} className="absolute right-2 select-none"
                style={{
                  top: minToY(m.min) - 7,
                  color: '#383838',
                  fontSize: 10,
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                {m.label}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {DAYS.map(({ jsDay }, dayIdx) => {
            const dayRoutines = routines.filter(r => r.days.includes(jsDay))
            const showDrag = di && dayIdx >= di.minDayIdx && dayIdx <= di.maxDayIdx

            return (
              <div key={jsDay} className="flex-1 relative"
                style={{ minWidth: 72, height: TOTAL_H, borderLeft: '1px solid #141414' }}>

                {/* Grid lines */}
                {MARKS.map(m => (
                  <div key={m.min} className="absolute left-0 right-0"
                    style={{ top: minToY(m.min), height: 1, background: m.isHour ? '#1e1e1e' : '#131313' }} />
                ))}

                {/* Drag preview */}
                {showDrag && (() => {
                  const top    = minToY(di.startMin)
                  const bottom = minToY(Math.max(di.endMin, di.startMin + 30))
                  const height = Math.max(bottom - top, 4)
                  return (
                    <div className="absolute rounded pointer-events-none" style={{
                      top, height, left: 3, right: 3,
                      background: '#60a5fa1a',
                      border: '1px solid #60a5fa55',
                      zIndex: 10,
                    }}>
                      {/* Time label — only in first selected column */}
                      {dayIdx === di.minDayIdx && height > 22 && (
                        <span className="absolute inset-x-0 top-1 text-center select-none"
                          style={{ color: '#60a5facc', fontSize: 9, lineHeight: 1 }}>
                          {minToStr(di.startMin)}–{minToStr(Math.max(di.endMin, di.startMin + 30))}
                        </span>
                      )}
                    </div>
                  )
                })()}

                {/* Existing routine blocks */}
                {dayRoutines.map(r => {
                  const sMin = Math.max(toMin(r.startTime), H_START * 60)
                  const eMin = Math.min(toMin(r.endTime),   H_END   * 60)
                  if (eMin <= sMin) return null
                  const top    = minToY(sMin)
                  const height = Math.max(minToY(eMin) - top, 18)

                  return (
                    <div key={r.id}
                      className="absolute rounded group"
                      style={{
                        top, height, left: 3, right: 3,
                        background: r.color + '1e',
                        borderLeft: `2px solid ${r.color}99`,
                        zIndex: 2,
                        cursor: 'pointer',
                        transition: 'background 0.1s',
                      }}
                      onMouseDown={e => e.stopPropagation()}
                      onClick={() => setModal({ mode: 'edit', routine: r })}
                      onMouseEnter={e => e.currentTarget.style.background = r.color + '38'}
                      onMouseLeave={e => e.currentTarget.style.background = r.color + '1e'}
                    >
                      <p className="truncate font-medium select-none"
                        style={{ color: r.color, fontSize: 10, lineHeight: 1.4, padding: '2px 18px 0 6px' }}>
                        {r.name}
                      </p>
                      {height > 28 && (
                        <p className="select-none" style={{ color: '#555', fontSize: 9, paddingLeft: 6 }}>
                          {r.startTime}–{r.endTime}
                        </p>
                      )}
                      {/* Delete */}
                      <button
                        className="absolute top-0.5 right-0.5 w-4 h-4 rounded hidden group-hover:flex items-center justify-center text-xs"
                        style={{ background: 'rgba(0,0,0,0.65)', color: '#888' }}
                        onClick={e => { e.stopPropagation(); deleteRoutine(r.id) }}
                      >×</button>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Modal ────────────────────────────────────────── */}
      {modal?.mode === 'add' && (
        <RoutineModal initial={modal.initial} onClose={() => setModal(null)} />
      )}
      {modal?.mode === 'edit' && (
        <RoutineModal routine={modal.routine} onClose={() => setModal(null)} />
      )}
    </div>
  )
}
