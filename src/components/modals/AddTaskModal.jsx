import React, { useState } from 'react'
import useStore from '../../store/useStore'

export default function AddTaskModal({ onClose, defaultDate = '', defaultStart = '', defaultEnd = '', defaultProjId = '' }) {
  const { projects, addTask } = useStore(s => ({
    projects: s.projects,
    addTask:  s.addTask,
  }))

  const [text,      setText]      = useState('')
  const [projId,    setProjId]    = useState(defaultProjId || (projects[0]?.id ?? ''))
  const [date,      setDate]      = useState(defaultDate)
  const [startTime, setStartTime] = useState(defaultStart)
  const [endTime,   setEndTime]   = useState(defaultEnd)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!text.trim() || !projId || !date) return
    addTask({
      text:      text.trim(),
      projId,
      date,
      startTime: startTime || null,
      endTime:   endTime   || null,
    })
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
          <h3 className="text-sm font-semibold" style={{ color: '#efefef' }}>할 일 추가</h3>
          <button onClick={onClose} className="text-lg leading-none" style={{ color: '#555' }}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Text */}
          <div>
            <label className="block text-xs mb-1" style={{ color: '#aaa' }}>할 일</label>
            <input
              autoFocus
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="할 일을 입력하세요"
              className="w-full px-3 py-2 rounded text-sm"
              style={{ background: '#131313', border: '1px solid #2e2e2e', color: '#efefef' }}
            />
          </div>

          {/* Project */}
          <div>
            <label className="block text-xs mb-1" style={{ color: '#aaa' }}>프로젝트</label>
            <div className="relative">
              <select
                value={projId}
                onChange={e => setProjId(e.target.value)}
                className="w-full px-3 py-2 rounded text-sm appearance-none"
                style={{ background: '#131313', border: '1px solid #2e2e2e', color: '#efefef' }}
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {/* Color dot indicator */}
              {projId && (
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none"
                  style={{ background: projects.find(p => p.id === projId)?.color ?? '#666' }}
                />
              )}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs mb-1" style={{ color: '#aaa' }}>날짜</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 rounded text-sm"
              style={{ background: '#131313', border: '1px solid #2e2e2e', color: '#efefef', colorScheme: 'dark' }}
            />
          </div>

          {/* Time range */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs mb-1" style={{ color: '#aaa' }}>시작 시간 (선택)</label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded text-sm"
                style={{ background: '#131313', border: '1px solid #2e2e2e', color: '#efefef', colorScheme: 'dark' }}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs mb-1" style={{ color: '#aaa' }}>종료 시간 (선택)</label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded text-sm"
                style={{ background: '#131313', border: '1px solid #2e2e2e', color: '#efefef', colorScheme: 'dark' }}
              />
            </div>
          </div>

          {/* Note */}
          {(!startTime || !endTime) && (
            <p className="text-xs" style={{ color: '#555' }}>
              시간 없이 추가하면 오른쪽 할 일 목록에만 표시됩니다.
            </p>
          )}

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
