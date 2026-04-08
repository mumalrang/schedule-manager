import React, { useState, useRef, useEffect, useMemo } from 'react'
import useStore from '../../store/useStore'
import EditTaskModal from '../modals/EditTaskModal'
import { parseDump } from '../../utils/parseDump'

const DURATION_UNITS = ['분', '시간', '일', '주']

const UNIT_CHIPS = {
  '분':  [{ label: '15분', val: 15 }, { label: '30분', val: 30 }, { label: '45분', val: 45 }],
  '시간': [{ label: '1시간', val: 1 }, { label: '2시간', val: 2 }, { label: '3시간', val: 3 }, { label: '4시간', val: 4 }],
  '일':  [{ label: '1일', val: 1 }, { label: '2일', val: 2 }, { label: '3일', val: 3 }, { label: '5일', val: 5 }],
  '주':  [{ label: '1주', val: 1 }, { label: '2주', val: 2 }, { label: '4주', val: 4 }],
}

function toMinutes(unit, val) {
  if (!val) return null
  switch (unit) {
    case '분':  return val
    case '시간': return val * 60
    case '일':  return val * 1440
    case '주':  return val * 7 * 1440
    default:   return val
  }
}

const TIME_FILTERS = [
  { key: 'all',      label: '시간'   },
  { key: 'today',    label: '오늘'   },
  { key: 'tomorrow', label: '내일'   },
  { key: 'week',     label: '이번주' },
  { key: 'custom',   label: '지정'   },
]

function toLocalStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function getWeekRange() {
  const now  = new Date()
  const day  = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const mon  = new Date(now); mon.setDate(now.getDate() + diff)
  const sun  = new Date(mon); sun.setDate(mon.getDate() + 6)
  return { monStr: toLocalStr(mon), sunStr: toLocalStr(sun) }
}

