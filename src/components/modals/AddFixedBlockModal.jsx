import React, { useState } from 'react'
import useStore from '../../store/useStore'

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

const COLOR_OPTIONS = [
  '#444444','#3b5e8c','#2d6b4f','#7a4a1e','#5a3472',
  '#555555','#1d4e6b','#3d5c2e','#6b2d2d','#3d3d6b',
]

// 30분 단위 시간 리스트
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, '0')
  const m = i % 2 === 0 ? '00' : '30'
  return `${h}:${m}`
})

export default function AddFixedBlockModal({ onClose }) {
  const addFixedBlock = useStore(s => s.addFixedBlock)

  const [name,      setName]      = useState('')
  const [days,      setDays]      = useState([0, 1, 2, 3, 4]) // Mon-Fri default
  const [startTime, setStartTime] = useState('09:00')
  const [endTime,   setEndTime]   = useState('10:00')
  const [color,     setColor]     = useState('#444444')

  const toggleDay = (day) => {
    setDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim() || days.length === 0) return
    addFixedBlock({ name: name.trim(), days, startTime, endTime, color })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="rounded-lg p-5 w-96 shadow-2xl"
        style={{ background: '#1a1a1a', border: '1px solid #2e2e2e' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: '#efefef' }}>고정 시간 블록 추가</h3>
          <button onClick={onClose} className="text-lg leading-none" style={{ color: '#555' }}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Name */}
          <div>
            <label className="block text-xs mb-1" style={{ color: '#aaa' }}>이름</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="예: 점심 시간, 회의 등"
              className="w-full px-3 py-2 rounded text-sm"
              style={{ background: '#131313', border: '1px solid #2e2e2e', color: '#efefef' }}
            />
          </div>

          {/* Days */}
          <div>
            <label className="block text-xs mb-2" style={{ color: '#aaa' }}>반복 요일</label>
            <div className="flex gap-1.5">
              {DAY_LABELS.map((label, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className="w-8 h-8 rounded text-xs font-medium flex-shrink-0 transition-all"
                  style={{
                    background: days.includes(i) ? '#60a5fa' : '#222',
                    color:      days.includes(i) ? '#000'    : '#666',
                    border:     `1px solid ${days.includes(i) ? '#60a5fa' : '#333'}`,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Time range */}
          <div>
            <label className="block text-xs mb-2" style={{ color: '#aaa' }}>시간 범위 (30분 단위)</label>
            <div className="flex items-center gap-2">
              <select
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="flex-1 px-2 py-2 rounded text-sm"
                style={{ background: '#131313', border: '1px solid #2e2e2e', color: '#efefef' }}
              >
                {TIME_OPTIONS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <span style={{ color: '#555' }}>—</span>
              <select
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="flex-1 px-2 py-2 rounded text-sm"
                style={{ background: '#131313', border: '1px solid #2e2e2e', color: '#efefef' }}
              >
                {TIME_OPTIONS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs mb-2" style={{ color: '#aaa' }}>색상</label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded border-2 transition-all"
                  style={{ background: c, borderColor: color === c ? '#fff' : 'transparent' }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-3 py-2 rounded text-sm"
              style={{ background: '#222', color: '#aaa', border: '1px solid #2e2e2e' }}>
              취소
            </button>
            <button type="submit"
              className="flex-1 px-3 py-2 rounded text-sm font-medium"
              style={{ background: '#60a5fa', color: '#000' }}>
              추가
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
