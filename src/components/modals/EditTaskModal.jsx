import React, { useState } from 'react'
import useStore from '../../store/useStore'

export default function EditTaskModal({ task, onClose, hideTime = false }) {
  const { projects, updateTask, deleteTask } = useStore(s => ({
    projects:   s.projects,
    updateTask: s.updateTask,
    deleteTask: s.deleteTask,
  }))

  const [text,      setText]      = useState(task.text)
  const [projId,    setProjId]    = useState(task.projId)
  const [isRange,   setIsRange]   = useState(!!task.endDate)
  const [date,      setDate]      = useState(task.date)
  const [endDate,   setEndDate]   = useState(task.endDate ?? task.date)
  const [startTime, setStartTime] = useState(task.startTime ?? '')
  const [endTime,   setEndTime]   = useState(task.endTime   ?? '')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!text.trim() || !projId || !date) return
    updateTask(task.id, {
      text:      text.trim(),
      projId,
      date,
      endDate:   isRange && endDate > date ? endDate : null,
      startTime: startTime || null,
      endTime:   endTime   || null,
    })
    onClose()
  }

  const handleDelete = () => {
    deleteTask(task.id)
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
          <h3 className="text-sm font-semibold" style={{ color: '#efefef' }}>할 일 수정</h3>
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
              {projId && (
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none"
                  style={{ background: projects.find(p => p.id === projId)?.color ?? '#666' }}
                />
              )}
            </div>
          </div>

          {/* 날짜 모드 토글 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs" style={{ color: '#aaa' }}>날짜</label>
              <div
                className="flex rounded overflow-hidden"
                style={{ border: '1px solid #2e2e2e' }}
              >
                {[{ id: false, label: '하루' }, { id: true, label: '기간' }].map(({ id, label }) => (
                  <button
                    key={String(id)}
                    type="button"
                    onClick={() => setIsRange(id)}
                    className="px-3 py-1 text-xs transition-all"
                    style={{
                      background: isRange === id ? '#2e2e2e' : 'transparent',
                      color:      isRange === id ? '#efefef' : '#555',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {isRange ? (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={date}
                  onChange={e => {
                    setDate(e.target.value)
                    if (endDate < e.target.value) setEndDate(e.target.value)
                  }}
                  required
                  className="flex-1 px-3 py-2 rounded text-sm"
                  style={{ background: '#131313', border: '1px solid #2e2e2e', color: '#efefef', colorScheme: 'dark' }}
                />
                <span style={{ color: '#444', flexShrink: 0 }}>—</span>
                <input
                  type="date"
                  value={endDate}
                  min={date}
                  onChange={e => setEndDate(e.target.value)}
                  required
                  className="flex-1 px-3 py-2 rounded text-sm"
                  style={{ background: '#131313', border: '1px solid #2e2e2e', color: '#efefef', colorScheme: 'dark' }}
                />
              </div>
            ) : (
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded text-sm"
                style={{ background: '#131313', border: '1px solid #2e2e2e', color: '#efefef', colorScheme: 'dark' }}
              />
            )}
          </div>

          {/* Time range — 타임라인에서 열면 숨김 */}
          {!hideTime && (
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
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={handleDelete}
              className="px-3 py-2 rounded text-sm"
              style={{ background: '#1a1a1a', color: '#ef4444', border: '1px solid #2e2e2e' }}
            >
              삭제
            </button>
            <div className="flex-1" />
            <button type="button" onClick={onClose}
              className="px-3 py-2 rounded text-sm"
              style={{ background: '#222', color: '#aaa', border: '1px solid #2e2e2e' }}>
              취소
            </button>
            <button type="submit"
              className="px-3 py-2 rounded text-sm font-medium"
              style={{ background: '#60a5fa', color: '#000' }}>
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