export default function DumpPanel({ width = 260 }) {
  const tasks      = useStore(s => s.tasks)
  const projects   = useStore(s => s.projects)
  const toggleTask = useStore(s => s.toggleTask)
  const deleteTask = useStore(s => s.deleteTask)
  const addTask    = useStore(s => s.addTask)
  const updateTask = useStore(s => s.updateTask)

  const [timeFilter,      setTimeFilter]      = useState('all')    // 'all'|'today'|'tomorrow'|'week'|'custom'
  const [projFilter,      setProjFilter]      = useState('all')    // 'all'|projId
  const [customDate,      setCustomDate]      = useState('')
  const [editTask,        setEditTask]        = useState(null)
  const [dumpInput,       setDumpInput]       = useState('')
  const [isDumpDragOver,  setIsDumpDragOver]  = useState(false)
  const [selectedIds,     setSelectedIds]     = useState(new Set())
  const [lassoBox,        setLassoBox]        = useState(null)
  const [inlineAddProjId, setInlineAddProjId] = useState(null)
  const [durationUnit,    setDurationUnit]    = useState('시간') // '분'|'시간'|'일'|'주'
  const [durationVal,     setDurationVal]     = useState(null)  // 선택된 값 (단위 기준)
  const [chipFocus,       setChipFocus]       = useState(-1)

  const customDateRef = useRef(null)
  const chipRefs      = useRef([])

  const inputRef     = useRef(null)
  const composingRef = useRef(false)
  const draggingRef  = useRef(false)
  const listRef      = useRef(null)
  const lassoRef     = useRef(null)

  const durationMinutes = toMinutes(durationUnit, durationVal)

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
      duration:  durationMinutes ?? parsed.duration ?? null,
    })
    setDumpInput('')
    setDurationVal(null)
    setChipFocus(-1)
  }

  // 칩 키보드 핸들러
  const chips = UNIT_CHIPS[durationUnit]
  const handleChipKeyDown = (e, idx) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      const next = (idx + 1) % chips.length
      setChipFocus(next); chipRefs.current[next]?.focus()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const prev = (idx - 1 + chips.length) % chips.length
      setChipFocus(prev); chipRefs.current[prev]?.focus()
    } else if (e.key === ' ') {
      e.preventDefault()
      const v = chips[idx].val
      setDurationVal(d => d === v ? null : v)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const v = chips[idx].val
      setDurationVal(v)
      inputRef.current?.focus()
      setTimeout(() => handleSubmit(), 0)
    } else if (e.key === 'Escape' || e.key === 'ArrowUp' || e.key === 'Tab') {
      e.preventDefault()
      setChipFocus(-1); inputRef.current?.focus()
    }
  }

  // ── 필터 계산 ─────────────────────────────────────────────
  const todayStr    = useMemo(() => toLocalStr(new Date()), [])
  const tomorrowStr = useMemo(() => { const d = new Date(); d.setDate(d.getDate()+1); return toLocalStr(d) }, [])
  const { monStr, sunStr } = useMemo(() => getWeekRange(), [])

  const dumpTasks = useMemo(() => {
    return tasks.filter(t => {
      // ── 시간 필터 ──
      switch (timeFilter) {
        case 'all':      if (t.date) return false; break         // 미배정만
        case 'today':    if (t.date !== todayStr) return false; break
        case 'tomorrow': if (t.date !== tomorrowStr) return false; break
        case 'week':     if (!t.date || t.date < monStr || t.date > sunStr) return false; break
        case 'custom':   if (!customDate || t.date !== customDate) return false; break
        default: break
      }
      // ── 프로젝트 필터 ──
      if (projFilter !== 'all' && t.projId !== projFilter) return false
      return true
    })
  }, [tasks, timeFilter, projFilter, customDate, todayStr, tomorrowStr, monStr, sunStr])

  // 프로젝트별 그룹 — projFilter === 'all' 일 때만
  const groupedByProject = useMemo(() => {
    if (projFilter !== 'all') return null
    const groups = []
    projects.forEach(proj => {
      const pts = dumpTasks.filter(t => t.projId === proj.id)
      groups.push({ proj, tasks: pts })
    })
    const noProj = dumpTasks.filter(t => !t.projId)
    if (noProj.length) groups.push({ proj: null, tasks: noProj })
    return groups
  }, [dumpTasks, projFilter, projects])

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
              <button onClick={() => setSelectedIds(new Set())} className="text-xs" style={{ color: '#444' }}>✕</button>
            </div>
          )}
        </div>
        <p className="text-xs mt-0.5" style={{ color: '#555' }}>
          {dumpTasks.length > 0 ? `${dumpTasks.length}개` : '비어있음'}
        </p>
      </div>

      {/* 필터 — 시간 (Row 1) */}
      <div className="flex-shrink-0 px-2 pt-2 pb-0.5 flex items-center gap-1">
        {TIME_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => {
              if (f.key === 'custom') {
                setTimeFilter('custom')
                setTimeout(() => customDateRef.current?.showPicker?.(), 0)
              } else {
                setTimeFilter(f.key)
              }
              setSelectedIds(new Set())
            }}
            className="px-2 py-0.5 rounded-full text-xs transition-all flex-shrink-0"
            style={{
              background: timeFilter === f.key ? '#2a2a2a' : 'transparent',
              color:      timeFilter === f.key ? '#efefef' : '#555',
              border:     timeFilter === f.key ? '1px solid #3a3a3a' : '1px solid transparent',
            }}
          >
            {f.key === 'custom' && timeFilter === 'custom' && customDate
              ? (() => { const d = new Date(customDate+'T00:00:00'); return `${d.getMonth()+1}/${d.getDate()}` })()
              : f.label}
          </button>
        ))}
        {/* 숨김 date input */}
        <input
          ref={customDateRef}
          type="date"
          value={customDate}
          onChange={e => { setCustomDate(e.target.value); setTimeFilter('custom') }}
          className="absolute opacity-0 pointer-events-none w-0 h-0"
        />
      </div>

      {/* 필터 — 프로젝트 (Row 2, 가로 스크롤) */}
      <div className="flex-shrink-0 px-2 pb-1.5 flex items-center gap-1 overflow-x-auto"
        style={{ scrollbarWidth: 'none' }}>
        {/* 전체 버튼 */}
        <button
          onClick={() => { setProjFilter('all'); setSelectedIds(new Set()) }}
          className="px-2 py-0.5 rounded-full text-xs transition-all flex-shrink-0"
          style={{
            background: projFilter === 'all' ? '#2a2a2a' : 'transparent',
            color:      projFilter === 'all' ? '#efefef' : '#555',
            border:     projFilter === 'all' ? '1px solid #3a3a3a' : '1px solid transparent',
          }}
        >프로젝트</button>
        {/* 프로젝트별 버튼 */}
        {projects.map(proj => (
          <button
            key={proj.id}
            onClick={() => { setProjFilter(proj.id); setSelectedIds(new Set()) }}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all flex-shrink-0"
            style={{
              background: projFilter === proj.id ? proj.color + '22' : 'transparent',
              color:      projFilter === proj.id ? proj.color : '#555',
              border:     projFilter === proj.id ? `1px solid ${proj.color}55` : '1px solid transparent',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: proj.color }} />
            {proj.name}
          </button>
        ))}
      </div>

      {/* 입력바 + 소요시간 칩 */}
      <div className="flex-shrink-0 px-2 pt-2 pb-1.5" style={{ borderBottom: '1px solid #1e1e1e' }}>
        {/* 텍스트 입력 */}
        <input
          ref={inputRef}
          value={dumpInput}
          onChange={e => {
            setDumpInput(e.target.value)
            // 텍스트 파싱으로 소요시간 자동 감지 (분/시간 단위만)
            const parsed = parseDump(e.target.value, projects)
            if (parsed.duration) {
              if (parsed.duration % 60 === 0) {
                setDurationUnit('시간'); setDurationVal(parsed.duration / 60)
              } else {
                setDurationUnit('분'); setDurationVal(parsed.duration)
              }
            }
          }}
          onCompositionStart={() => { composingRef.current = true }}
          onCompositionEnd={() => { composingRef.current = false }}
          onKeyDown={e => {
            if (e.key === 'Enter' && !composingRef.current) { e.preventDefault(); handleSubmit(); return }
            // Tab → 칩으로 이동
            if (e.key === 'Tab') {
              e.preventDefault()
              setChipFocus(0)
              chipRefs.current[0]?.focus()
            }
          }}
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

        {/* 소요시간: 단위 선택 + 칩 */}
        <div className="mt-1.5">
          {/* 단위 탭 */}
          <div className="flex items-center gap-0.5 mb-1">
            <span className="text-xs mr-1 flex-shrink-0" style={{ color: '#333' }}>⏱</span>
            {DURATION_UNITS.map(u => (
              <button
                key={u}
                tabIndex={-1}
                onClick={() => { setDurationUnit(u); setDurationVal(null); setChipFocus(-1) }}
                className="px-2 py-0.5 rounded text-xs transition-all flex-shrink-0"
                style={{
                  background: durationUnit === u ? '#222' : 'transparent',
                  color:      durationUnit === u ? '#bbb' : '#444',
                  border:     durationUnit === u ? '1px solid #333' : '1px solid transparent',
                }}
              >{u}</button>
            ))}
            {durationVal && (
              <button
                onClick={() => setDurationVal(null)}
                className="ml-auto text-xs flex-shrink-0"
                style={{ color: '#333' }}
              >✕</button>
            )}
          </div>
          {/* 값 칩 */}
          <div className="flex items-center gap-1 pl-5">
            {chips.map((chip, idx) => {
              const isSelected = durationVal === chip.val
              return (
                <button
                  key={chip.val}
                  ref={el => { chipRefs.current[idx] = el }}
                  tabIndex={-1}
                  onClick={() => setDurationVal(v => v === chip.val ? null : chip.val)}
                  onKeyDown={e => handleChipKeyDown(e, idx)}
                  className="px-2 py-0.5 rounded-full text-xs transition-all flex-shrink-0 outline-none"
                  style={{
                    background: isSelected ? '#60a5fa22' : chipFocus === idx ? '#222' : 'transparent',
                    color:      isSelected ? '#60a5fa'   : chipFocus === idx ? '#aaa' : '#444',
                    border:     isSelected ? '1px solid #60a5fa44' : chipFocus === idx ? '1px solid #333' : '1px solid transparent',
                  }}
                >{chip.label}</button>
              )
            })}
          </div>
        </div>
      </div>

      {/* List */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-2 py-2 relative"
        style={{ userSelect: 'none' }}
        onMouseDown={handleContainerMouseDown}
      >
        {projFilter === 'all' && groupedByProject ? (
          /* ── 프로젝트별 그룹 뷰 ── */
          <div className="flex flex-col gap-3">
            {groupedByProject.map(({ proj, tasks: pts }) => {
              const groupKey = proj?.id ?? 'none'
              const isAdding = inlineAddProjId === groupKey
              return (
                <div key={groupKey}>
                  {/* 프로젝트 헤더 */}
                  <div className="flex items-center gap-1.5 px-1 mb-1">
                    <span className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: proj?.color ?? '#444' }} />
                    <span className="text-xs font-medium truncate" style={{ color: proj ? '#888' : '#444' }}>
                      {proj?.name ?? '미지정'}
                    </span>
                    <span className="text-xs" style={{ color: '#333' }}>{pts.length}</span>
                    {timeFilter === 'all' && (
                      <button
                        className="ml-auto text-xs px-1.5 py-0.5 rounded transition-all"
                        style={{ color: isAdding ? '#60a5fa' : '#444', background: isAdding ? '#60a5fa11' : 'transparent' }}
                        onClick={() => setInlineAddProjId(isAdding ? null : groupKey)}
                      >+</button>
                    )}
                  </div>
                  {/* 태스크 카드들 */}
                  <div className="flex flex-col gap-1">
                    {pts.map(task => <TaskCard key={task.id} task={task} proj={proj}
                      selectedIds={selectedIds} toggleTask={toggleTask} deleteTask={deleteTask} updateTask={updateTask}
                      handleTaskClick={handleTaskClick} handleTaskDragStart={handleTaskDragStart}
                      draggingRef={draggingRef} showDate={false} />)}
                    {/* 인라인 입력창 */}
                    {isAdding && (
                      <InlineAddInput
                        projId={proj?.id ?? null}
                        color={proj?.color ?? '#555'}
                        addTask={addTask}
                        onClose={() => setInlineAddProjId(null)}
                      />
                    )}
                  </div>
                </div>
              )
            })}
            {/* 프로젝트가 하나도 없을 때 빈 그룹 표시 */}
            {groupedByProject.length === 0 && (
              <div className="text-center py-8">
                <p className="text-xs" style={{ color: '#2a2a2a' }}>할 일이 없어요</p>
              </div>
            )}
          </div>
        ) : dumpTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <p className="text-xs" style={{ color: '#2a2a2a' }}>할 일이 없어요</p>
            <p className="text-xs mt-1" style={{ color: '#222' }}>위 입력바에서 추가해보세요</p>
          </div>
        ) : (
          /* ── 일반 목록 뷰 ── */
          <div className="flex flex-col gap-1.5">
            {dumpTasks.map(task => {
              const proj = projects.find(p => p.id === task.projId)
              return <TaskCard key={task.id} task={task} proj={proj}
                selectedIds={selectedIds} toggleTask={toggleTask} deleteTask={deleteTask} updateTask={updateTask}
                handleTaskClick={handleTaskClick} handleTaskDragStart={handleTaskDragStart}
                draggingRef={draggingRef} showDate={timeFilter !== 'all'} />
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

// ── 프로젝트별 인라인 추가 입력창 ────────────────────────
function InlineAddInput({ projId, color, addTask, onClose }) {
  const [text, setText] = useState('')
  const inputRef     = useRef(null)
  const composingRef = useRef(false)

  useEffect(() => { inputRef.current?.focus() }, [])

  const submit = () => {
    const trimmed = text.trim()
    if (!trimmed) { onClose(); return }
    addTask({ text: trimmed, projId: projId || null, date: null, startTime: null, endTime: null })
    setText('')
    // 닫지 않고 계속 입력 가능하게 유지
    inputRef.current?.focus()
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded"
      style={{ background: '#0e0e0e', border: `1px dashed ${color}44` }}>
      <span className="w-0.5 self-stretch rounded-full flex-shrink-0" style={{ background: color, minHeight: 14 }} />
      <input
        ref={inputRef}
        value={text}
        onChange={e => setText(e.target.value)}
        onCompositionStart={() => { composingRef.current = true }}
        onCompositionEnd={() => { composingRef.current = false }}
        onKeyDown={e => {
          if (e.key === 'Enter' && !composingRef.current) { e.preventDefault(); submit() }
          if (e.key === 'Escape') { e.preventDefault(); onClose() }
        }}
        placeholder="할 일 입력..."
        className="flex-1 text-xs outline-none bg-transparent"
        style={{ color: '#ccc', caretColor: color }}
      />
      <button onClick={onClose} className="text-xs flex-shrink-0" style={{ color: '#333' }}>✕</button>
    </div>
  )
}

// ── 재사용 카드 컴포넌트 ──────────────────────────────────
function TaskCard({ task, proj, selectedIds, toggleTask, deleteTask, updateTask,
  handleTaskClick, handleTaskDragStart, draggingRef, showDate }) {
  const isSelected = selectedIds.has(task.id)
  const color = proj?.color ?? null

  const [editing, setEditing]   = useState(false)
  const [editText, setEditText] = useState(task.text)
  const inputRef     = useRef(null)
  const composingRef = useRef(false)
  const clickTimer   = useRef(null)

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])
  // task.text가 외부에서 바뀌면 editText 동기화
  useEffect(() => { if (!editing) setEditText(task.text) }, [task.text, editing])

  const commitEdit = () => {
    const trimmed = editText.trim()
    if (trimmed && trimmed !== task.text) updateTask(task.id, { text: trimmed })
    else setEditText(task.text)
    setEditing(false)
  }

  const handleClick = (e) => {
    if (editing) return
    // 더블클릭과 구분: 200ms 안에 두 번 클릭 오면 더블클릭으로 처리
    if (clickTimer.current) {
      clearTimeout(clickTimer.current)
      clickTimer.current = null
      setEditing(true)
      return
    }
    clickTimer.current = setTimeout(() => {
      clickTimer.current = null
      handleTaskClick(e, task)
    }, 200)
  }

  const dateLabel = showDate && task.date
    ? (() => {
        const d = new Date(task.date + 'T00:00:00')
        return `${d.getMonth()+1}/${d.getDate()}`
      })()
    : null

  return (
    <div
      data-taskid={task.id}
      draggable={!editing}
      onDragStart={e => !editing && handleTaskDragStart(e, task)}
      onDragEnd={() => { draggingRef.current = false }}
      className="group rounded px-3 py-2.5"
      style={{
        background: isSelected ? '#1a2535' : '#131313',
        border: `1px solid ${editing ? '#3a3a3a' : isSelected ? '#60a5fa55' : '#1e1e1e'}`,
        cursor: editing ? 'text' : 'grab',
        transition: 'background 0.05s, border-color 0.05s',
      }}
      onClick={handleClick}
      onMouseEnter={e => { if (!isSelected && !editing) e.currentTarget.style.borderColor = '#2e2e2e' }}
      onMouseLeave={e => { if (!isSelected && !editing) e.currentTarget.style.borderColor = '#1e1e1e' }}
    >
      <div className="flex items-center gap-2">
        {/* 프로젝트 컬러 바 */}
        {color && (
          <span className="w-0.5 self-stretch rounded-full flex-shrink-0" style={{ background: color, minHeight: 14 }} />
        )}

        {/* 체크박스 */}
        <button
          onClick={e => { e.stopPropagation(); if (!editing) toggleTask(task.id) }}
          className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center"
          style={{ border: `1.5px solid ${task.done ? '#555' : '#333'}`, background: task.done ? '#333' : 'transparent' }}
        >
          {task.done && (
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
              <path d="M2 5l2.5 2.5L8 3" stroke="#888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>

        {/* 텍스트 / 인라인 편집 */}
        {editing ? (
          <input
            ref={inputRef}
            value={editText}
            onChange={e => setEditText(e.target.value)}
            onCompositionStart={() => { composingRef.current = true }}
            onCompositionEnd={() => { composingRef.current = false }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !composingRef.current) { e.preventDefault(); commitEdit() }
              if (e.key === 'Escape') { setEditText(task.text); setEditing(false) }
            }}
            onBlur={commitEdit}
            onClick={e => e.stopPropagation()}
            className="flex-1 text-xs bg-transparent outline-none"
            style={{ color: '#efefef', caretColor: '#60a5fa', minWidth: 0 }}
          />
        ) : (
          <p className="flex-1 text-xs leading-snug truncate"
            style={{ color: task.done ? '#444' : isSelected ? '#aad4ff' : '#ccc', textDecoration: task.done ? 'line-through' : 'none' }}>
            {task.text}
          </p>
        )}

        {/* 날짜 (이번주 뷰) */}
        {!editing && dateLabel && (
          <span className="text-xs flex-shrink-0" style={{ color: '#555' }}>{dateLabel}</span>
        )}

        {/* 삭제 버튼 */}
        {!editing && (
          <button
            onClick={e => { e.stopPropagation(); deleteTask(task.id) }}
            className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-xs transition-opacity"
            style={{ color: '#444' }}
          >×</button>
        )}
      </div>
    </div>
  )
}
