import React, { useRef, useState, useEffect } from 'react'
import TimeGrid from '../dashboard/TimeGrid'
import AddTaskModal from '../modals/AddTaskModal'
import useStore from '../../store/useStore'

const DAY_LABELS = ['월','화','수','목','금','토','일']

// ── Timeline ───────────────────────────────────────────────
function HorizontalTimeline({ tasks, project }) {
  const toggleTask = useStore(s => s.toggleTask)
  const containerRef = useRef(null)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-20 text-sm" style={{ color: '#333' }}>
        할 일이 없습니다.
      </div>
    )
  }

  const dates = tasks.map(t => new Date(t.date + 'T00:00:00'))
  const minDate = new Date(Math.min(...dates))
  const maxDate = new Date(Math.max(...dates))

  // Add padding
  minDate.setDate(minDate.getDate() - 2)
  maxDate.setDate(maxDate.getDate() + 2)

  const totalDays = Math.ceil((maxDate - minDate) / 86400000) + 1
  const DAY_WIDTH = 80

  const dateToX = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00')
    return Math.ceil((d - minDate) / 86400000) * DAY_WIDTH
  }

  const todayX = Math.ceil((today - minDate) / 86400000) * DAY_WIDTH

  // Group overlapping tasks on same date
  const lanes = []
  const sorted = [...tasks].sort((a, b) => a.date.localeCompare(b.date))

  sorted.forEach(task => {
    let placed = false
    for (const lane of lanes) {
      const last = lane[lane.length - 1]
      if (last.date !== task.date) { lane.push(task); placed = true; break }
    }
    if (!placed) lanes.push([task])
  })

  const LANE_HEIGHT = 28
  const PADDING_TOP = 32
  const totalHeight = PADDING_TOP + lanes.length * LANE_HEIGHT + 8

  // Date labels
  const dateLabelInterval = Math.max(1, Math.floor(totalDays / 10))
  const dateLabels = []
  for (let i = 0; i <= totalDays; i += dateLabelInterval) {
    const d = new Date(minDate)
    d.setDate(minDate.getDate() + i)
    const label = `${d.getMonth() + 1}/${d.getDate()}`
    dateLabels.push({ x: i * DAY_WIDTH, label })
  }

  return (
    <div ref={containerRef} className="overflow-x-auto" style={{ width: '100%' }}>
      <div className="relative" style={{ width: totalDays * DAY_WIDTH, height: totalHeight, minWidth: '100%' }}>
        {/* Date labels */}
        {dateLabels.map(({ x, label }) => (
          <span
            key={x}
            className="absolute top-0 text-xs"
            style={{ left: x + 2, color: '#444', fontSize: 10 }}
          >
            {label}
          </span>
        ))}

        {/* Grid lines */}
        {Array.from({ length: totalDays + 1 }, (_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0"
            style={{ left: i * DAY_WIDTH, borderLeft: '1px solid #1a1a1a' }}
          />
        ))}

        {/* Today line */}
        {todayX >= 0 && todayX <= totalDays * DAY_WIDTH && (
          <div
            className="absolute top-0 bottom-0"
            style={{ left: todayX, borderLeft: '2px solid #ef4444', zIndex: 10 }}
          />
        )}

        {/* Task bars */}
        {lanes.map((lane, li) =>
          lane.map(task => {
            const x = dateToX(task.date)
            const y = PADDING_TOP + li * LANE_HEIGHT

            return (
              <button
                key={task.id}
                onClick={() => toggleTask(task.id)}
                title={task.text}
                className="absolute rounded px-2 text-xs font-medium truncate transition-all"
                style={{
                  left:       x + 3,
                  width:      DAY_WIDTH - 6,
                  top:        y,
                  height:     LANE_HEIGHT - 4,
                  background: task.done ? '#1a1a1a' : project.color + '33',
                  border:     `1px solid ${task.done ? '#222' : project.color + '66'}`,
                  color:      task.done ? '#444' : project.color,
                  textDecoration: task.done ? 'line-through' : 'none',
                  zIndex:     5,
                }}
              >
                {task.text}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

// ── Task list ──────────────────────────────────────────────
function TaskList({ tasks, project, onAddTask }) {
  const { toggleTask, deleteTask } = useStore(s => ({
    toggleTask: s.toggleTask,
    deleteTask: s.deleteTask,
  }))

  const sorted = [...tasks].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ width: 260, borderRight: '1px solid #1e1e1e', flexShrink: 0 }}
    >
      <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid #1e1e1e' }}>
        <p className="text-sm font-medium" style={{ color: '#efefef' }}>전체 할 일</p>
        <p className="text-xs mt-0.5" style={{ color: '#555' }}>
          {tasks.filter(t => t.done).length} / {tasks.length} 완료
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        {sorted.length === 0 ? (
          <p className="text-xs text-center py-6" style={{ color: '#333' }}>할 일이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {sorted.map(task => (
              <div
                key={task.id}
                className="flex items-start gap-2 px-2 py-2 rounded group"
                onMouseEnter={e => e.currentTarget.style.background = '#131313'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  className="w-4 h-4 rounded flex-shrink-0 mt-0.5 flex items-center justify-center"
                  style={{
                    border:     `1.5px solid ${task.done ? project.color : '#333'}`,
                    background: task.done ? project.color : 'transparent',
                  }}
                >
                  {task.done && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-xs" style={{
                    color: task.done ? '#444' : '#ccc',
                    textDecoration: task.done ? 'line-through' : 'none',
                  }}>
                    {task.text}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#444', fontSize: 10 }}>
                    {task.date}
                    {task.startTime && ` · ${task.startTime}`}
                    {task.endTime && `–${task.endTime}`}
                  </p>
                </div>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-xs flex-shrink-0"
                  style={{ color: '#555' }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid #1e1e1e' }}>
        <button
          onClick={onAddTask}
          className="w-full py-2 rounded text-xs"
          style={{ background: '#1a1a1a', color: '#60a5fa', border: '1px solid #222' }}
        >
          + 할 일 추가
        </button>
      </div>
    </div>
  )
}

// ── Week tab grid ──────────────────────────────────────────
function getWeekDates(dateStr) {
  const date   = new Date(dateStr + 'T00:00:00')
  const jsDay  = date.getDay()
  const monday = new Date(date)
  monday.setDate(date.getDate() - (jsDay === 0 ? 6 : jsDay - 1))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}

// ── Main ───────────────────────────────────────────────────
export default function ProjectDetail() {
  const { projects, tasks, selectedProjectId, selectedDate, setSelectedDate } = useStore(s => ({
    projects:          s.projects,
    tasks:             s.tasks,
    selectedProjectId: s.selectedProjectId,
    selectedDate:      s.selectedDate,
    setSelectedDate:   s.setSelectedDate,
  }))

  const project = projects.find(p => p.id === selectedProjectId)
  const [taskModal, setTaskModal] = useState(null)

  useEffect(() => {
    // Scroll timeline to today
  }, [project])

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: '#444' }}>
        프로젝트를 선택하세요.
      </div>
    )
  }

  const projTasks   = tasks.filter(t => t.projId === project.id)
  const todayStr    = new Date().toISOString().split('T')[0]
  const weekDates   = getWeekDates(selectedDate)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Project header */}
      <div
        className="flex items-center gap-3 px-6 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid #1e1e1e' }}
      >
        <span className="w-3 h-3 rounded-full" style={{ background: project.color }} />
        <div className="flex-1">
          <h2 className="text-sm font-semibold" style={{ color: '#efefef' }}>{project.name}</h2>
          {project.desc && (
            <p className="text-xs mt-0.5" style={{ color: '#555' }}>{project.desc}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: '#555' }}>
            {projTasks.filter(t => t.done).length} / {projTasks.length}
          </span>
          <button
            onClick={() => setTaskModal({ defaultDate: selectedDate, defaultProjId: project.id })}
            className="px-3 py-1.5 rounded text-xs font-medium"
            style={{ background: '#60a5fa', color: '#000' }}
          >
            + 할 일
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div
        className="px-6 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid #1e1e1e', background: '#0c0c0c' }}
      >
        <p className="text-xs font-medium mb-3" style={{ color: '#555' }}>타임라인</p>
        <HorizontalTimeline tasks={projTasks} project={project} />
      </div>

      {/* Bottom: task list + timegrid */}
      <div className="flex flex-1 overflow-hidden">
        {/* Task list */}
        <TaskList
          tasks={projTasks}
          project={project}
          onAddTask={() => setTaskModal({ defaultDate: selectedDate, defaultProjId: project.id })}
        />

        {/* Right: timegrid with week tabs */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* Week tabs */}
          <div
            className="flex gap-1 px-3 pt-3 pb-2 flex-shrink-0"
            style={{ borderBottom: '1px solid #1e1e1e' }}
          >
            {weekDates.map((d, i) => {
              const isActive = d === selectedDate
              const isToday  = d === todayStr
              const dayNum   = new Date(d + 'T00:00:00').getDate()
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDate(d)}
                  className="flex flex-col items-center px-3 py-1.5 rounded transition-all flex-1"
                  style={{
                    background: isActive ? '#1e1e1e' : 'transparent',
                    border:     isActive ? '1px solid #2e2e2e' : '1px solid transparent',
                  }}
                >
                  <span className="text-xs" style={{ color: isToday ? '#60a5fa' : '#555', fontSize: 10 }}>
                    {DAY_LABELS[i]}
                  </span>
                  <span className="text-sm font-medium"
                    style={{ color: isActive ? '#efefef' : isToday ? '#60a5fa' : '#666' }}>
                    {dayNum}
                  </span>
                </button>
              )
            })}
          </div>

          {/* TimeGrid */}
          <div className="flex-1 overflow-y-auto">
            <div className="py-2 pr-2">
              <TimeGrid
                date={selectedDate}
                projectFilter={project.id}
                onRequestAddTask={(defaults) =>
                  setTaskModal({ ...defaults, defaultProjId: project.id })
                }
              />
            </div>
          </div>
        </div>
      </div>

      {taskModal && (
        <AddTaskModal
          {...taskModal}
          onClose={() => setTaskModal(null)}
        />
      )}
    </div>
  )
}
