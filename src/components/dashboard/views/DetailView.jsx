import React from 'react'
import TimeGrid from '../TimeGrid'

const DAY_LABELS = ['월','화','수','목','금','토','일']

function getDayLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const jsDay = d.getDay()
  return DAY_LABELS[jsDay === 0 ? 6 : jsDay - 1]
}

export default function DetailView({ dates, selectedDate, onDayClick, onRequestAddTask }) {
  const todayStr = new Date().toISOString().split('T')[0]
  const multi    = dates.length > 1

  if (!multi) {
    // Single day
    return (
      <div className="py-2 pr-2">
        <TimeGrid
          date={dates[0]}
          onRequestAddTask={onRequestAddTask}
        />
      </div>
    )
  }

  // 2-3 days side by side (shared vertical scroll from parent)
  return (
    <div className="flex" style={{ minHeight: '100%' }}>
      {dates.map((date, idx) => {
        const d          = new Date(date + 'T00:00:00')
        const isSelected = date === selectedDate
        const isToday    = date === todayStr

        return (
          <div
            key={date}
            className="flex flex-col"
            style={{
              flex: 1,
              minWidth: 0,
              borderRight: idx < dates.length - 1 ? '1px solid #1e1e1e' : 'none',
            }}
          >
            {/* Sticky date header */}
            <div
              className="sticky top-0 z-10 flex items-center gap-1.5 px-3 py-2 cursor-pointer flex-shrink-0"
              style={{
                borderBottom: '1px solid #1e1e1e',
                background:   isSelected ? '#1a1a1a' : '#0a0a0a',
              }}
              onClick={() => onDayClick(date)}
            >
              <span className="text-xs" style={{ color: isToday ? '#60a5fa' : '#555', fontSize: 10 }}>
                {getDayLabel(date)}
              </span>
              <span
                className="text-sm font-medium"
                style={{ color: isToday ? '#60a5fa' : isSelected ? '#efefef' : '#777' }}
              >
                {d.getDate()}
              </span>
              {isToday && (
                <span className="w-1 h-1 rounded-full" style={{ background: '#60a5fa' }} />
              )}
            </div>
            {/* TimeGrid — time labels only on first column */}
            <div className="py-2 pr-2" style={{ paddingLeft: idx === 0 ? 0 : 4 }}>
              <TimeGrid
                date={date}
                showTimeLabels={idx === 0}
                onRequestAddTask={(opts) => onRequestAddTask({ ...opts, defaultDate: date })}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
