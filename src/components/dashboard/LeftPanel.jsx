import React, { useState, useRef, useEffect } from 'react'
import MiniCalendar from './MiniCalendar'
import useStore from '../../store/useStore'
import EditTaskModal from '../modals/EditTaskModal'

function TaskItem({ task, projects, toggleTask, isSelected, onItemClick, onDragStart }) {
  const proj  = projects.find(p => p.id === task.projId)
  const color = proj?.color ?? '#444'
  return (
    <div
      data-taskid={task.id}
      draggable
      className="flex items-center gap-2 px-2 py-1.5 rounded cursor-grab active:cursor-grabbing group"
      style={{
        background:  isSelected ? '#1a2535' : 'transparent',
        border:      `1px solid ${isSelected ? '#60a5fa55' : 'transparent'}`,
        borderRadius: 6,
      }}
      onClick={onItemClick}
      onDragStart={onDragStart}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#1a1a1a' }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
    >
      <span
        className="flex-shrink-0 rounded-full"
        style={{ width: 3, height: 28, background: task.done ? '#2a2a2a' : color }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs leading-snug truncate" style={{
          color:          task.done ? '#3a3a3a' : isSelected ? '#aad4ff' : '#ccc',
          textDecoration: task.done ? 'line-through' : 'none',
        }}>
          {task.text}
        </p>
        {task.startTime && (
          <p className="text-xs mt-0.5" style={{ color: '#3a3a3a', fontSize: 10 }}>
            {task.startTime}{task.endTime ? ` – ${task.endTime}` : ''}
          </p>
        )}
      </div>
      <button
        onClick={e => { e.stopPropagation(); toggleTask(task.id) }}
        className="flex-shrink-0 w-4 h-4 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          border:     `1.5px solid ${task.done ? '#444' : '#333'}`,
          background: task.done ? '#333' : 'transparent',
        }}
      >
        {task.done && (
          <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
            <path d="M2 5l2.5 2.5L8 3" stroke="#888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>
    </div>
  )
}

