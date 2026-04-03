import React, { useMemo, useCallback, useState } from 'react'
import useStore from '../../store/useStore'
import DetailView from './views/DetailView'
import CardView from './views/CardView'
import CalendarGrid from './views/CalendarGrid'
import RangePicker from './RangePicker'

const PRESETS = [
  { label: '오늘', days: 1  },
  { label: '3일',  days: 3  },
  { label: '1주',  days: 7  },
  { label: '1달',  days: 30 },
]

const STANDARD_DAYS = new Set([1, 3, 7, 30])

function toLocalStr(d) {
  const y  = d.getFullYear()
  const m  = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + n)
  return toLocalStr(date)
}

function getDateRange(start, end) {
  const [sy, sm, sd] = start.split('-').map(Number)
  const [ey, em, ed] = end.split('-').map(Number)
  const dates = []
  let cur = new Date(sy, sm - 1, sd)
  const endD = new Date(ey, em - 1, ed)
  while (cur <= endD) {
    dates.push(toLocalStr(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

function formatRangeLabel(start, end, dayCount) {
  const [sy, sm, sd] = start.split('-').map(Number)
  const [ey, em, ed] = end.split('-').map(Number)
  if (dayCount === 1) return `${sy}년 ${sm}월 ${sd}일`
  if (sy === ey) return `${sy}년 ${sm}월 ${sd}일 – ${em}월 ${ed}일`
  return `${sy}.${sm}.${sd} – ${ey}.${em}.${ed}`
}

export default function CenterPanel({ onRequestAddTask }) {
  const today = useMemo(() => toLocalStr(new Date()), [])

  const selectedDate        = useStore(s => s.selectedDate)
  const viewPreset          = useStore(s => s.viewPreset)
  const viewRangeStart      = useStore(s => s.viewRangeStart)
  const setViewRangeAndDate = useStore(s => s.setViewRangeAndDate)

  const [showRangePicker, setShowRangePicker] = useState(false)
  const isCustomRange = !STANDARD_DAYS.has(viewPreset)

  const rangeEnd = useMemo(() => addDays(viewRangeStart, viewPreset - 1), [viewRangeStart, viewPreset])
  const dates    = useMemo(() => getDateRange(viewRangeStart, rangeEnd), [viewRangeStart, rangeEnd])

  const goBack    = useCallback(() => {
    const s = addDays(viewRangeStart, -viewPreset)
    setViewRangeAndDate(viewPreset, s, s)
  }, [viewPreset, viewRangeStart, setViewRangeAndDate])

  const goForward = useCallback(() => {
    const s = addDays(viewRangeStart, viewPreset)
    setViewRangeAndDate(viewPreset, s, s)
  }, [viewPreset, viewRangeStart, setViewRangeAndDate])

  const handlePreset = useCallback((days) => {
    setShowRangePicker(false)
    const start = days === 1 ? today : viewRangeStart
    setViewRangeAndDate(days, start, start)
  }, [today, viewRangeStart, setViewRangeAndDate])

  const handleRangeSelect = useCallback((start, end) => {
    const [sy, sm, sd] = start.split('-').map(Number)
    const [ey, em, ed] = end.split('-').map(Number)
    const days = Math.round((new Date(ey, em - 1, ed) - new Date(sy, sm - 1, sd)) / 86400000) + 1
    setViewRangeAndDate(days, start, start)
    setShowRangePicker(false)
  }, [setViewRangeAndDate])

  const handleDayClick = useCallback((date) => {
    setViewRangeAndDate(1, date, date)
  }, [setViewRangeAndDate])

  return (
    <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-3 pt-3 pb-2" style={{ borderBottom: '1px solid #1e1e1e' }}>
        {/* Preset buttons */}
        <div className="flex items-center gap-1 mb-2">
          {PRESETS.map(p => (
            <button
              key={p.days}
              onClick={() => handlePreset(p.days)}
              className="px-2.5 py-1 rounded text-xs transition-all"
              style={{
                background: !isCustomRange && viewPreset === p.days ? '#2e2e2e' : 'transparent',
                color:      !isCustomRange && viewPreset === p.days ? '#efefef' : '#555',
                border:     !isCustomRange && viewPreset === p.days ? '1px solid #3e3e3e' : '1px solid transparent',
              }}
            >
              {p.label}
            </button>
          ))}

          {/* 기간 선택 */}
          <div className="relative">
            <button
              onClick={() => setShowRangePicker(v => !v)}
              className="px-2.5 py-1 rounded text-xs transition-all"
              style={{
                background: isCustomRange || showRangePicker ? '#2e2e2e' : 'transparent',
                color:      isCustomRange || showRangePicker ? '#efefef' : '#555',
                border:     isCustomRange || showRangePicker ? '1px solid #3e3e3e' : '1px solid transparent',
              }}
            >
              기간 선택
            </button>
            {showRangePicker && (
              <RangePicker
                onSelect={handleRangeSelect}
                onClose={() => setShowRangePicker(false)}
              />
            )}
          </div>
        </div>

        {/* Date range nav */}
        <div className="flex items-center gap-2">
          <button
            onClick={goBack}
            className="w-6 h-6 flex items-center justify-center rounded"
            style={{ color: '#555', fontSize: 16 }}
            onMouseEnter={e => e.currentTarget.style.background = '#1e1e1e'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >‹</button>
          <span className="flex-1 text-center text-xs" style={{ color: '#777' }}>
            {formatRangeLabel(viewRangeStart, rangeEnd, viewPreset)}
          </span>
          <button
            onClick={goForward}
            className="w-6 h-6 flex items-center justify-center rounded"
            style={{ color: '#555', fontSize: 16 }}
            onMouseEnter={e => e.currentTarget.style.background = '#1e1e1e'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >›</button>
        </div>
      </div>

      {/* Adaptive view */}
      <div className="flex-1 overflow-y-auto">
        {viewPreset <= 3 && (
          <DetailView
            dates={dates}
            selectedDate={selectedDate}
            onDayClick={handleDayClick}
            onRequestAddTask={onRequestAddTask}
          />
        )}
        {viewPreset > 3 && viewPreset <= 14 && (
          <CardView
            dates={dates}
            selectedDate={selectedDate}
            onDayClick={handleDayClick}
          />
        )}
        {viewPreset > 14 && (
          <CalendarGrid
            dates={dates}
            selectedDate={selectedDate}
            onDayClick={handleDayClick}
          />
        )}
      </div>
    </div>
  )
}
