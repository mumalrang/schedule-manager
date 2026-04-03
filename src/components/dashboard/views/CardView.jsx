import React, { useState } from 'react'
import useStore from '../../../store/useStore'

const DAY_LABELS = ['월','화','수','목','금','토','일']

function getDayLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const jsDay = d.getDay()
  return DAY_LABELS[jsDay === 0 ? 6 : jsDay - 1]
}

export default function CardView({ dates, selectedDate, onDayClick }) {
  const tasks      = useStore(s => s.tasks)
  const projects   = useStore(s => s.projects)
  const updateTask = useStore(s => s.updateTask)

  const todayStr = new Date().toISOString().split('T')[0]
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

  const count = dates.length
  // 날짜 수에 따라 열 수 결정
  const cols = count <= 3 ? count : count <= 7 ? Math.ceil(count / 2) : Math.ceil(count / 3)
  const rows = Math.ceil(count / cols)

  return (
    <div
      className="p-3 h-full"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gap: 8,
      }}
    >
      {dates.map(date => {
        const d          = new Date(date + 'T00:00:00')
        const isToday    = date === todayStr
        const isSelected = date === selectedDate
        const isDragOver = dragOverDate === date
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
              background:  isDragOver ? '#1e2a3a' : isSelected ? '#1a1a1a' : '#131313',
              border:      `1px solid ${isDragOver ? '#60a5fa88' : isToday ? '#60a5fa44' : isSelected ? '#2e2e2e' : '#1e1e1e'}`,
              overflow:    'hidden',
              transition:  'background 0.1s, border-color 0.1s',
            }}
            onClick={() => onDayClick(date)}
            onMouseEnter={e => { if (!isSelected && !isDragOver) e.currentTarget.style.borderColor = '#2e2e2e' }}
            onMouseLeave={e => { if (!isSelected && !isDragOver) e.currentTarget.style.borderColor = isToday ? '#60a5fa44' : '#1e1e1e' }}
            onDragOver={e => handleDragOver(e, date)}
            onDragLeave={e => handleDragLeave(e, date)}
            onDrop={e => handleDrop(e, date)}
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
              <p className="text-xs" style={{ color: isDragOver ? '#60a5fa44' : '#2a2a2a' }}>
                {isDragOver ? '여기에 놓기' : '일정 없음'}
              </p>
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