export default function LeftPanel({ width = 260 }) {
  const tasks        = useStore(s => s.tasks)
  const projects     = useStore(s => s.projects)
  const selectedDate = useStore(s => s.selectedDate)
  const toggleTask   = useStore(s => s.toggleTask)

  const [editTask,    setEditTask]    = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [lassoBox,    setLassoBox]    = useState(null)

  const listRef  = useRef(null)
  const lassoRef = useRef(null)

  const scheduledTasks = tasks
    .filter(t => {
      const inRange = t.endDate
        ? (t.date <= selectedDate && selectedDate <= t.endDate)
        : t.date === selectedDate
      return inRange && t.startTime
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  const dateonlyTasks = tasks
    .filter(t => {
      const inRange = t.endDate
        ? (t.date <= selectedDate && selectedDate <= t.endDate)
        : t.date === selectedDate
      return inRange && !t.startTime
    })

  const allDayTasks = [...scheduledTasks, ...dateonlyTasks]

  // 날짜 바뀌면 선택 초기화
  useEffect(() => { setSelectedIds(new Set()) }, [selectedDate])

  // 라소 선택
  useEffect(() => {
    const onMove = (e) => {
      if (!lassoRef.current || !listRef.current) return
      lassoRef.current.x2 = e.clientX
      lassoRef.current.y2 = e.clientY
      setLassoBox({ ...lassoRef.current })

      const { x1, y1, x2, y2 } = lassoRef.current
      if (Math.abs(x2 - x1) < 4 && Math.abs(y2 - y1) < 4) return

      const selL = Math.min(x1, x2), selR = Math.max(x1, x2)
      const selT = Math.min(y1, y2), selB = Math.max(y1, y2)

      const taskEls = listRef.current.querySelectorAll('[data-taskid]')
      const newIds = new Set()
      taskEls.forEach(el => {
        const r = el.getBoundingClientRect()
        if (r.left < selR && r.right > selL && r.top < selB && r.bottom > selT)
          newIds.add(el.getAttribute('data-taskid'))
      })
      setSelectedIds(newIds)
    }
    const onUp = () => {
      if (!lassoRef.current) return
      const { x1, y1, x2, y2 } = lassoRef.current
      if (Math.abs(x2 - x1) < 4 && Math.abs(y2 - y1) < 4) setSelectedIds(new Set())
      lassoRef.current = null
      setLassoBox(null)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
    }
  }, [])

  const handleContainerMouseDown = (e) => {
    if (e.button !== 0) return
    if (e.target.closest('[data-taskid]')) return
    if (e.target.closest('button')) return
    e.preventDefault()
    lassoRef.current = { x1: e.clientX, y1: e.clientY, x2: e.clientX, y2: e.clientY }
    if (!e.ctrlKey && !e.metaKey) setSelectedIds(new Set())
  }

  const handleItemClick = (e, task) => {
    if (e.ctrlKey || e.metaKey) {
      setSelectedIds(prev => {
        const next = new Set(prev)
        next.has(task.id) ? next.delete(task.id) : next.add(task.id)
        return next
      })
      return
    }
    setSelectedIds(new Set())
    setEditTask(task)
  }

  const handleDragStart = (e, task) => {
    const ids = (selectedIds.has(task.id) && selectedIds.size > 1)
      ? [...selectedIds]
      : [task.id]
    e.dataTransfer.effectAllowed = 'move'
    if (ids.length > 1) e.dataTransfer.setData('scheduletaskids', JSON.stringify(ids))
    e.dataTransfer.setData('scheduletaskid', ids[0])
  }

  const selDateObj   = new Date(selectedDate + 'T00:00:00')
  const selDateLabel = `${selDateObj.getMonth() + 1}월 ${selDateObj.getDate()}일`
  const sel = selectedIds.size

  return (
    <div
      className="flex flex-col gap-4 h-full overflow-y-auto py-4 px-3"
      style={{ width, flexShrink: 0, overflowX: 'hidden' }}
    >
      {/* Mini Calendar */}
      <section className="rounded-lg p-3" style={{ background: '#131313', border: '1px solid #1e1e1e' }}>
        <MiniCalendar />
      </section>

      {/* 하루 일정 리스트 */}
      <section
        ref={listRef}
        className="rounded-lg p-3 flex flex-col gap-3"
        style={{ background: '#131313', border: '1px solid #1e1e1e', userSelect: 'none' }}
        onMouseDown={handleContainerMouseDown}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium" style={{ color: '#aaa' }}>{selDateLabel} 일정</p>
          <div className="flex items-center gap-2">
            {sel > 0 && (
              <>
                <span className="text-xs px-1.5 py-0.5 rounded"
                  style={{ background: '#60a5fa22', color: '#60a5fa', border: '1px solid #60a5fa33' }}>
                  {sel}개 선택
                </span>
                <button onClick={() => setSelectedIds(new Set())} className="text-xs" style={{ color: '#444' }}>✕</button>
              </>
            )}
            {allDayTasks.length > 0 && sel === 0 && (
              <span className="text-xs" style={{ color: '#444' }}>
                {allDayTasks.filter(t => t.done).length}/{allDayTasks.length}
              </span>
            )}
          </div>
        </div>

        {allDayTasks.length === 0 ? (
          <p className="text-xs" style={{ color: '#333' }}>일정이 없어요</p>
        ) : (
          <div className="flex flex-col gap-3">
            {/* 시간 지정 할일 */}
            {scheduledTasks.length > 0 && (
              <div className="flex flex-col gap-1">
                {scheduledTasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    projects={projects}
                    toggleTask={toggleTask}
                    isSelected={selectedIds.has(task.id)}
                    onItemClick={e => handleItemClick(e, task)}
                    onDragStart={e => handleDragStart(e, task)}
                  />
                ))}
              </div>
            )}

            {/* 시간 미지정 할일 */}
            {dateonlyTasks.length > 0 && (
              <div className="flex flex-col gap-1">
                {scheduledTasks.length > 0 && (
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1" style={{ borderTop: '1px solid #1e1e1e' }} />
                    <span style={{ color: '#333', fontSize: 9 }}>시간 미지정</span>
                    <div className="flex-1" style={{ borderTop: '1px solid #1e1e1e' }} />
                  </div>
                )}
                {dateonlyTasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    projects={projects}
                    toggleTask={toggleTask}
                    isSelected={selectedIds.has(task.id)}
                    onItemClick={e => handleItemClick(e, task)}
                    onDragStart={e => handleDragStart(e, task)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* 라소 박스 */}
      {lassoBox && Math.abs(lassoBox.x2 - lassoBox.x1) > 4 && (
        <div className="fixed pointer-events-none" style={{
          left:   Math.min(lassoBox.x1, lassoBox.x2),
          top:    Math.min(lassoBox.y1, lassoBox.y2),
          width:  Math.abs(lassoBox.x2 - lassoBox.x1),
          height: Math.abs(lassoBox.y2 - lassoBox.y1),
          border: '1px dashed #60a5fa88',
          background: '#60a5fa0d',
          zIndex: 9999,
        }} />
      )}

      {editTask && (
        <EditTaskModal task={editTask} onClose={() => setEditTask(null)} />
      )}
    </div>
  )
}
