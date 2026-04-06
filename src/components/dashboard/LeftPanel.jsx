import React, { useState } from 'react'
import MiniCalendar from './MiniCalendar'
import useStore from '../../store/useStore'
import EditTaskModal from '../modals/EditTaskModal'

function TaskItem({ task, projects, toggleTask, setEditTask }) {
  const proj  = projects.find(p => p.id === task.projId)
  const color = proj?.color ?? '#444'
  return (
    <div
      draggable
      className="flex items-center gap-2 px-2 py-1.5 rounded cursor-grab active:cursor-grabbing group"
      style={{ background: 'transparent' }}
      onClick={() => setEditTask(task)}
      onMouseEnter={e => e.currentTarget.style.background = '#1a1a1a'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      onDragStart={e => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('scheduletaskid', task.id)
      }}
    >
      {/* 프로젝트 색상 바 */}
      <span
        className="flex-shrink-0 rounded-full"
        style={{ width: 3, height: 28, background: task.done ? '#2a2a2a' : color }}
      />

      <div className="flex-1 min-w-0">
        <p
          className="text-xs leading-snug truncate"
          style={{
            color:          task.done ? '#3a3a3a' : '#ccc',
            textDecoration: task.done ? 'line-through' : 'none',
          }}
        >
          {task.text}
        </p>
        {task.startTime && (
          <p className="text-xs mt-0.5" style={{ color: '#3a3a3a', fontSize: 10 }}>
            {task.startTime}{task.endTime ? ` – ${task.endTime}` : ''}
          </p>
        )}
      </div>

      {/* 체크 버튼 */}
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

  const [editTask, setEditTask] = useState(null)

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

  const selDateObj   = new Date(selectedDate + 'T00:00:00')
  const selDateLabel = `${selDateObj.getMonth() + 1}월 ${selDateObj.getDate()}일`

  return (
    <div
      className="flex flex-col gap-4 h-full overflow-y-auto py-4 px-3"
      style={{ width, flexShrink: 0, overflowX: 'hidden' }}
    >
      {/* Mini Calendar */}
      <section
        className="rounded-lg p-3"
        style={{ background: '#131313', border: '1px solid #1e1e1e' }}
      >
        <MiniCalendar />
      </section>

      {/* 하루 일정 리스트 */}
      <section
        className="rounded-lg p-3 flex flex-col gap-3"
        style={{ background: '#131313', border: '1px solid #1e1e1e' }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium" style={{ color: '#aaa' }}>
            {selDateLabel} 일정
          </p>
          {allDayTasks.length > 0 && (
            <span className="text-xs" style={{ color: '#444' }}>
              {allDayTasks.filter(t => t.done).length}/{allDayTasks.length}
            </span>
          )}
        </div>

        {allDayTasks.length === 0 ? (
          <p className="text-xs" style={{ color: '#333' }}>일정이 없어요</p>
        ) : (
          <>
            {/* 시간 지정 할일 */}
            {scheduledTasks.length > 0 && (
              <div className="flex flex-col gap-1">
                {scheduledTasks.map(task => (
                  <TaskItem key={task.id} task={task} projects={projects} toggleTask={toggleTask} setEditTask={setEditTask} />
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
                  <TaskItem key={task.id} task={task} projects={projects} toggleTask={toggleTask} setEditTask={setEditTask} />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {editTask && (
        <EditTaskModal task={editTask} onClose={() => setEditTask(null)} />
      )}
    </div>
  )
}
