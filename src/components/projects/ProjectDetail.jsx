import React, { useRef, useState, useEffect } from 'react'
import AddTaskModal from '../modals/AddTaskModal'
import EditTaskModal from '../modals/EditTaskModal'
import useStore from '../../store/useStore'

const DAY_LABELS = ['월','화','수','목','금','토','일']
const todayStr = new Date().toISOString().split('T')[0]

// ── HorizontalTimeline (milestones) ────────────────────────
function HorizontalTimeline({ milestones, project, selectedId, onSelect }) {
  const containerRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const now = new Date(); now.setHours(0,0,0,0)

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(e => setContainerWidth(e[0].contentRect.width))
    ro.observe(containerRef.current)
    setContainerWidth(containerRef.current.offsetWidth)
    return () => ro.disconnect()
  }, [])

  if (milestones.length === 0) {
    return (
      <div className="flex items-center justify-center py-4 text-xs" style={{ color: '#333' }}>
        마일스톤이 없습니다. 왼쪽에서 추가하세요.
      </div>
    )
  }

  const allDates = milestones.flatMap(m => [
    new Date(m.startDate + 'T00:00:00'),
    new Date(m.endDate   + 'T00:00:00'),
  ])
  const minDate = new Date(Math.min(...allDates))
  const maxDate = new Date(Math.max(...allDates))
  minDate.setDate(minDate.getDate() - 2)
  maxDate.setDate(maxDate.getDate() + 2)

  const totalDays = Math.ceil((maxDate - minDate) / 86400000) + 1
  const DAY_WIDTH = containerWidth > 0 ? containerWidth / totalDays : 60

  const dateToX = (str) =>
    Math.ceil((new Date(str + 'T00:00:00') - minDate) / 86400000) * DAY_WIDTH

  const todayX = Math.ceil((now - minDate) / 86400000) * DAY_WIDTH

  // Lane algorithm
  const overlaps = (a, b) => a.startDate <= b.endDate && b.startDate <= a.endDate
  const lanes = []
  ;[...milestones].sort((a,b) => a.startDate.localeCompare(b.startDate)).forEach(ms => {
    let placed = false
    for (const lane of lanes) {
      if (!lane.some(m => overlaps(m, ms))) { lane.push(ms); placed = true; break }
    }
    if (!placed) lanes.push([ms])
  })

  const LANE_H = 28
  const PAD_TOP = 26
  const totalH = PAD_TOP + lanes.length * LANE_H + 6

  const spacing = Math.max(1, Math.ceil(48 / DAY_WIDTH))
  const dateLabels = []
  for (let i = 0; i <= totalDays; i += spacing) {
    const d = new Date(minDate); d.setDate(minDate.getDate() + i)
    dateLabels.push({ x: i * DAY_WIDTH, label: `${d.getMonth()+1}/${d.getDate()}` })
  }

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <div className="relative" style={{ width: '100%', height: totalH }}>
        {dateLabels.map(({ x, label }) => (
          <span key={x} className="absolute top-0 text-xs select-none"
            style={{ left: x + 2, color: '#444', fontSize: 10 }}>{label}</span>
        ))}
        {Array.from({ length: totalDays + 1 }, (_, i) => (
          <div key={i} className="absolute top-0 bottom-0"
            style={{ left: i * DAY_WIDTH, borderLeft: '1px solid #1a1a1a' }} />
        ))}
        {todayX >= 0 && todayX <= containerWidth && (
          <div className="absolute top-0 bottom-0"
            style={{ left: todayX, borderLeft: '2px solid #ef4444', zIndex: 10 }} />
        )}
        {lanes.map((lane, li) => lane.map(ms => {
          const x = dateToX(ms.startDate)
          const w = dateToX(ms.endDate) + DAY_WIDTH - x - 6
          const isSelected = ms.id === selectedId
          return (
            <button key={ms.id}
              onClick={() => onSelect(ms.id === selectedId ? null : ms.id)}
              title={ms.name}
              className="absolute rounded px-2 text-xs font-medium truncate"
              style={{
                left:       x + 3,
                width:      Math.max(w, 20),
                top:        PAD_TOP + li * LANE_H,
                height:     LANE_H - 4,
                background: isSelected ? project.color + '44' : project.color + '18',
                border:     `1px solid ${isSelected ? project.color + 'cc' : project.color + '33'}`,
                color:      isSelected ? project.color : project.color + '99',
                zIndex: 5,
              }}
            >
              {ms.name}
            </button>
          )
        }))}
      </div>
    </div>
  )
}

