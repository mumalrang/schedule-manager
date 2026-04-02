import React, { useMemo, useCallback } from 'react'
import useStore from '../../store/useStore'
import DetailView from './views/DetailView'
import CardView from './views/CardView'
import CalendarGrid from './views/CalendarGrid'

const PRESETS = [
  { label: '오늘', days: 1  },
  { label: '3일',  days: 3  },
  { label: '1주',  days: 7  },
  { label: '2주',  days: 14 },
  { label: '1달',  days: 30 },
]

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function getDateRange(start, end) {
  const dates = []
  let cur = new Date(start + 'T00:00:00')
  const endD = new Date(end + 'T00:00:00')
  while (cur <= endD) {
    dates.push(cur.toISOString().split('T')[0])
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

function formatRangeLabel(start, end, dayCount) {
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end   + 'T00:00:00')
  const fmt = (d) => `${d.getMonth()+1}월 ${d.getDate()}일`
  if (dayCount === 1) return `${s.getFullYear()}년 ${fmt(s)}`
  if (s.getFullYear() === e.getFullYear())
    return `${s.getFullYear()}년 ${fmt(s)} – ${fmt(e)}`
  return `${s.getFullYear()}.${s.getMonth()+1}.${s.getDate()} – ${e.getFullYear()}.${e.getMonth()+1}.${e.getDate()}`
}

export default function CenterPanel({ onRequestAddTask }) {
  const today = useMemo(() => new Date().toISOString().split('T')[0], [])

  // 개별 구독 — 객체 선택자 패턴 피함 (불필요한 재렌더 방지)
  const selectedDate       = useStore(s => s.selectedDate)
  const viewPreset         = useStore(s => s.viewPreset)
  const viewRangeStart     = useStore(s => s.viewRangeStart)
  const setViewRangeAndDate = useStore(s => s.setViewRangeAndDate)

  const rangeEnd = useMemo(
    () => addDays(viewRangeStart, viewPreset - 1),
    [viewRangeStart, viewPreset]
  )
  const dates = useMemo(() => getDateRange(viewRangeStart, rangeEnd), [viewRangeStart, rangeEnd])

  const goBack    = useCallback(() => setViewRangeAndDate(viewPreset, addDays(viewRangeStart, -viewPreset), addDays(viewRangeStart, -viewPreset)), [viewPreset, viewRangeStart, setViewRangeAndDate])
  const goForward = useCallback(() => setViewRangeAndDate(viewPreset, addDays(viewRangeStart,  viewPreset), addDays(viewRangeStart,  viewPreset)), [viewPreset, viewRangeStart, setViewRangeAndDate])

  const handlePreset = useCallback((days) => {
    // '오늘' 버튼은 항상 오늘로, 나머지는 현재 범위 시작 기준
    const start = days === 1 ? today : viewRangeStart
    setViewRangeAndDate(days, start, start)
  }, [today, viewRangeStart, setViewRangeAndDate])

  // 드릴다운 (날짜 클릭 — 1일 뷰로 전환)
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
                background: viewPreset === p.days ? '#2e2e2e' : 'transparent',
                color:      viewPreset === p.days ? '#efefef' : '#555',
                border:     viewPreset === p.days ? '1px solid #3e3e3e' : '1px solid transparent',
              }}
            >
              {p.label}
            </button>
          ))}
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
