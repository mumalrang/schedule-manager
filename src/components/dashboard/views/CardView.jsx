import React from 'react'
import useStore from '../../../store/useStore'

const DAY_LABELS = ['월','화','수','목','금','토','일']

function getDayLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const jsDay = d.getDay()
  return DAY_LABELS[jsDay === 0 ? 6 : jsDay - 1]
}

export default function CardView({ dates, selectedDate, onDayClick }) {
  const tasks    = useStore(s => s.tasks)
  const projects = useStore(s => s.projects)

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <div
      className="p-3"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 8,
        alignContent: 'start',
      }}
    >
      {dates.map(date => {
        const d          = new Date(date + 'T00:00:00')
        const isToday    = date === todayStr
        const isSelected = date === selectedDate
        const dayLabel   = getDayLabel(date)

        const dayTasks = tasks
          .filter(t => {
            const inRange = t.endDate
              ? (t.date <= date && date <= t.endDate)
              : t.date === date
            return inRange && t.date
          })
          .sort((a, b) => {
            if (!a.startTime && !b.startTime) return 0
            if (!a.startTime) return 1
            if (!b.startTime) return -1
            return a.startTime.localeCompare(b.startTime)
          })

        return (
          <div
            key={date}
            className="rounded-lg p-3 cursor-pointer"
            style={{
              background:  isSelected ? '#1a1a1a' : '#131313',
              border:      `1px solid ${isToday ? '#60a5fa44' : isSelected ? '#2e2e2e' : '#1e1e1e'}`,
              minHeight:   120,
            }}
            onClick={() => onDayClick(date)}
            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = '#2e2e2e' }}
            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = isToday ? '#60a5fa44' : '#1e1e1e' }}
          >
            {/* Date header */}
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="text-xs" style={{ color: isToday ? '#60a5fa' : '#555' }}>{dayLabel}</span>
              <span
                className="text-sm font-semibold"
                style={{ color: isToday ? '#60a5fa' : '#ccc' }}
              >
                {d.getDate()}
              </span>
              {isToday && <span className="text-xs" style={{ color: '#60a5fa', fontSize: 10 }}>오늘</span>}
              <span className="ml-auto text-xs" style={{ color: '#333', fontSize: 10 }}>
                {dayTasks.length > 0 ? `${dayTasks.filter(t=>t.done).length}/${dayTasks.length}` : ''}
              </span>
            </div>

            {/* Task list */}
            {dayTasks.length === 0 ? (
              <p className="text-xs" style={{ color: '#2a2a2a' }}>일정 없음</p>
            ) : (
              <div className="flex flex-col gap-1">
                {dayTasks.slice(0, 5).map(task => {
                  const proj  = projects.find(p => p.id === task.projId)
                  const color = proj?.color ?? '#555'
                  return (
                    <div key={task.id} className="flex items-center gap-1.5">
                      <span className="flex-shrink-0 w-1 h-1 rounded-full" style={{ background: task.done ? '#333' : color }} />
                      <span
                        className="text-xs truncate flex-1"
                        style={{
                          color:          task.done ? '#3a3a3a' : '#aaa',
                          textDecoration: task.done ? 'line-through' : 'none',
                          fontSize:       11,
                        }}
                      >
                        {task.startTime && (
                          <span style={{ color: '#444', marginRight: 4 }}>{task.startTime}</span>
                        )}
                        {task.text}
                      </span>
                    </div>
                  )
                })}
                {dayTasks.length > 5 && (
                  <p className="text-xs" style={{ color: '#444', fontSize: 10 }}>
                    +{dayTasks.length - 5}개 더
                  </p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