// ── MilestoneList ───────────────────────────────────────────
function MilestoneList({ milestones, tasks, project, selectedId, onSelect }) {
  const { addMilestone, deleteMilestone } = useStore(s => ({
    addMilestone:    s.addMilestone,
    deleteMilestone: s.deleteMilestone,
  }))
  const [adding, setAdding]   = useState(false)
  const [form, setForm]       = useState({ name: '', startDate: todayStr, endDate: todayStr })

  const handleAdd = () => {
    if (!form.name.trim()) return
    addMilestone({ ...form, projId: project.id })
    setForm({ name: '', startDate: todayStr, endDate: todayStr })
    setAdding(false)
  }

  const projTasks = tasks.filter(t => t.projId === project.id)

  return (
    <div className="flex flex-col h-full overflow-hidden flex-shrink-0"
      style={{ width: 220, borderRight: '1px solid #1e1e1e' }}>

      {/* Header */}
      <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid #1e1e1e' }}>
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#555' }}>마일스톤</p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-1">
        {/* 전체 */}
        <button
          onClick={() => onSelect(null)}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors"
          style={{
            background: selectedId === null ? '#1c1c1c' : 'transparent',
            color:       selectedId === null ? '#efefef' : '#777',
            borderLeft:  selectedId === null ? `2px solid ${project.color}` : '2px solid transparent',
          }}
        >
          <span className="flex-1">전체</span>
          <span style={{ color: '#444' }}>
            {projTasks.filter(t => t.done).length}/{projTasks.length}
          </span>
        </button>

        {milestones.map(ms => {
          const msTasks = tasks.filter(t => t.milestoneId === ms.id)
          const done = msTasks.filter(t => t.done).length
          const isSelected = ms.id === selectedId
          return (
            <div key={ms.id}
              className="group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors text-xs"
              onClick={() => onSelect(ms.id === selectedId ? null : ms.id)}
              style={{
                background: isSelected ? '#1c1c1c' : 'transparent',
                color:       isSelected ? '#efefef' : '#777',
                borderLeft:  isSelected ? `2px solid ${project.color}` : '2px solid transparent',
              }}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#131313' }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
            >
              <span className="flex-1 truncate">{ms.name}</span>
              <span className="flex-shrink-0" style={{ color: '#444' }}>{done}/{msTasks.length}</span>
              <button
                onClick={e => { e.stopPropagation(); deleteMilestone(ms.id) }}
                className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-4 h-4 flex items-center justify-center rounded"
                style={{ color: '#555' }}
              >×</button>
            </div>
          )
        })}
      </div>

      {/* Add */}
      <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid #1e1e1e' }}>
        {adding ? (
          <div className="flex flex-col gap-2">
            <input
              autoFocus
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false) }}
              placeholder="마일스톤 이름"
              className="w-full px-2 py-1.5 rounded text-xs outline-none"
              style={{ background: '#131313', color: '#efefef', border: '1px solid #2e2e2e' }}
            />
            <div className="flex gap-1">
              <input type="date" value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className="flex-1 px-1.5 py-1.5 rounded text-xs outline-none"
                style={{ background: '#131313', color: '#efefef', border: '1px solid #2e2e2e', colorScheme: 'dark', minWidth: 0 }} />
              <input type="date" value={form.endDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                className="flex-1 px-1.5 py-1.5 rounded text-xs outline-none"
                style={{ background: '#131313', color: '#efefef', border: '1px solid #2e2e2e', colorScheme: 'dark', minWidth: 0 }} />
            </div>
            <div className="flex gap-1">
              <button onClick={handleAdd}
                className="flex-1 py-1.5 rounded text-xs font-medium"
                style={{ background: project.color, color: '#000' }}>추가</button>
              <button onClick={() => setAdding(false)}
                className="flex-1 py-1.5 rounded text-xs"
                style={{ background: '#1a1a1a', color: '#777', border: '1px solid #222' }}>취소</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAdding(true)}
            className="w-full py-2 rounded text-xs"
            style={{ background: '#131313', color: project.color, border: `1px solid ${project.color}33` }}>
            + 마일스톤 추가
          </button>
        )}
      </div>
    </div>
  )
}

