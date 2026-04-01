import React, { useRef, useState, useEffect, useCallback } from 'react'
import useStore from '../../store/useStore'

const HOUR_HEIGHT = 64  // px per hour
const SNAP        = 15  // snap to 15-min intervals
const DRAG_THRESHOLD = 4 // px before drag is recognised

// ── helpers ────────────────────────────────────────────────
export function timeToMinutes(t) {
  if (!t) return 0
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
}

function snapMinutes(min) {
  return Math.round(min / SNAP) * SNAP
}

// ── component ──────────────────────────────────────────────
export default function TimeGrid({ date, projectFilter = null, onRequestAddTask }) {
  const { tasks, projects, fixedBlocks, activeHours } = useStore(s => ({
    tasks:       s.tasks,
    projects:    s.projects,
    fixedBlocks: s.fixedBlocks,
    activeHours: s.activeHours,
  }))
  const toggleTask = useStore(s => s.toggleTask)
  const updateTask = useStore(s => s.updateTask)

  // ── active range ─────────────────────────────────────────
  const rangeStart   = timeToMinutes(activeHours?.start ?? '00:00')
  const rangeEnd     = timeToMinutes(activeHours?.end   ?? '24:00')
  const rangeMins    = rangeEnd - rangeStart
  const startHour    = Math.floor(rangeStart / 60)
  const endHour      = Math.ceil(rangeEnd / 60)
  const visHours     = endHour - startHour
  const TOTAL_HEIGHT = visHours * HOUR_HEIGHT

  const minToY = useCallback((min) =>
    ((min - rangeStart) / rangeMins) * TOTAL_HEIGHT,
  [rangeStart, rangeMins, TOTAL_HEIGHT])

  const yToMin = useCallback((relY) => {
    const raw = (relY / TOTAL_HEIGHT) * rangeMins + rangeStart
    return Math.max(rangeStart, Math.min(rangeEnd - SNAP, snapMinutes(raw)))
  }, [rangeStart, rangeEnd, rangeMins, TOTAL_HEIGHT])

  // ── current time ─────────────────────────────────────────
  const now            = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const todayStr       = now.toISOString().split('T')[0]
  const showCurrentLine = date === todayStr &&
    currentMinutes >= rangeStart && currentMinutes <= rangeEnd

  // ── refs ─────────────────────────────────────────────────
  const gridRef    = useRef(null)
  const getTop     = () => gridRef.current?.getBoundingClientRect().top ?? 0

  // ── state: create-drag (empty grid area) ─────────────────
  const [createDrag, setCreateDrag] = useState(null) // { startMin, endMin }
  const isCreating  = useRef(false)

  // ── state: move-drag (existing task) ─────────────────────
  // { id, duration, offsetMin, startMin, endMin, originY, hasMoved }
  const [moveDrag, setMoveDrag] = useState(null)
  const isMoving   = useRef(false)

  // ── grid mousedown → create ───────────────────────────────
  const handleGridMouseDown = useCallback((e) => {
    if (e.button !== 0) return
    e.preventDefault()
    const min = yToMin(e.clientY - getTop())
    isCreating.current = true
    setCreateDrag({ startMin: min, endMin: min + SNAP })
  }, [yToMin])

  // ── task mousedown → move ─────────────────────────────────
  const handleTaskMouseDown = useCallback((e, task) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation() // prevent grid create-drag
    const taskStartMin = timeToMinutes(task.startTime)
    const taskEndMin   = timeToMinutes(task.endTime)
    const duration     = taskEndMin - taskStartMin
    const mouseMin     = yToMin(e.clientY - getTop())
    const offsetMin    = mouseMin - taskStartMin
    isMoving.current = true
    setMoveDrag({
      id: task.id,
      duration,
      offsetMin,
      startMin: taskStartMin,
      endMin:   taskEndMin,
      originY:  e.clientY,
      hasMoved: false,
    })
  }, [yToMin])

  // ── mousemove ─────────────────────────────────────────────
  const handleMouseMove = useCallback((e) => {
    if (isMoving.current && moveDrag) {
      const moved = Math.abs(e.clientY - moveDrag.originY) > DRAG_THRESHOLD
      const mouseMin  = yToMin(e.clientY - getTop())
      const newStart  = Math.max(rangeStart,
        Math.min(rangeEnd - moveDrag.duration, snapMinutes(mouseMin - moveDrag.offsetMin)))
      const newEnd    = newStart + moveDrag.duration
      setMoveDrag(d => d ? { ...d, startMin: newStart, endMin: newEnd, hasMoved: moved || d.hasMoved } : null)
      return
    }
    if (isCreating.current && createDrag) {
      const min = yToMin(e.clientY - getTop())
      setCreateDrag(d => d ? { ...d, endMin: Math.max(d.startMin + SNAP, min) } : null)
    }
  }, [moveDrag, createDrag, yToMin, rangeStart, rangeEnd])

  // ── mouseup ───────────────────────────────────────────────
  const handleMouseUp = useCallback((e) => {
    // ── finish move ──
    if (isMoving.current && moveDrag) {
      isMoving.current = false
      const { id, hasMoved, startMin, endMin } = moveDrag
      setMoveDrag(null)
      if (hasMoved) {
        updateTask(id, {
          startTime: minutesToTime(startMin),
          endTime:   minutesToTime(endMin),
        })
      } else {
        // short press without move → toggle
        toggleTask(id)
      }
      return
    }
    // ── finish create ──
    if (isCreating.current && createDrag) {
      isCreating.current = false
      const startMin = Math.min(createDrag.startMin, createDrag.endMin)
      const endMin   = Math.max(createDrag.startMin, createDrag.endMin)
      setCreateDrag(null)
      if (endMin - startMin < SNAP) return
      onRequestAddTask?.({
        defaultDate:  date,
        defaultStart: minutesToTime(startMin),
        defaultEnd:   minutesToTime(endMin),
      })
    }
  }, [moveDrag, createDrag, date, onRequestAddTask, updateTask, toggleTask])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup',   handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup',   handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  // ── scroll to top on range change ────────────────────────
  useEffect(() => {
    let el = gridRef.current?.parentElement
    while (el) {
      const { overflowY } = getComputedStyle(el)
      if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
        el.scrollTop = 0; break
      }
      el = el.parentElement
    }
  }, [rangeStart, rangeEnd])

  // ── filter tasks (date range 지원) ───────────────────────
  const dateTasks = tasks.filter(t => {
    const inRange = t.endDate ? (t.date <= date && date <= t.endDate) : t.date === date
    if (!inRange) return false
    if (!t.startTime || !t.endTime) return false
    if (projectFilter && t.projId !== projectFilter) return false
    return true
  })

  const dateObj  = new Date(date + 'T00:00:00')
  const jsDay    = dateObj.getDay()
  const dayIndex = jsDay === 0 ? 6 : jsDay - 1
  const fixedForDay = fixedBlocks.filter(b => b.days.includes(dayIndex))

  // ── render ───────────────────────────────────────────────
  return (
    <div
      ref={gridRef}
      className="relative select-none"
      style={{
        height: TOTAL_HEIGHT,
        minHeight: TOTAL_HEIGHT,
        cursor: isMoving.current ? 'grabbing' : 'default',
      }}
      onMouseDown={handleGridMouseDown}
    >
      {/* Hour lines & labels */}
      {Array.from({ length: visHours + 1 }, (_, i) => {
        const h = startHour + i
        if (h > 24) return null
        return (
          <div
            key={h}
            className="absolute left-0 right-0 flex items-start"
            style={{ top: i * HOUR_HEIGHT, height: i < visHours ? HOUR_HEIGHT : 0 }}
          >
            <span
              className="text-right pr-2 flex-shrink-0"
              style={{ width: 40, fontSize: 10, color: '#444', lineHeight: 1, paddingTop: 2 }}
            >
              {h === 24 ? '24:00' : `${String(h).padStart(2,'0')}:00`}
            </span>
            <div className="flex-1" style={{ borderTop: '1px solid #1e1e1e' }} />
          </div>
        )
      })}

      {/* Half-hour sub-lines */}
      {Array.from({ length: visHours }, (_, i) => (
        <div key={`h${i}`} className="absolute right-0"
          style={{ left: 40, top: i * HOUR_HEIGHT + HOUR_HEIGHT / 2, borderTop: '1px solid #161616' }}
        />
      ))}

      {/* Fixed blocks */}
      {fixedForDay.map(fb => {
        const s = Math.max(timeToMinutes(fb.startTime), rangeStart)
        const e = Math.min(timeToMinutes(fb.endTime),   rangeEnd)
        if (e <= s) return null
        const top = minToY(s)
        return (
          <div key={fb.id} className="absolute rounded pointer-events-none"
            style={{ left: 44, right: 4, top, height: Math.max(minToY(e) - top, 20),
              background: fb.color, opacity: 0.35, zIndex: 1 }}
          >
            <span className="absolute top-1 left-2" style={{ color: '#ccc', fontSize: 10 }}>{fb.name}</span>
          </div>
        )
      })}

      {/* Task blocks */}
      {dateTasks.map(task => {
        const proj     = projects.find(p => p.id === task.projId)
        const color    = proj?.color ?? '#60a5fa'
        const isBeingMoved = moveDrag?.id === task.id

        // If being moved, use live drag position; otherwise use stored times
        const sMin = isBeingMoved ? moveDrag.startMin : Math.max(timeToMinutes(task.startTime), rangeStart)
        const eMin = isBeingMoved ? moveDrag.endMin   : Math.min(timeToMinutes(task.endTime),   rangeEnd)
        if (!isBeingMoved && eMin <= sMin) return null

        const top    = minToY(sMin)
        const height = Math.max(minToY(eMin) - top, 20)

        return (
          <div
            key={task.id}
            className="absolute rounded overflow-hidden"
            style={{
              left: 44, right: 4,
              top, height,
              background: color + '22',
              borderLeft: `3px solid ${color}`,
              zIndex: isBeingMoved ? 20 : 2,
              opacity: task.done ? 0.45 : isBeingMoved && moveDrag.hasMoved ? 0.85 : 1,
              cursor: isBeingMoved && moveDrag.hasMoved ? 'grabbing' : 'grab',
              boxShadow: isBeingMoved && moveDrag.hasMoved ? `0 4px 16px rgba(0,0,0,0.5)` : 'none',
              transition: isBeingMoved ? 'none' : 'box-shadow 0.1s',
            }}
            onMouseDown={(e) => handleTaskMouseDown(e, task)}
          >
            <div className="px-2 pt-1 pointer-events-none">
              <p className="text-xs font-medium leading-tight truncate"
                style={{ color: task.done ? '#666' : color }}>
                {task.text}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#555', fontSize: 10 }}>
                {isBeingMoved
                  ? `${minutesToTime(moveDrag.startMin)} – ${minutesToTime(moveDrag.endMin)}`
                  : `${task.startTime} – ${task.endTime}`}
              </p>
            </div>
          </div>
        )
      })}

      {/* Create-drag preview */}
      {createDrag && (() => {
        const s = Math.min(createDrag.startMin, createDrag.endMin)
        const e = Math.max(createDrag.startMin, createDrag.endMin)
        return (
          <div className="absolute rounded pointer-events-none"
            style={{ left: 44, right: 4,
              top: minToY(s), height: Math.max(minToY(e) - minToY(s), 10),
              background: 'rgba(96,165,250,0.2)', border: '1px dashed #60a5fa', zIndex: 10 }}
          >
            <span className="absolute top-1 left-2" style={{ color: '#60a5fa', fontSize: 10 }}>
              {minutesToTime(s)} – {minutesToTime(e)}
            </span>
          </div>
        )
      })()}

      {/* Current time line */}
      {showCurrentLine && (
        <div className="absolute pointer-events-none"
          style={{ left: 40, right: 0, top: minToY(currentMinutes), zIndex: 20 }}
        >
          <div className="flex items-center">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#ef4444' }} />
            <div className="flex-1" style={{ borderTop: '2px solid #ef4444' }} />
          </div>
        </div>
      )}
    </div>
  )
}
