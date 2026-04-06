import React, { useState, useRef, useEffect } from 'react'
import useStore from '../../store/useStore'
import EditTaskModal from '../modals/EditTaskModal'
import { parseDump } from '../../utils/parseDump'

export default function DumpPanel({ width = 260 }) {
  const tasks      = useStore(s => s.tasks)
  const projects   = useStore(s => s.projects)
  const toggleTask = useStore(s => s.toggleTask)
  const deleteTask = useStore(s => s.deleteTask)
  const addTask    = useStore(s => s.addTask)
  const updateTask = useStore(s => s.updateTask)

  const [editTask,       setEditTask]       = useState(null)
  const [dumpInput,      setDumpInput]      = useState('')
  const [isDumpDragOver, setIsDumpDragOver] = useState(false)
  const [selectedIds,    setSelectedIds]    = useState(new Set())
  const [lassoBox,       setLassoBox]       = useState(null) // viewport coords { x1,y1,x2,y2 }

  const inputRef     = useRef(null)
  const composingRef = useRef(false)
  const draggingRef  = useRef(false)
  const listRef      = useRef(null)
  const lassoRef     = useRef(null)

  const handleSubmit = (e) => {
    e?.preventDefault()
    const trimmed = dumpInput.trim()
    if (!trimmed) return
    const parsed = parseDump(trimmed, projects)
    addTask({
      text:      parsed.text || trimmed,
      projId:    parsed.projId    || null,
      date:      parsed.date      || null,
      startTime: parsed.startTime || null,
      endTime:   parsed.endTime   || null,
      urgent:    parsed.urgent    || false,
      duration:  parsed.duration  || null,
    })
    setDumpInput('')
  }

  const dumpTasks = tasks.filter(t => !t.date && !t.milestoneId && !t.projId)

  // ── 라소(드래그) 선택 ─────────────────────────────────────
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
    if (e.target.closest('[data-taskid]')) return // 태스크 위에서는 라소 안 시작
    e.preventDefault()
    lassoRef.current = { x1: e.clientX, y1: e.clientY, x2: e.clientX, y2: e.clientY }
    if (!e.ctrlKey && !e.metaKey) setSelectedIds(new Set())
  }

  // 태스크 클릭 (ctrl = 토글 선택, 일반 = 에디터 열기)
  const handleTaskClick = (e, task) => {
    if (draggingRef.current) return
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

  // 드래그 시작: 선택된 항목이 있으면 모두 함께
  const handleTaskDragStart = (e, task) => {
    draggingRef.current = true
    const ids = (selectedIds.has(task.id) && selectedIds.size > 1)
      ? [...selectedIds]
      : [task.id]
    e.dataTransfer.effectAllowed = 'move'
    if (ids.length > 1) e.dataTransfer.setData('dumptaskids', JSON.stringify(ids))
    e.dataTransfer.setData('dumpTaskId', ids[0])
  }

  const sel = selectedIds.size

  return (
    <div
      className="flex flex-col h-full flex-shrink-0"
      style={{
        width,
        flexShrink: 0,
        background: isDumpDragOver ? '#1e2a1e' : 'transparent',
        outline: isDumpDragOver ? '2px dashed #34d39944' : 'none',
        outlineOffset: -4,
        transition: 'background 0.1s',
      }}
      onDragOver={(e) => {
        const t = e.dataTransfer.types
        if (!t.includes('scheduletaskid') && !t.includes('scheduletaskids')) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        setIsDumpDragOver(true)
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setIsDumpDragOver(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        setIsDumpDragOver(false)
        const clear = { date: null, endDate: null, startTime: null, endTime: null, projId: null, milestoneId: null }
        const multiRaw = e.dataTransfer.getData('scheduletaskids')
        if (multiRaw) { JSON.parse(multiRaw).forEach(id => updateTask(id, clear)); return }
        const taskId = e.dataTransfer.getData('scheduletaskid')
        if (taskId) updateTask(taskId, clear)
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid #1e1e1e' }}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium" style={{ color: '#efefef' }}>할 일 덤프</p>
          {sel > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs px-1.5 py-0.5 rounded"
                style={{ background: '#60a5fa22', color: '#60a5fa', border: '1px solid #60a5fa33' }}>
                {sel}개 선택
              </span>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-xs"
                style={{ color: '#444' }}
              >✕</button>
            </div>
          )}
        </div>
        <p className="text-xs mt-0.5" style={{ color: '#555' }}>
          {dumpTasks.length > 0 ? `${dumpTasks.length}개 미배치` : '비어있음'}
        </p>
      </div>

      {/* 입력바 */}
      <div className="flex-shrink-0 px-2 py-2" style={{ borderBottom: '1px solid #1e1e1e' }}>
        <form onSubmit={e => e.preventDefault()}>
          <input
            ref={inputRef}
            value={dumpInput}
            onChange={e => setDumpInput(e.target.value)}
            onCompositionStart={() => { composingRef.current = true }}
            onCompositionEnd={() => { composingRef.current = false }}
            onKeyDown={e => { if (e.key === 'Enter' && !composingRef.current) { e.preventDefault(); handleSubmit() } }}
            placeholder="할 일 입력 후 Enter..."
            className="w-full px-3 py-2 rounded text-xs outline-none"
            style={{
              background: '#131313',
              border:     '1px solid #222',
              color:      '#ddd',
              caretColor: '#60a5fa',
            }}
            onFocus={e => e.target.style.borderColor = '#2e2e2e'}
            onBlur={e  => e.target.style.borderColor = '#222'}
          />
        </form>
      </div>

      {/* List */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-2 py-2 relative"
        style={{ userSelect: 'none' }}
        onMouseDown={handleContainerMouseDown}
      >
        {dumpTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <p className="text-xs" style={{ color: '#2a2a2a' }}>덤프된 할 일이 없어요</p>
            <p className="text-xs mt-1" style={{ color: '#222' }}>위 입력바에서 추가해보세요</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {dumpTasks.map(task => {
              const isSelected = selectedIds.has(task.id)
              return (
                <div
                  key={task.id}
                  data-taskid={task.id}
                  draggable
                  onDragStart={e => handleTaskDragStart(e, task)}
                  onDragEnd={() => { draggingRef.current = false }}
                  className="group rounded px-3 py-2.5 cursor-grab active:cursor-grabbing"
                  style={{
                    background: isSelected ? '#1a2535' : '#131313',
                    border: `1px solid ${isSelected ? '#60a5fa55' : '#1e1e1e'}`,
                    transition: 'background 0.05s, border-color 0.05s',
                  }}
                  onClick={e => handleTaskClick(e, task)}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = '#2e2e2e' }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = '#1e1e1e' }}
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={e => { e.stopPropagation(); toggleTask(task.id) }}
                      className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center"
                      style={{
                        border:     `1.5px solid ${task.done ? '#555' : '#333'}`,
                        background: task.done ? '#333' : 'transparent',
                        flexShrink: 0,
                      }}
                    >
                      {task.done && (
                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2.5 2.5L8 3" stroke="#888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>

                    <p
                      className="flex-1 text-xs leading-snug truncate"
                      style={{
                        color:          task.done ? '#444' : isSelected ? '#aad4ff' : '#ccc',
                        textDecoration: task.done ? 'line-through' : 'none',
                      }}
                    >
                      {task.text}
                    </p>

                    <button
                      onClick={e => { e.stopPropagation(); deleteTask(task.id) }}
                      className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-xs transition-opacity"
                      style={{ color: '#444' }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 라소 선택 박스 (fixed, 화면 전체 기준) */}
      {lassoBox && Math.abs(lassoBox.x2 - lassoBox.x1) > 4 && (
        <div
          className="fixed pointer-events-none"
          style={{
            left:   Math.min(lassoBox.x1, lassoBox.x2),
            top:    Math.min(lassoBox.y1, lassoBox.y2),
            width:  Math.abs(lassoBox.x2 - lassoBox.x1),
            height: Math.abs(lassoBox.y2 - lassoBox.y1),
            border: '1px dashed #60a5fa88',
            background: '#60a5fa0d',
            zIndex: 9999,
          }}
        />
      )}

      {editTask && (
        <EditTaskModal task={editTask} onClose={() => setEditTask(null)} />
      )}
    </div>
  )
}