// ── TaskPanel ───────────────────────────────────────────────
function TaskPanel({ tasks, project, milestone, onAddTask, onEditTask }) {
  const toggleTask = useStore(s => s.toggleTask)
  const sorted = [...tasks].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex-shrink-0 flex items-center justify-between"
        style={{ borderBottom: '1px solid #1e1e1e' }}>
        <div>
          <p className="text-sm font-medium" style={{ color: '#efefef' }}>
            {milestone ? milestone.name : '전체 할 일'}
          </p>
          {milestone && (
            <p className="text-xs mt-0.5" style={{ color: '#555' }}>
              {milestone.startDate} – {milestone.endDate}
            </p>
          )}
        </div>
        <span className="text-xs" style={{ color: '#555' }}>
          {tasks.filter(t => t.done).length} / {tasks.length}
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {sorted.length === 0 ? (
          <p className="text-xs text-center py-10" style={{ color: '#333' }}>할 일이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {sorted.map(task => (
              <div key={task.id}
                className="flex items-start gap-2 px-2 py-2 rounded group cursor-pointer"
                onClick={() => onEditTask(task)}
                onMouseEnter={e => e.currentTarget.style.background = '#111'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <button
                  onClick={e => { e.stopPropagation(); toggleTask(task.id) }}
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
                  }}>{task.text}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#444', fontSize: 10 }}>
                    {task.endDate ? `${task.date} – ${task.endDate}` : task.date}
                    {task.startTime && ` · ${task.startTime}`}
                    {task.endTime && `–${task.endTime}`}
                  </p>
                </div>
                <span className="opacity-0 group-hover:opacity-100 text-xs flex-shrink-0 self-center"
                  style={{ color: '#555' }}>✎</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid #1e1e1e' }}>
        <button onClick={onAddTask}
          className="w-full py-2 rounded text-xs"
          style={{ background: '#131313', color: project.color, border: `1px solid ${project.color}33` }}>
          + 할 일 추가
        </button>
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────
export default function ProjectDetail() {
  const { projects, milestones, tasks, selectedProjectId } = useStore(s => ({
    projects:          s.projects,
    milestones:        s.milestones,
    tasks:             s.tasks,
    selectedProjectId: s.selectedProjectId,
  }))

  const [selectedMilestoneId, setSelectedMilestoneId] = useState(null)
  const [taskModal, setTaskModal] = useState(null)
  const [editModal, setEditModal] = useState(null)

  const project = projects.find(p => p.id === selectedProjectId)

  // 프로젝트 바뀌면 마일스톤 선택 초기화
  useEffect(() => { setSelectedMilestoneId(null) }, [selectedProjectId])

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: '#444' }}>
        프로젝트를 선택하세요.
      </div>
    )
  }

  const projMilestones  = milestones.filter(m => m.projId === project.id)
  const selectedMilestone = projMilestones.find(m => m.id === selectedMilestoneId) ?? null
  const projTasks       = tasks.filter(t => t.projId === project.id)
  const displayTasks    = selectedMilestoneId
    ? tasks.filter(t => t.milestoneId === selectedMilestoneId)
    : projTasks

  const openAddTask = () => setTaskModal({
    defaultDate:        todayStr,
    defaultProjId:      project.id,
    defaultMilestoneId: selectedMilestoneId,
  })

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid #1e1e1e' }}>
        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: project.color }} />
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold" style={{ color: '#efefef' }}>{project.name}</h2>
          {project.desc && (
            <p className="text-xs mt-0.5 truncate" style={{ color: '#555' }}>{project.desc}</p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs" style={{ color: '#555' }}>
            {projTasks.filter(t => t.done).length} / {projTasks.length}
          </span>
          <button onClick={openAddTask}
            className="px-3 py-1.5 rounded text-xs font-medium"
            style={{ background: project.color, color: '#000' }}>
            + 할 일
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-shrink-0 px-6 py-4"
        style={{ borderBottom: '1px solid #1e1e1e', background: '#0c0c0c' }}>
        <p className="text-xs font-medium mb-2" style={{ color: '#555' }}>타임라인</p>
        <HorizontalTimeline
          milestones={projMilestones}
          project={project}
          selectedId={selectedMilestoneId}
          onSelect={setSelectedMilestoneId}
        />
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <MilestoneList
          milestones={projMilestones}
          tasks={tasks}
          project={project}
          selectedId={selectedMilestoneId}
          onSelect={setSelectedMilestoneId}
        />
        <TaskPanel
          tasks={displayTasks}
          project={project}
          milestone={selectedMilestone}
          onAddTask={openAddTask}
          onEditTask={task => setEditModal({ task })}
        />
      </div>

      {taskModal && (
        <AddTaskModal {...taskModal} onClose={() => setTaskModal(null)} />
      )}
      {editModal && (
        <EditTaskModal task={editModal.task} onClose={() => setEditModal(null)} />
      )}
    </div>
  )
}
