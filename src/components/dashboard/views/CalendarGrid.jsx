import React from 'react'
import useStore from '../../../store/useStore'

const DAY_LABELS = ['월','화','수','목','금','토','일']

function getMondayOfWeek(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const jsDay = d.getDay()
  const diff  = jsDay === 0 ? 6 : jsDay - 1
  d.setDate(d.getDate() - diff)
  return d.toISOString().split('T')[0]
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

export default function CalendarGrid({ dates, selectedDate, onDayClick }) {
  const tasks    = useStore(s => s.tasks)
  const projects = useStore(s => s.projects)

  const todayStr   = new Date().toISOString().split('T')[0]
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
    <div className="p-3">
      {/* Day header */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-xs py-1" style={{ color: '#444', fontSize: 10 }}>
            {d}
          </div>
        ))}
      </div>

      {/* Weeks */}
      <div className="flex flex-col gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map(date => {
              const d           = new Date(date + 'T00:00:00')
              const isToday     = date === todayStr
              const isSelected  = date === selectedDate
              const inRange     = date >= rangeStart && date <= rangeEnd
              const dayTasks    = taskMap[date] ?? []

              return (
                <div
                  key={date}
                  className="rounded p-1.5 cursor-pointer"
                  style={{
                    background:  isSelected ? '#1e1e1e' : 'transparent',
                    border:      `1px solid ${isToday ? '#60a5fa44' : isSelected ? '#2e2e2e' : '#1a1a1a'}`,
                    opacity:     inRange ? 1 : 0.25,
                    minHeight:   72,
                  }}
                  onClick={() => inRange && onDayClick(date)}
                  onMouseEnter={e => { if (inRange && !isSelected) e.currentTarget.style.background = '#131313' }}
                  onMouseLeave={e => { if (inRange && !isSelected) e.currentTarget.style.background = 'transparent' }}
                >
                  {/* Date number */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-xs font-medium"
                      style={{
                        color:      isToday ? '#60a5fa' : inRange ? '#aaa' : '#333',
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
                            background:  task.done ? '#1a1a1a' : color + '18',
                            borderLeft:  `2px solid ${task.done ? '#2a2a2a' : color}`,
                          }}
                        >
                          <span
                            className="truncate"
                            style={{
                              fontSize: 9,
                              color: task.done ? '#333' : '#aaa',
                              lineHeight: '14px',
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
