import React, { useState } from 'react'
import useStore from '../../store/useStore'

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']
const MONTH_NAMES = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

export default function MiniCalendar() {
  const { tasks, projects, selectedDate, setSelectedDate, setViewRange } = useStore(s => ({
    tasks:        s.tasks,
    projects:     s.projects,
    selectedDate: s.selectedDate,
    setSelectedDate: s.setSelectedDate,
    setViewRange: s.setViewRange,
  }))

  const selDate  = new Date(selectedDate + 'T00:00:00')
  const today    = new Date().toISOString().split('T')[0]

  const [viewYear,  setViewYear]  = useState(selDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(selDate.getMonth()) // 0-indexed

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  // Build grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay() // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  // Task dots per day: collect project colors for each date string
  const dotMap = {}
  tasks.forEach(t => {
    const d = new Date(t.date + 'T00:00:00')
    if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
      if (!dotMap[d.getDate()]) dotMap[d.getDate()] = new Set()
      const proj = projects.find(p => p.id === t.projId)
      if (proj) dotMap[d.getDate()].add(proj.color)
    }
  })

  // Cells: leading empty + day cells
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const handleDayClick = (day) => {
    if (!day) return
    const mm = String(viewMonth + 1).padStart(2, '0')
    const dd = String(day).padStart(2, '0')
    setSelectedDate(`${viewYear}-${mm}-${dd}`)
    setViewRange(1, `${viewYear}-${mm}-${dd}`)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="w-6 h-6 flex items-center justify-center rounded text-xs"
          style={{ color: '#666', background: '#1a1a1a' }}>‹</button>
        <span className="text-sm font-medium" style={{ color: '#efefef' }}>
          {viewYear}년 {MONTH_NAMES[viewMonth]}
        </span>
        <button onClick={nextMonth} className="w-6 h-6 flex items-center justify-center rounded text-xs"
          style={{ color: '#666', background: '#1a1a1a' }}>›</button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-xs py-1" style={{ color: '#555', fontSize: 10 }}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />
          const mm = String(viewMonth + 1).padStart(2, '0')
          const dd = String(day).padStart(2, '0')
          const dateStr = `${viewYear}-${mm}-${dd}`
          const isToday    = dateStr === today
          const isSelected = dateStr === selectedDate
          const dots       = dotMap[day] ? [...dotMap[day]].slice(0, 3) : []

          return (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              className="flex flex-col items-center py-1 rounded transition-all"
              style={{
                background: isSelected ? '#60a5fa' : isToday ? '#1e1e1e' : 'transparent',
              }}
            >
              <span
                className="text-xs leading-tight"
                style={{
                  color:      isSelected ? '#000' : isToday ? '#60a5fa' : '#aaa',
                  fontWeight: isToday || isSelected ? 600 : 400,
                  fontSize:   11,
                }}
              >
                {day}
              </span>
              {/* Task dots */}
              {dots.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {dots.map((c, di) => (
                    <span
                      key={di}
                      className="w-1 h-1 rounded-full"
                      style={{ background: isSelected ? 'rgba(0,0,0,0.5)' : c }}
                    />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
