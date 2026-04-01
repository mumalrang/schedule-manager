import React, { useRef, useState, useEffect, useCallback } from 'react'
import useStore from '../../store/useStore'

const HOUR_HEIGHT = 64  // px per hour
const TOTAL_HEIGHT = HOUR_HEIGHT * 24
const SNAP = 15         // snap to 15-min intervals

// ── time helpers ───────────────────────────────────────────
export function timeToMinutes(t) {
  if (!t) return 0
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(min) {
  const h = Math.floor(min / 60) % 24
  const m = min % 60
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
}

function snapMinutes(min) {
  return Math.round(min / SNAP) * SNAP
}

function yToMinutes(y, containerY) {
  const relY = y - containerY
  const raw  = (relY / TOTAL_HEIGHT) * 1440
  return Math.max(0, Math.min(1440 - SNAP, snapMinutes(raw)))
}

// ── component ──────────────────────────────────────────────
export default function TimeGrid({ date, projectFilter = null, onRequestAddTask }) {
  const { tasks, projects, fixedBlocks } = useStore(s => ({
    tasks:       s.tasks,
    projects:    s.projects,
    fixedBlocks: s.fixedBlocks,
  }))
  const toggleTask = useStore(s => s.toggleTask)

  // Current time line
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const currentY = (currentMinutes / 1440) * TOTAL_HEIGHT
  const todayStr = now.toISOString().split('T')[0]

  // Drag state
  const gridRef  = useRef(null)
  const [drag, setDrag] = useState(null) // { startMin, endMin }
  const isDragging = useRef(false)

  const getContainerTop = () => {
    return gridRef.current?.getBoundingClientRect().top ?? 0
  }

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return
    e.preventDefault()
    const min = yToMinutes(e.clientY, getContainerTop())
    isDragging.current = true
    setDrag({ startMin: min, endMin: min + SNAP })
  }, [])

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current || !drag) return
    const min = yToMinutes(e.clientY, getContainerTop())
    setDrag(d => d ? { ...d, endMin: Math.max(d.startMin + SNAP, min) } : null)
  }, [drag])

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current || !drag) return
    isDragging.current = false
    const startMin = Math.min(drag.startMin, drag.endMin)
    const endMin   = Math.max(drag.startMin, drag.endMin)
    if (endMin - startMin < SNAP) {
      setDrag(null)
      return
    }
    setDrag(null)
    onRequestAddTask?.({
      defaultDate:  date,
      defaultStart: minutesToTime(startMin),
      defaultEnd:   minutesToTime(endMin),
    })
  }, [drag, date, onRequestAddTask])

  // Attach move/up to window so drag works outside the grid
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  // Scroll to 7am on mount — walk up to find the actual overflow container
  useEffect(() => {
    let el = gridRef.current?.parentElement
    while (el) {
      const { overflowY } = getComputedStyle(el)
      if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
        el.scrollTop = HOUR_HEIGHT * 7 - 40
        break
      }
      el = el.parentElement
    }
  }, [])

  // Filter tasks for this date
  const dateTasks = tasks.filter(t => {
    if (t.date !== date) return false
    if (!t.startTime || !t.endTime) return false
    if (projectFilter && t.projId !== projectFilter) return false
    return true
  })

  // Get day-of-week index (0=Mon) for fixedBlocks
  const dateObj  = new Date(date + 'T00:00:00')
  const jsDay    = dateObj.getDay() // 0=Sun..6=Sat
  const dayIndex = jsDay === 0 ? 6 : jsDay - 1 // convert to 0=Mon

  const fixedForDay = fixedBlocks.filter(b => b.days.includes(dayIndex))

  return (
    <div
      ref={gridRef}
      className="relative select-none timegrid-drag"
      style={{ height: TOTAL_HEIGHT, minHeight: TOTAL_HEIGHT }}
      onMouseDown={handleMouseDown}
    >
      {/* Hour lines & labels */}
      {Array.from({ length: 24 }, (_, h) => (
        <div
          key={h}
          className="absolute left-0 right-0 flex items-start"
          style={{ top: h * HOUR_HEIGHT, height: HOUR_HEIGHT }}
        >
          <span
            className="text-right pr-2 flex-shrink-0"
            style={{ width: 40, fontSize: 10, color: '#444', lineHeight: 1, paddingTop: 2 }}
          >
            {String(h).padStart(2,'0')}:00
          </span>
          <div className="flex-1" style={{ borderTop: '1px solid #1e1e1e' }} />
        </div>
      ))}

      {/* Half-hour sub-lines */}
      {Array.from({ length: 24 }, (_, h) => (
        <div
          key={`half${h}`}
          className="absolute right-0"
          style={{
            left: 40,
            top: h * HOUR_HEIGHT + HOUR_HEIGHT / 2,
            borderTop: '1px solid #161616',
          }}
        />
      ))}

      {/* Fixed blocks */}
      {fixedForDay.map(fb => {
        const startMin = timeToMinutes(fb.startTime)
        const endMin   = timeToMinutes(fb.endTime)
        const top      = (startMin / 1440) * TOTAL_HEIGHT
        const height   = ((endMin - startMin) / 1440) * TOTAL_HEIGHT
        return (
          <div
            key={fb.id}
            className="absolute rounded pointer-events-none"
            style={{
              left: 44,
              right: 4,
              top,
              height: Math.max(height, 20),
              background: fb.color,
              opacity: 0.35,
              zIndex: 1,
            }}
          >
            <span className="absolute top-1 left-2 text-xs font-medium" style={{ color: '#ccc', fontSize: 10 }}>
              {fb.name}
            </span>
          </div>
        )
      })}

      {/* Task blocks */}
      {dateTasks.map(task => {
        const proj     = projects.find(p => p.id === task.projId)
        const color    = proj?.color ?? '#60a5fa'
        const startMin = timeToMinutes(task.startTime)
        const endMin   = timeToMinutes(task.endTime)
        const top      = (startMin / 1440) * TOTAL_HEIGHT
        const height   = Math.max(((endMin - startMin) / 1440) * TOTAL_HEIGHT, 20)

        return (
          <div
            key={task.id}
            className="absolute rounded cursor-pointer overflow-hidden"
            style={{
              left:       44,
              right:      4,
              top,
              height,
              background: color + '22',
              borderLeft: `3px solid ${color}`,
              zIndex:     2,
              opacity:    task.done ? 0.45 : 1,
            }}
            onClick={(e) => { e.stopPropagation(); toggleTask(task.id) }}
          >
            <div className="px-2 pt-1">
              <p className="text-xs font-medium leading-tight truncate" style={{ color: task.done ? '#666' : color }}>
                {task.text}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#555', fontSize: 10 }}>
                {task.startTime} – {task.endTime}
              </p>
            </div>
          </div>
        )
      })}

      {/* Drag preview */}
      {drag && (() => {
        const startMin = Math.min(drag.startMin, drag.endMin)
        const endMin   = Math.max(drag.startMin, drag.endMin)
        const top    = (startMin / 1440) * TOTAL_HEIGHT
        const height = ((endMin - startMin) / 1440) * TOTAL_HEIGHT
        return (
          <div
            className="absolute rounded pointer-events-none"
            style={{
              left: 44, right: 4,
              top, height: Math.max(height, 10),
              background: 'rgba(96,165,250,0.2)',
              border: '1px dashed #60a5fa',
              zIndex: 10,
            }}
          >
            <span className="absolute top-1 left-2 text-xs" style={{ color: '#60a5fa', fontSize: 10 }}>
              {minutesToTime(startMin)} – {minutesToTime(endMin)}
            </span>
          </div>
        )
      })()}

      {/* Current time line */}
      {date === todayStr && (
        <div
          className="absolute pointer-events-none"
          style={{ left: 40, right: 0, top: currentY, zIndex: 20 }}
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
