import React, { useState, useEffect, useRef } from 'react'

const DAY_LABELS = ['월','화','수','목','금','토','일']

function toLocalStr(d) {
  const y  = d.getFullYear()
  const m  = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function addMonths(yearMonth, n) {
  const [y, m] = yearMonth.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function buildCells(yearMonth) {
  const [y, m] = yearMonth.split('-').map(Number)
  const firstDay  = new Date(y, m - 1, 1)
  const totalDays = new Date(y, m, 0).getDate()
  const offset    = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1

  const cells = []
  for (let i = offset - 1; i >= 0; i--)
    cells.push({ date: toLocalStr(new Date(y, m - 1, -i)), inMonth: false })
  for (let i = 1; i <= totalDays; i++)
    cells.push({ date: toLocalStr(new Date(y, m - 1, i)), inMonth: true })
  const rem = (7 - (cells.length % 7)) % 7
  for (let i = 1; i <= rem; i++)
    cells.push({ date: toLocalStr(new Date(y, m, i)), inMonth: false })
  return cells
}

export default function RangePicker({ onSelect, onClose }) {
  const today = toLocalStr(new Date())
  const [month, setMonth] = useState(today.slice(0, 7))
  const [dragStart, setDragStart] = useState(null)
  const [dragEnd,   setDragEnd]   = useState(null)

  const isDragging   = useRef(false)
  const dragStartRef = useRef(null)
  const dragEndRef   = useRef(null)

  const setStart = (d) => { setDragStart(d); dragStartRef.current = d }
  const setEnd   = (d) => { setDragEnd(d);   dragEndRef.current   = d }

  useEffect(() => {
    const onUp = () => {
      if (!isDragging.current) return
      isDragging.current = false
      const s = dragStartRef.current
      const e = dragEndRef.current
      if (s && e) onSelect(s <= e ? s : e, s <= e ? e : s)
    }
    window.addEventListener('mouseup', onUp)
    return () => window.removeEventListener('mouseup', onUp)
  }, [onSelect])

  const cells = buildCells(month)
  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  const rangeStart = dragStart && dragEnd ? (dragStart <= dragEnd ? dragStart : dragEnd) : null
  const rangeEnd   = dragStart && dragEnd ? (dragStart <= dragEnd ? dragEnd   : dragStart) : null

  const dayCount = rangeStart && rangeEnd
    ? (() => {
        const [sy, sm, sd] = rangeStart.split('-').map(Number)
        const [ey, em, ed] = rangeEnd.split('-').map(Number)
        return Math.round((new Date(ey, em - 1, ed) - new Date(sy, sm - 1, sd)) / 86400000) + 1
      })()
    : null

  const [y, m] = month.split('-').map(Number)

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onMouseDown={onClose} />

      {/* Picker */}
      <div
        className="absolute z-50 rounded-lg shadow-2xl p-4"
        style={{
          background: '#1a1a1a',
          border: '1px solid #2e2e2e',
          top: 'calc(100% + 4px)',
          left: 0,
          width: 260,
          userSelect: 'none',
        }}
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Month nav */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setMonth(addMonths(month, -1))}
            className="w-6 h-6 flex items-center justify-center rounded"
            style={{ color: '#555', fontSize: 16 }}
            onMouseEnter={e => e.currentTarget.style.background = '#222'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >‹</button>
          <span className="text-xs font-medium" style={{ color: '#aaa' }}>{y}년 {m}월</span>
          <button
            onClick={() => setMonth(addMonths(month, 1))}
            className="w-6 h-6 flex items-center justify-center rounded"
            style={{ color: '#555', fontSize: 16 }}
            onMouseEnter={e => e.currentTarget.style.background = '#222'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >›</button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_LABELS.map(d => (
            <div key={d} className="text-center" style={{ color: '#444', fontSize: 10, padding: '2px 0' }}>{d}</div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map(({ date, inMonth }) => {
              const isToday = date === today
              const inRange = rangeStart && rangeEnd && date >= rangeStart && date <= rangeEnd
              const isEdge  = date === rangeStart || date === rangeEnd

              return (
                <div
                  key={date}
                  className="flex items-center justify-center"
                  style={{
                    height: 28,
                    background: inRange && !isEdge ? '#60a5fa14' : 'transparent',
                    cursor: inMonth ? 'pointer' : 'default',
                    opacity: inMonth ? 1 : 0.2,
                  }}
                  onMouseDown={() => {
                    if (!inMonth) return
                    isDragging.current = true
                    setStart(date)
                    setEnd(date)
                  }}
                  onMouseEnter={() => {
                    if (isDragging.current && inMonth) setEnd(date)
                  }}
                >
                  <span
                    style={{
                      width: 22, height: 22,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: 4,
                      background: isEdge ? '#60a5fa' : 'transparent',
                      color: isEdge ? '#000' : isToday ? '#60a5fa' : '#ccc',
                      fontSize: 11,
                      fontWeight: isEdge ? 600 : 400,
                    }}
                  >
                    {new Date(date + 'T12:00:00').getDate()}
                  </span>
                </div>
              )
            })}
          </div>
        ))}

        {/* Status */}
        <div className="mt-3 pt-2 text-xs" style={{ borderTop: '1px solid #222', color: rangeStart ? '#60a5fa' : '#444' }}>
          {rangeStart && rangeEnd
            ? `${rangeStart} ~ ${rangeEnd} (${dayCount}일)`
            : '날짜를 드래그해서 기간 선택'}
        </div>
      </div>
    </>
  )
}
