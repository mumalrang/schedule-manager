import React, { useRef, useState, useEffect } from 'react'
import EditTaskModal from '../modals/EditTaskModal'
import useStore from '../../store/useStore'

const DAY_LABELS = ['월','화','수','목','금','토','일']
const todayStr = new Date().toISOString().split('T')[0]

// ── HorizontalTimeline (milestones 기간 기준) ───────────────
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

  // 날짜 있는 마일스톤만 사용
  const validMs = milestones.filter(m => m.startDate && m.endDate)

  if (validMs.length === 0) {
    return (
      <div className="flex items-center justify-center py-4 text-xs" style={{ color: '#333' }}>
        프로젝트 기간을 설정하세요.
      </div>
    )
  }

  const allDates = validMs.flatMap(m => [
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

  // 레인 알고리즘
  const overlaps = (a, b) => a.startDate <= b.endDate && b.startDate <= a.endDate
  const lanes = []
  ;[...validMs].sort((a,b) => a.startDate.localeCompare(b.startDate)).forEach(ms => {
    let placed = false
    for (const lane of lanes) {
      if (!lane.some(m => overlaps(m, ms))) { lane.push(ms); placed = true; break }
    }
    if (!placed) lanes.push([ms])
  })

  const LANE_H  = 28
  const PAD_TOP = 26
  const totalH  = PAD_TOP + lanes.length * LANE_H + 6

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
            style={{ left: todayX, borderLeft: '2px solid #ef4444', zIndex: 10 }}>
            <span className="absolute text-xs" style={{ top: 0, left: 3, color: '#ef4444', fontSize: 9 }}>오늘</span>
          </div>
        )}
        {lanes.map((lane, li) => lane.map(ms => {
          const x = dateToX(ms.startDate)
          const w = dateToX(ms.endDate) + DAY_WIDTH - x - 6
          const isSelected = ms.id === selectedId
          const isPast = ms.endDate < todayStr
          return (
            <button key={ms.id}
              onClick={() => onSelect(ms.id === selectedId ? null : ms.id)}
              title={`${ms.name}\n${ms.startDate} ~ ${ms.endDate}`}
              className="absolute rounded px-2 text-xs font-medium truncate"
              style={{
                left:       x + 3,
                width:      Math.max(w, 20),
                top:        PAD_TOP + li * LANE_H,
                height:     LANE_H - 4,
                background: isSelected ? project.color + '44' : isPast ? project.color + '14' : project.color + '22',
                border:     `1px solid ${isSelected ? project.color + 'cc' : isPast ? project.color + '22' : project.color + '44'}`,
                color:      isSelected ? project.color : isPast ? project.color + '55' : project.color + 'aa',
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
  const { addMilestone, updateMilestone, deleteMilestone } = useStore(s => ({
    addMilestone:    s.addMilestone,
    updateMilestone: s.updateMilestone,
    deleteMilestone: s.deleteMilestone,
  }))
  const [adding,    setAdding]    = useState(false)
  const [addForm,   setAddForm]   = useState({ name: '', startDate: todayStr, endDate: todayStr })
  const [editingId, setEditingId] = useState(null)
  const [editForm,  setEditForm]  = useState({ name: '', startDate: '', endDate: '' })

  const handleAdd = () => {
    if (!addForm.name.trim()) return
    addMilestone({ ...addForm, projId: project.id })
    setAddForm({ name: '', startDate: todayStr, endDate: todayStr })
    setAdding(false)
  }

  const startEdit = (e, ms) => {
    e.stopPropagation()
    setEditingId(ms.id)
    setEditForm({ name: ms.name, startDate: ms.startDate || todayStr, endDate: ms.endDate || todayStr })
  }

  const saveEdit = () => {
    if (!editForm.name.trim()) return
    updateMilestone(editingId, editForm)
    setEditingId(null)
  }

  const projTasks = tasks.filter(t => t.projId === project.id)

  return (
    <div className="flex flex-col h-full overflow-hidden flex-shrink-0"
      style={{ width: 220, borderRight: '1px solid #1e1e1e' }}>

      {/* Header */}
      <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid #1e1e1e' }}>
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#555' }}>프로젝트</p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-1">
        {/* 전체 */}
        <button
          onClick={() => onSelect(null)}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left"
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
          const msTasks   = tasks.filter(t => t.milestoneId === ms.id)
          const done      = msTasks.filter(t => t.done).length
          const isSelected = ms.id === selectedId
          const isEditing  = ms.id === editingId

          if (isEditing) {
            return (
              <div key={ms.id} className="px-3 py-2 flex flex-col gap-1.5"
                style={{ background: '#131313', borderLeft: `2px solid ${project.color}` }}>
                <input
                  autoFocus
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null) }}
                  placeholder="프로젝트 이름"
                  className="w-full px-2 py-1 rounded text-xs outline-none"
                  style={{ background: '#1a1a1a', color: '#efefef', border: '1px solid #2e2e2e' }}
                />
                <div className="flex flex-col gap-1">
                  <input type="date" value={editForm.startDate}
                    onChange={e => setEditForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full px-1.5 py-1 rounded text-xs outline-none"
                    style={{ background: '#1a1a1a', color: '#efefef', border: '1px solid #2e2e2e', colorScheme: 'dark' }} />
                  <input type="date" value={editForm.endDate}
                    onChange={e => setEditForm(f => ({ ...f, endDate: e.target.value }))}
                    className="w-full px-1.5 py-1 rounded text-xs outline-none"
                    style={{ background: '#1a1a1a', color: '#efefef', border: '1px solid #2e2e2e', colorScheme: 'dark' }} />
                </div>
                <div className="flex gap-1">
                  <button onClick={saveEdit}
                    className="flex-1 py-1 rounded text-xs font-medium"
                    style={{ background: project.color, color: '#000' }}>저장</button>
                  <button onClick={() => setEditingId(null)}
                    className="flex-1 py-1 rounded text-xs"
                    style={{ background: '#1a1a1a', color: '#777', border: '1px solid #222' }}>취소</button>
                </div>
              </div>
            )
          }

          return (
            <div key={ms.id}
              className="group flex items-start gap-2 px-3 py-2 cursor-pointer text-xs"
              onClick={() => onSelect(ms.id === selectedId ? null : ms.id)}
              style={{
                background: isSelected ? '#1c1c1c' : 'transparent',
                borderLeft:  isSelected ? `2px solid ${project.color}` : '2px solid transparent',
              }}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#131313' }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
            >
              <div className="flex-1 min-w-0">
                <p className="truncate" style={{ color: isSelected ? '#efefef' : '#777' }}>{ms.name}</p>
                {(ms.startDate && ms.endDate) ? (
                  <p className="mt-0.5" style={{ color: '#444', fontSize: 10 }}>
                    {ms.startDate} ~ {ms.endDate}
                  </p>
                ) : (
                  <p className="mt-0.5" style={{ color: '#333', fontSize: 10 }}>기간 미설정</p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                <span style={{ color: '#444' }}>{done}/{msTasks.length}</span>
                <button
                  onClick={e => startEdit(e, ms)}
                  className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center rounded"
                  style={{ color: '#555' }}
                  title="기간 수정"
                >✎</button>
                <button
                  onClick={e => { e.stopPropagation(); deleteMilestone(ms.id) }}
                  className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center rounded"
                  style={{ color: '#555' }}
                >×</button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add milestone */}
      <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid #1e1e1e' }}>
        {adding ? (
          <div className="flex flex-col gap-2">
            <input
              autoFocus
              value={addForm.name}
              onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false) }}
              placeholder="마일스톤 이름"
              className="w-full px-2 py-1.5 rounded text-xs outline-none"
              style={{ background: '#131313', color: '#efefef', border: '1px solid #2e2e2e' }}
            />
            <div className="flex flex-col gap-1">
              <input type="date" value={addForm.startDate}
                onChange={e => setAddForm(f => ({ ...f, startDate: e.target.value }))}
                className="w-full px-1.5 py-1.5 rounded text-xs outline-none"
                style={{ background: '#131313', color: '#efefef', border: '1px solid #2e2e2e', colorScheme: 'dark' }} />
              <input type="date" value={addForm.endDate}
                onChange={e => setAddForm(f => ({ ...f, endDate: e.target.value }))}
                className="w-full px-1.5 py-1.5 rounded text-xs outline-none"
                style={{ background: '#131313', color: '#efefef', border: '1px solid #2e2e2e', colorScheme: 'dark' }} />
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
            + 프로젝트 추가
          </button>
        )}
      </div>
    </div>
  )
}

// ── TaskPanel ───────────────────────────────────────────────
function TaskPanel({ tasks, project, milestone, onEditTask }) {
  const toggleTask = useStore(s => s.toggleTask)
  const addTask    = useStore(s => s.addTask)
  const updateTask = useStore(s => s.updateTask)

  const [isDragOver,  setIsDragOver]  = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [lassoBox,    setLassoBox]    = useState(null)
  const [input,       setInput]       = useState('')

  const listRef      = useRef(null)
  const lassoRef     = useRef(null)
  const composingRef = useRef(false)

  const sorted = [...tasks].sort((a, b) => a.text.localeCompare(b.text, 'ko'))

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
    if (e.target.closest('button') || e.target.closest('input')) return
    e.preventDefault()
    lassoRef.current = { x1: e.clientX, y1: e.clientY, x2: e.clientX, y2: e.clientY }
    if (!e.ctrlKey && !e.metaKey) setSelectedIds(new Set())
  }

  const handleTaskClick = (e, task) => {
    if (e.ctrlKey || e.metaKey) {
      setSelectedIds(prev => {
        const next = new Set(prev)
        next.has(task.id) ? next.delete(task.id) : next.add(task.id)
        return next
      })
      return
    }
    setSelectedIds(new Set())
    onEditTask(task)
  }

  const handleTaskDragStart = (e, task) => {
    const ids = (selectedIds.has(task.id) && selectedIds.size > 1)
      ? [...selectedIds]
      : [task.id]
    e.dataTransfer.effectAllowed = 'move'
    if (ids.length > 1) e.dataTransfer.setData('scheduletaskids', JSON.stringify(ids))
    e.dataTransfer.setData('scheduletaskid', ids[0])
  }

  const acceptTypes = (types) =>
    types.includes('dumptaskid') || types.includes('dumptaskids')

  const assignToProject = (ids) => {
    ids.forEach(id => updateTask(id, {
      projId:      project.id,
      milestoneId: milestone?.id ?? null,
    }))
  }

  const handleAddTask = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    addTask({
      text:        trimmed,
      projId:      project.id,
      milestoneId: milestone?.id ?? null,
      date:        null,
      startTime:   null,
      endTime:     null,
    })
    setInput('')
  }

  const sel = selectedIds.size

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex-shrink-0 flex items-center justify-between"
        style={{ borderBottom: '1px solid #1e1e1e' }}>
        <div>
          <p className="text-sm font-medium" style={{ color: '#efefef' }}>
            {milestone ? milestone.name : '전체 할 일'}
          </p>
          {milestone && milestone.startDate && milestone.endDate && (
            <p className="text-xs mt-0.5" style={{ color: '#555' }}>
              {milestone.startDate} ~ {milestone.endDate}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: '#555' }}>
            {tasks.filter(t => t.done).length} / {tasks.length}
          </span>
          {sel > 0 && (
            <>
              <span className="text-xs px-1.5 py-0.5 rounded"
                style={{ background: '#60a5fa22', color: '#60a5fa', border: '1px solid #60a5fa33' }}>
                {sel}개 선택
              </span>
              <button onClick={() => setSelectedIds(new Set())} className="text-xs" style={{ color: '#444' }}>✕</button>
            </>
          )}
        </div>
      </div>

      {/* Task list — 드롭 존 + 라소 */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-3 py-2"
        style={{
          background:    isDragOver ? project.color + '0a' : 'transparent',
          outline:       isDragOver ? `2px dashed ${project.color}44` : 'none',
          outlineOffset: -4,
          transition:    'background 0.1s',
          userSelect:    'none',
        }}
        onMouseDown={handleContainerMouseDown}
        onDragOver={e => {
          if (!acceptTypes(e.dataTransfer.types)) return
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
          setIsDragOver(true)
        }}
        onDragLeave={e => {
          if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOver(false)
        }}
        onDrop={e => {
          e.preventDefault()
          setIsDragOver(false)
          const multiRaw = e.dataTransfer.getData('dumptaskids')
          if (multiRaw) { assignToProject(JSON.parse(multiRaw)); return }
          const id = e.dataTransfer.getData('dumpTaskId') || e.dataTransfer.getData('dumptaskid')
          if (id) assignToProject([id])
        }}
      >
        {sorted.length === 0 ? (
          <p className="text-xs text-center py-10" style={{ color: isDragOver ? project.color + '88' : '#333' }}>
            {isDragOver ? '여기에 놓기' : '할 일이 없습니다.'}
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {sorted.map(task => {
              const isSelected = selectedIds.has(task.id)
              return (
                <div key={task.id}
                  data-taskid={task.id}
                  draggable
                  className="flex items-center gap-2 px-2 py-2 rounded group cursor-grab active:cursor-grabbing"
                  style={{
                    background:   isSelected ? '#1a2535' : 'transparent',
                    border:       `1px solid ${isSelected ? '#60a5fa55' : 'transparent'}`,
                    borderRadius: 6,
                  }}
                  onClick={e => handleTaskClick(e, task)}
                  onDragStart={e => handleTaskDragStart(e, task)}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#111' }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                >
                  <button
                    onClick={e => { e.stopPropagation(); toggleTask(task.id) }}
                    className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center"
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
                  <p className="flex-1 text-xs truncate" style={{
                    color:          task.done ? '#444' : isSelected ? '#aad4ff' : '#ccc',
                    textDecoration: task.done ? 'line-through' : 'none',
                  }}>{task.text}</p>
                  <span className="opacity-0 group-hover:opacity-100 text-xs flex-shrink-0"
                    style={{ color: '#555' }}>✎</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

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

      {/* 할 일 입력 */}
      <div className="px-3 py-2 flex-shrink-0" style={{ borderTop: '1px solid #1e1e1e' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onCompositionStart={() => { composingRef.current = true }}
          onCompositionEnd={() => { composingRef.current = false }}
          onKeyDown={e => { if (e.key === 'Enter' && !composingRef.current) { e.preventDefault(); handleAddTask() } }}
          placeholder="할 일 입력 후 Enter..."
          className="w-full px-3 py-2 rounded text-xs outline-none"
          style={{
            background: '#131313',
            border:     '1px solid #222',
            color:      '#ddd',
            caretColor: project.color,
          }}
          onFocus={e => e.target.style.borderColor = project.color + '55'}
          onBlur={e  => e.target.style.borderColor = '#222'}
        />
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
  const [showTimeline,        setShowTimeline]        = useState(true)
  const [editModal,           setEditModal]           = useState(null)

  const project = projects.find(p => p.id === selectedProjectId)

  useEffect(() => { setSelectedMilestoneId(null) }, [selectedProjectId])

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: '#444' }}>
        프로젝트를 선택하세요.
      </div>
    )
  }

  const projMilestones    = milestones.filter(m => m.projId === project.id)
  const selectedMilestone = projMilestones.find(m => m.id === selectedMilestoneId) ?? null
  const projTasks         = tasks.filter(t => t.projId === project.id)
  const displayTasks      = selectedMilestoneId
    ? tasks.filter(t => t.milestoneId === selectedMilestoneId)
    : projTasks

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
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs" style={{ color: '#555' }}>
            {projTasks.filter(t => t.done).length} / {projTasks.length}
          </span>
          <button
            onClick={() => setShowTimeline(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-all"
            style={{
              background: showTimeline ? project.color + '22' : '#1a1a1a',
              color:      showTimeline ? project.color : '#555',
              border:     `1px solid ${showTimeline ? project.color + '55' : '#2a2a2a'}`,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="1" y="5" width="10" height="2" rx="1" fill="currentColor" opacity="0.5"/>
              <rect x="1" y="2" width="6" height="2" rx="1" fill="currentColor"/>
              <rect x="1" y="8" width="8" height="2" rx="1" fill="currentColor" opacity="0.7"/>
            </svg>
            타임라인
          </button>
        </div>
      </div>

      {/* Timeline — 마일스톤 기간 기준 */}
      {showTimeline && (
        <div className="flex-shrink-0 px-6 py-4"
          style={{ borderBottom: '1px solid #1e1e1e', background: '#0c0c0c' }}>
          <HorizontalTimeline
            milestones={projMilestones}
            project={project}
            selectedId={selectedMilestoneId}
            onSelect={setSelectedMilestoneId}
          />
        </div>
      )}

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
          onEditTask={task => setEditModal({ task })}
        />
      </div>

      {editModal && (
        <EditTaskModal task={editModal.task} onClose={() => setEditModal(null)} />
      )}
    </div>
  )
}
