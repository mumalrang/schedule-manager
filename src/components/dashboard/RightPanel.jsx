import React from 'react'
import useStore from '../../store/useStore'

export default function RightPanel({ width = 260, onRequestAddTask }) {
  const { tasks, projects, selectedDate, toggleTask } = useStore(s => ({
    tasks:        s.tasks,
    projects:     s.projects,
    selectedDate: s.selectedDate,
    toggleTask:   s.toggleTask,
  }))

  // Tasks for selected date, grouped by project (date range 지원)
  const dayTasks = tasks.filter(t =>
    t.endDate ? (t.date <= selectedDate && selectedDate <= t.endDate) : t.date === selectedDate
  )

  const grouped = projects
    .map(proj => ({
      proj,
      items: dayTasks.filter(t => t.projId === proj.id),
    }))
    .filter(g => g.items.length > 0)

  const unassigned = dayTasks.filter(t => !projects.find(p => p.id === t.projId))

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00')
    return `${d.getMonth() + 1}월 ${d.getDate()}일`
  }

  return (
    <div
      className="flex flex-col h-full flex-shrink-0"
      style={{ width, flexShrink: 0 }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between flex-shrink-0"
        style={{ borderBottom: '1px solid #1e1e1e' }}
      >
        <div>
          <p className="text-sm font-medium" style={{ color: '#efefef' }}>할 일</p>
          <p className="text-xs mt-0.5" style={{ color: '#555' }}>{formatDate(selectedDate)}</p>
        </div>
        <button
          onClick={() => onRequestAddTask?.({ defaultDate: selectedDate })}
          className="w-6 h-6 flex items-center justify-center rounded text-sm"
          style={{ background: '#1e1e1e', color: '#888', border: '1px solid #2e2e2e' }}
          title="할 일 추가"
        >
          +
        </button>
      </div>

      {/* Task groups */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-4">
        {grouped.length === 0 && unassigned.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <p className="text-sm" style={{ color: '#333' }}>할 일이 없습니다</p>
            <button
              onClick={() => onRequestAddTask?.({ defaultDate: selectedDate })}
              className="mt-3 text-xs px-3 py-1.5 rounded"
              style={{ background: '#1a1a1a', color: '#60a5fa', border: '1px solid #2e2e2e' }}
            >
              + 할 일 추가
            </button>
          </div>
        ) : (
          <>
            {grouped.map(({ proj, items }) => (
              <div key={proj.id}>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: proj.color }} />
                  <span className="text-xs font-medium" style={{ color: '#888' }}>{proj.name}</span>
                  <span className="text-xs ml-auto" style={{ color: '#444' }}>
                    {items.filter(t => t.done).length}/{items.length}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  {items.map(task => (
                    <TaskItem key={task.id} task={task} color={proj.color} toggleTask={toggleTask} />
                  ))}
                </div>
              </div>
            ))}

            {unassigned.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: '#555' }}>기타</p>
                <div className="flex flex-col gap-1">
                  {unassigned.map(task => (
                    <TaskItem key={task.id} task={task} color="#666" toggleTask={toggleTask} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function TaskItem({ task, color, toggleTask }) {
  return (
    <button
      onClick={() => toggleTask(task.id)}
      className="flex items-start gap-2 w-full text-left px-2 py-2 rounded group transition-all"
      style={{ background: 'transparent' }}
      onMouseEnter={e => e.currentTarget.style.background = '#131313'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Checkbox */}
      <span
        className="w-4 h-4 rounded flex-shrink-0 mt-0.5 flex items-center justify-center transition-all"
        style={{
          border:     `1.5px solid ${task.done ? color : '#333'}`,
          background: task.done ? color : 'transparent',
        }}
      >
        {task.done && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5l2.5 2.5L8 3" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </span>

      <div className="flex-1 min-w-0">
        <p
          className="text-xs leading-snug"
          style={{
            color:          task.done ? '#444' : '#ccc',
            textDecoration: task.done ? 'line-through' : 'none',
          }}
        >
          {task.text}
        </p>
        {task.startTime && (
          <p className="text-xs mt-0.5" style={{ color: '#444', fontSize: 10 }}>
            {task.startTime}{task.endTime ? ` – ${task.endTime}` : ''}
          </p>
        )}
      </div>
    </button>
  )
}
