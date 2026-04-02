import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import useStore from '../../store/useStore'
import EditTaskModal from '../modals/EditTaskModal'

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
export default function TimeGrid({ date, projectFilter = null, onRequestAddTask, showTimeLabels = true }) {
  const LABEL_W = showTimeLabels ? 40 : 0
  const BLOCK_L = showTimeLabels ? 44 : 4

  // ── 개별 스토어 구독 (불필요한 재렌더 방지) ─────────────
  const tasks       = useStore(s => s.tasks)
  const projects    = useStore(s => s.projects)
  const fixedBlocks = useStore(s => s.fixedBlocks)
  const activeHours = useStore(s => s.activeHours)
  const toggleTask  = useStore(s => s.toggleTask)
  const updateTask  = useStore(s => s.updateTask)

  // ── base active range (설정된 활동 시간) ─────────────────
  const baseStart = timeToMinutes(activeHours?.start ?? '00:00')
  const baseEnd   = timeToMinutes(activeHours?.end   ?? '24:00')

  // ── dateTasks + effective range 한 번에 계산 (연쇄 useMemo 제거) ──
  const { dateTasks, effectiveStart, effectiveEnd } = useMemo(() => {
    const filtered = tasks.filter(t => {
      const inRange = t.endDate ? (t.date <= date && date <= t.endDate) : t.date === date
      if (!inRange) return false
      if (!t.startTime || !t.endTime) return false
      if (projectFilter && t.projId !== projectFilter) return false
      return true
    })
    if (!filtered.length) {
      return { dateTasks: filtered, effectiveStart: baseStart, effectiveEnd: baseEnd }
    }
    const startMins = filtered.map(t => timeToMinutes(t.startTime))
    const endMins   = filtered.map(t => timeToMinutes(t.endTime))
    return {
      dateTasks:     filtered,
      effectiveStart: Math.min(baseStart, Math.floor(Math.min(...startMins) / 60) * 60),
      effectiveEnd:   Math.max(baseEnd,   Math.ceil(Math.max(...endMins)   / 60) * 60),
    }
  }, [tasks, date, projectFilter, baseStart, baseEnd])

  const effectiveMins = effectiveEnd - effectiveStart
  const startHour     = Math.floor(effectiveStart / 60)
  const endHour       = Math.ceil(effectiveEnd / 60)
  const visHours      = endHour - startHour
  const TOTAL_HEIGHT  = visHours * HOUR_HEIGHT

  const minToY = useCallback((min) =>
    ((min - effectiveStart) / effectiveMins) * TOTAL_HEIGHT,
  [effectiveStart, effectiveMins, TOTAL_HEIGHT])

  const yToMin = useCallback((relY) => {
    const raw = (relY / TOTAL_HEIGHT) * effectiveMins + effectiveStart
    return Math.max(effectiveStart, Math.min(effectiveEnd - SNAP, snapMinutes(raw)))
  }, [effectiveStart, effectiveEnd, effectiveMins, TOTAL_HEIGHT])

  // ── current time ─────────────────────────────────────────
  const now            = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const todayStr       = now.toISOString().split('T')[0]
  const showCurrentLine = date === todayStr &&
    currentMinutes >= effectiveStart && currentMinutes <= effectiveEnd

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

  // ── state: dump drop indicator ────────────────────────────
  const [dropIndicator, setDropIndicator] = useState(null) // minutes

  // ── state: edit modal ─────────────────────────────────────
  const [editTask, setEditTask] = useState(null)

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
      const newStart  = Math.max(effectiveStart,
        Math.min(effectiveEnd - moveDrag.duration, snapMinutes(mouseMin - moveDrag.offsetMin)))
      const newEnd    = newStart + moveDrag.duration
      setMoveDrag(d => d ? { ...d, startMin: newStart, endMin: newEnd, hasMoved: moved || d.hasMoved } : null)
      return
    }
    if (isCreating.current && createDrag) {
      const min = yToMin(e.clientY - getTop())
      setCreateDrag(d => d ? { ...d, endMin: Math.max(d.startMin + SNAP, min) } : null)
    }
  }, [moveDrag, createDrag, yToMin, effectiveStart, effectiveEnd])

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
        // short press without move → open edit modal
        const clicked = tasks.find(t => t.id === id)
        if (clicked) setEditTask(clicked)
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

  // ── dump drag-and-drop ────────────────────────────────────
  const handleDragOver = useCallback((e) => {
    if (!e.dataTransfer.types.includes('dumptaskid')) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const min = yToMin(e.clientY - getTop())
    setDropIndicator(min)
  }, [yToMin])

  const handleDragLeave = useCallback((e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setDropIndicator(null)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDropIndicator(null)
    const taskId = e.dataTransfer.getData('dumpTaskId')
    if (!taskId) return
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    const startMin = yToMin(e.clientY - getTop())
    const duration = task.duration ?? 60
    const endMin   = Math.min(startMin + duration, effectiveEnd)
    updateTask(taskId, {
      date,
      startTime: minutesToTime(startMin),
      endTime:   minutesToTime(endMin),
    })
  }, [tasks, yToMin, date, effectiveEnd, updateTask])

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
  }, [effectiveStart, effectiveEnd])

  const dateObj  = new Date(date + 'T00:00:00')
  const jsDay    = dateObj.getDay()
  const dayIndex = jsDay === 0 ? 6 : jsDay - 1
  const fixedForDay = fixedBlocks.filter(b => b.days.includes(dayIndex))

  // ── render ───────────────────────────────────────────────
  return (
    <>
    <div
      ref={gridRef}
      className="relative select-none"
      style={{
        height: TOTAL_HEIGHT,
        minHeight: TOTAL_HEIGHT,
        cursor: isMoving.current ? 'grabbing' : 'default',
      }}
      onMouseDown={handleGridMouseDown}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
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
            {showTimeLabels && (
              <span className="text-right pr-2 flex-shrink-0"
                style={{ width: LABEL_W, fontSize: 10, color: '#444', lineHeight: 1, paddingTop: 2 }}>
                {h === 24 ? '24:00' : `${String(h).padStart(2,'0')}:00`}
              </span>
            )}
            <div className="flex-1" style={{ borderTop: '1px solid #1e1e1e' }} />
          </div>
        )
      })}

      {/* Half-hour sub-lines */}
      {Array.from({ length: visHours }, (_, i) => (
        <div key={`h${i}`} className="absolute right-0"
          style={{ left: LABEL_W, top: i * HOUR_HEIGHT + HOUR_HEIGHT / 2, borderTop: '1px solid #161616' }}
        />
      ))}

      {/* Fixed blocks */}
      {fixedForDay.map(fb => {
        const s = Math.max(timeToMinutes(fb.startTime), effectiveStart)
        const e = Math.min(timeToMinutes(fb.endTime),   effectiveEnd)
        if (e <= s) return null
        const top = minToY(s)
        return (
          <div key={fb.id} className="absolute rounded pointer-events-none"
            style={{ left: BLOCK_L, right: 4, top, height: Math.max(minToY(e) - top, 20),
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

        // If being moved, use live drag position; otherwise use stored times (no clamping)
        const sMin = isBeingMoved ? moveDrag.startMin : timeToMinutes(task.startTime)
        const eMin = isBeingMoved ? moveDrag.endMin   : timeToMinutes(task.endTime)
        if (!isBeingMoved && eMin <= sMin) return null

        const top    = minToY(sMin)
        const height = Math.max(minToY(eMin) - top, 20)

        return (
          <div
            key={task.id}
            className="absolute rounded overflow-hidden group/task"
            style={{
              left: BLOCK_L, right: 4,
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
            {/* 일정 제외 버튼 — 호버 시 노출 */}
            <button
              className="absolute opacity-0 group-hover/task:opacity-100 transition-opacity"
              style={{
                top: 4, right: 4,
                width: 16, height: 16,
                borderRadius: 4,
                background: 'rgba(0,0,0,0.55)',
                color: '#aaa',
                fontSize: 12,
                lineHeight: '16px',
                textAlign: 'center',
                cursor: 'pointer',
                pointerEvents: 'auto',
              }}
              title="일정에서 제외 (덤프로 이동)"
              onMouseDown={e => e.stopPropagation()}
              onClick={e => {
                e.stopPropagation()
                updateTask(task.id, { date: null, endDate: null, startTime: null, endTime: null })
              }}
            >
              ×
            </button>
          </div>
        )
      })}

      {/* Create-drag preview */}
      {createDrag && (() => {
        const s = Math.min(createDrag.startMin, createDrag.endMin)
        const e = Math.max(createDrag.startMin, createDrag.endMin)
        return (
          <div className="absolute rounded pointer-events-none"
            style={{ left: BLOCK_L, right: 4,
              top: minToY(s), height: Math.max(minToY(e) - minToY(s), 10),
              background: 'rgba(96,165,250,0.2)', border: '1px dashed #60a5fa', zIndex: 10 }}
          >
            <span className="absolute top-1 left-2" style={{ color: '#60a5fa', fontSize: 10 }}>
              {minutesToTime(s)} – {minutesToTime(e)}
            </span>
          </div>
        )
      })()}

      {/* Dump drop indicator */}
      {dropIndicator !== null && (
        <div className="absolute pointer-events-none"
          style={{ left: LABEL_W, right: 0, top: minToY(dropIndicator), zIndex: 30 }}
        >
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#60a5fa' }} />
            <div className="flex-1" style={{ borderTop: '2px solid #60a5fa' }} />
            <span style={{ color: '#60a5fa', fontSize: 10, paddingRight: 4 }}>{minutesToTime(dropIndicator)}</span>
          </div>
        </div>
      )}

      {/* Current time line */}
      {showCurrentLine && (
        <div className="absolute pointer-events-none"
          style={{ left: LABEL_W, right: 0, top: minToY(currentMinutes), zIndex: 20 }}
        >
          <div className="flex items-center">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#ef4444' }} />
            <div className="flex-1" style={{ borderTop: '2px solid #ef4444' }} />
          </div>
        </div>
      )}
    </div>

    {editTask && (
      <EditTaskModal task={editTask} onClose={() => setEditTask(null)} />
    )}
    </>
  )
}
