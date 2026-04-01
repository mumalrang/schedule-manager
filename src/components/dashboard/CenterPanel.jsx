import React from 'react'
import TimeGrid from './TimeGrid'
import useStore from '../../store/useStore'

const DAY_LABELS = ['월','화','수','목','금','토','일']

function getWeekDates(dateStr) {
  const date   = new Date(dateStr + 'T00:00:00')
  const jsDay  = date.getDay() // 0=Sun
  const monday = new Date(date)
  monday.setDate(date.getDate() - (jsDay === 0 ? 6 : jsDay - 1))

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}

export default function CenterPanel({ onRequestAddTask }) {
  const { selectedDate, setSelectedDate } = useStore(s => ({
    selectedDate:    s.selectedDate,
    setSelectedDate: s.setSelectedDate,
  }))

  const weekDates = getWeekDates(selectedDate)
  const todayStr  = new Date().toISOString().split('T')[0]

  return (
    <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
      {/* Day tabs */}
      <div
        className="flex gap-1 px-3 pt-3 pb-2 flex-shrink-0"
        style={{ borderBottom: '1px solid #1e1e1e' }}
      >
        {weekDates.map((d, i) => {
          const isActive  = d === selectedDate
          const isToday   = d === todayStr
          const dayNum    = new Date(d + 'T00:00:00').getDate()

          return (
            <button
              key={d}
              onClick={() => setSelectedDate(d)}
              className="flex flex-col items-center px-3 py-1.5 rounded transition-all flex-1"
              style={{
                background: isActive ? '#1e1e1e' : 'transparent',
                border:     isActive ? '1px solid #2e2e2e' : '1px solid transparent',
              }}
            >
              <span className="text-xs" style={{ color: isToday ? '#60a5fa' : '#555', fontSize: 10 }}>
                {DAY_LABELS[i]}
              </span>
              <span
                className="text-sm font-medium"
                style={{ color: isActive ? '#efefef' : isToday ? '#60a5fa' : '#666' }}
              >
                {dayNum}
              </span>
            </button>
          )
        })}
      </div>

      {/* TimeGrid — scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="py-2 pr-2">
          <TimeGrid
            date={selectedDate}
            onRequestAddTask={onRequestAddTask}
          />
        </div>
      </div>
    </div>
  )
}
