import React, { useState, useRef } from 'react'
import useStore from '../../store/useStore'
import EditTaskModal from '../modals/EditTaskModal'
import { parseDump, formatDuration } from '../../utils/parseDump'

export default function DumpPanel({ width = 260 }) {
  const { tasks, projects, toggleTask, deleteTask, addTask } = useStore(s => ({
    tasks:      s.tasks,
    projects:   s.projects,
    toggleTask: s.toggleTask,
    deleteTask: s.deleteTask,
    addTask:    s.addTask,
  }))

  const [editTask,   setEditTask]   = useState(null)
  const [dumpInput,  setDumpInput]  = useState('')
  const inputRef      = useRef(null)
  const composingRef  = useRef(false)

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

  // 날짜 없거나 프로젝트 없는 항목 = 덤프
  const dumpTasks = tasks.filter(t => !t.date || !t.projId)

  return (
    <div className="flex flex-col h-full flex-shrink-0" style={{ width, flexShrink: 0 }}>
      {/* Header */}
      <div
        className="px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid #1e1e1e' }}
      >
        <p className="text-sm font-medium" style={{ color: '#efefef' }}>할 일 덤프</p>
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
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {dumpTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <p className="text-xs" style={{ color: '#2a2a2a' }}>덤프된 할 일이 없어요</p>
            <p className="text-xs mt-1" style={{ color: '#222' }}>위 입력바에서 추가해보세요</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {dumpTasks.map(task => {
              const proj = projects.find(p => p.id === task.projId)
              return (
                <div
                  key={task.id}
                  className="group rounded px-3 py-2.5 cursor-pointer"
                  style={{ background: '#131313', border: '1px solid #1e1e1e' }}
                  onClick={() => setEditTask(task)}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#2e2e2e'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#1e1e1e'}
                >
                  <div className="flex items-start gap-2">
                    {/* 체크박스 */}
                    <button
                      onClick={e => { e.stopPropagation(); toggleTask(task.id) }}
                      className="w-4 h-4 rounded flex-shrink-0 mt-0.5 flex items-center justify-center"
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

                      {/* 메타 칩 */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {proj ? (
                          <span className="px-1.5 py-0.5 rounded text-xs"
                            style={{ background: proj.color + '18', color: proj.color, fontSize: 10 }}>
                            {proj.name}
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-xs"
                            style={{ background: '#1e1e1e', color: '#444', fontSize: 10 }}>
                            미지정
                          </span>
                        )}
                        {task.date ? (
                          <span className="px-1.5 py-0.5 rounded text-xs"
                            style={{ background: '#0f2010', color: '#4ade80', fontSize: 10 }}>
                            {task.date}
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-xs"
                            style={{ background: '#1e1e1e', color: '#444', fontSize: 10 }}>
                            날짜 없음
                          </span>
                        )}
                        {task.duration && (
                          <span className="px-1.5 py-0.5 rounded text-xs"
                            style={{ background: '#1a1a2a', color: '#a78bfa', fontSize: 10 }}>
                            ~{formatDuration(task.duration)}
                          </span>
                        )}
                        {task.urgent && (
                          <span className="px-1.5 py-0.5 rounded text-xs"
                            style={{ background: '#2a1010', color: '#f87171', fontSize: 10 }}>
                            긴급
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 삭제 버튼 */}
                    <button
                      onClick={e => { e.stopPropagation(); deleteTask(task.id) }}
                      className="opacity-0 group-hover:opacity-100 flex-shrink-0 self-start text-xs transition-opacity"
                      style={{ color: '#444', marginTop: 2 }}
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


      {editTask && (
        <EditTaskModal task={editTask} onClose={() => setEditTask(null)} />
      )}
    </div>
  )
}
