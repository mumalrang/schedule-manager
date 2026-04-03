import React, { useState } from 'react'
import useStore from '../../../store/useStore'

const DAY_LABELS = ['월','화','수','목','금','토','일']

function toLocalStr(d) {
  const y  = d.getFullYear()
  const m  = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function getMondayOfWeek(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const jsDay = date.getDay()
  const diff  = jsDay === 0 ? 6 : jsDay - 1
  date.setDate(date.getDate() - diff)
  return toLocalStr(date)
}

function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + n)
  return toLocalStr(date)
}

export default function CalendarGrid({ dates, selectedDate, onDayClick }) {
  const tasks      = useStore(s => s.tasks)
  const projects   = useStore(s => s.projects)
  const updateTask = useStore(s => s.updateTask)

  const todayStr   = new Date().toISOString().split('T')[0]
  const [dragOverDate, setDragOverDate] = useState(null)

  const handleDragOver = (e, date) => {
    const t = e.dataTransfer.types
    if (!t.includes('dumptaskid') && !t.includes('scheduletaskid')) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverDate(date)
  }

  const handleDragLeave = (e, date) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverDate(d => d === date ? null : d)
    }
  }

  const handleDrop = (e, date) => {
    e.preventDefault()
    setDragOverDate(null)
    const taskId = e.dataTransfer.getData('dumpTaskId') || e.dataTransfer.getData('scheduletaskid')
    if (!taskId) return
    updateTask(taskId, { date, startTime: null, endTime: null })
  }
  const rangeStart = dates[0]
  const rangeEnd   = dates[dates.length - 1]

  // Expand to full weeks (Mon–Sun)
  const gridStart = getMondayOfWeek(rangeStart)
  let gridEnd = addDays(getMondayOfWeek(rangeEnd), 6)
  // Build all cells
  const cells = []
  let cur = gridStart
  while (cur <= gridEnd) {
    cells.push(cur)
    cur = addDays(cur, 1)
  }

  // Group by week
  const weeks = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }

  // Task map: date → tasks
  const taskMap = {}
  tasks.forEach(t => {
    if (!t.date) return
    const key = t.date
    if (!taskMap[key]) taskMap[key] = []
    taskMap[key].push(t)
  })

  return (
    <div className="p-3 h-full flex flex-col">
      {/* Day header */}
      <div className="grid grid-cols-7 mb-1 flex-shrink-0">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-xs py-1" style={{ color: '#444', fontSize: 10 }}>
            {d}
          </div>
        ))}
      </div>

      {/* Weeks */}
      <div className="flex flex-col flex-1 gap-1 overflow-hidden">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1 flex-1 min-h-0">
            {week.map(date => {
              const d           = new Date(date + 'T00:00:00')
              const isToday     = date === todayStr
              const isSelected  = date === selectedDate
              const inRange     = date >= rangeStart && date <= rangeEnd
              const dayTasks    = taskMap[date] ?? []

              const isDragOver = dragOverDate === date && inRange

              return (
                <div
                  key={date}
                  className="rounded p-1.5 cursor-pointer overflow-hidden"
                  style={{
                    background:  isDragOver ? '#1e2a3a' : isSelected ? '#1e1e1e' : 'transparent',
                    border:      `1px solid ${isDragOver ? '#60a5fa88' : isToday ? '#60a5fa44' : isSelected ? '#2e2e2e' : '#1a1a1a'}`,
                    transition:  'background 0.1s, border-color 0.1s',
                  }}
                  onClick={() => onDayClick(date)}
                  onMouseEnter={e => { if (!isSelected && !isDragOver) e.currentTarget.style.background = '#131313' }}
                  onMouseLeave={e => { if (!isSelected && !isDragOver) e.currentTarget.style.background = 'transparent' }}
                  onDragOver={e => handleDragOver(e, date)}
                  onDragLeave={e => handleDragLeave(e, date)}
                  onDrop={e => handleDrop(e, date)}
                >
                  {/* Date number */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-xs font-medium"
                      style={{
                        color:      isToday ? '#60a5fa' : '#aaa',
                        background: isToday ? '#60a5fa18' : 'transparent',
                        padding:    isToday ? '1px 4px' : 0,
                        borderRadius: 4,
                      }}
                    >
                      {d.getDate()}
                    </span>
                    {dayTasks.length > 0 && (
                      <span style={{ color: '#333', fontSize: 9 }}>
                        {dayTasks.filter(t=>t.done).length}/{dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Task chips */}
                  <div className="flex flex-col gap-0.5">
                    {dayTasks.slice(0, 3).map(task => {
                      const proj  = projects.find(p => p.id === task.projId)
                      const color = proj?.color ?? '#555'
                      return (
                        <div
                          key={task.id}
                          className="flex items-center gap-1 px-1 rounded"
                          style={{
                            background: color + '18',
                            borderLeft: `2px solid ${color}`,
                          }}
                        >
                          <span
                            className="truncate"
                            style={{
                              fontSize: 9,
                              color: task.done ? '#444' : '#aaa',
                              lineHeight: '14px',
                              textDecoration: task.done ? 'line-through' : 'none',
                            }}
                          >
                            {task.text}
                          </span>
                        </div>
                      )
                    })}
                    {dayTasks.length > 3 && (
                      <span style={{ fontSize: 9, color: '#444', paddingLeft: 4 }}>
                        +{dayTasks.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
