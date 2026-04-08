import React, { useState } from 'react'
import useStore from '../store/useStore'

const COLOR_OPTIONS = [
  '#60a5fa','#34d399','#fbbf24','#f87171','#a78bfa',
  '#fb923c','#38bdf8','#4ade80','#f472b6','#818cf8',
]

function AddProjectModal({ onClose }) {
  const addProject = useStore(s => s.addProject)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [color, setColor] = useState('#60a5fa')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    addProject({ name: name.trim(), desc: desc.trim(), color })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="rounded-lg p-5 w-80 shadow-xl" style={{ background: '#1a1a1a', border: '1px solid #2e2e2e' }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: '#efefef' }}>새 프로젝트</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs mb-1" style={{ color: '#aaa' }}>이름</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="프로젝트 이름"
              className="w-full px-3 py-2 rounded text-sm"
              style={{ background: '#131313', border: '1px solid #2e2e2e', color: '#efefef' }}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: '#aaa' }}>설명 (선택)</label>
            <input
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="프로젝트 설명"
              className="w-full px-3 py-2 rounded text-sm"
              style={{ background: '#131313', border: '1px solid #2e2e2e', color: '#efefef' }}
            />
          </div>
          <div>
            <label className="block text-xs mb-2" style={{ color: '#aaa' }}>색상</label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-6 h-6 rounded-full border-2 transition-all"
                  style={{ background: c, borderColor: color === c ? '#fff' : 'transparent' }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 mt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-3 py-2 rounded text-sm"
              style={{ background: '#222', color: '#aaa', border: '1px solid #2e2e2e' }}>
              취소
            </button>
            <button type="submit"
              className="flex-1 px-3 py-2 rounded text-sm font-medium"
              style={{ background: '#60a5fa', color: '#000' }}>
              추가
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Sidebar({ width = 210 }) {
  const { projects, currentPage, selectedProjectId, setPage, goBack, goForward, historyIndex, pageHistory, updateTask } = useStore(s => ({
    projects:          s.projects,
    currentPage:       s.currentPage,
    selectedProjectId: s.selectedProjectId,
    setPage:           s.setPage,
    goBack:            s.goBack,
    goForward:         s.goForward,
    historyIndex:      s.historyIndex,
    pageHistory:       s.pageHistory,
    updateTask:        s.updateTask,
  }))
  const canBack    = historyIndex > 0
  const canForward = historyIndex < (pageHistory?.length ?? 1) - 1
  const [dragOverProjectId, setDragOverProjectId] = useState(null)

  const isDumpDrag = (types) =>
    types.includes('dumptaskid') || types.includes('dumptaskids')

  const handleProjectDragOver = (e, projId) => {
    if (!isDumpDrag(e.dataTransfer.types)) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverProjectId(projId)
  }

  const handleProjectDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setDragOverProjectId(null)
  }

  const handleProjectDrop = (e, projId) => {
    e.preventDefault()
    setDragOverProjectId(null)
    const patch = { projId, milestoneId: null, date: null, startTime: null, endTime: null }
    const multiRaw = e.dataTransfer.getData('dumptaskids')
    if (multiRaw) {
      JSON.parse(multiRaw).forEach(id => updateTask(id, patch))
      return
    }
    const id = e.dataTransfer.getData('dumpTaskId') || e.dataTransfer.getData('dumptaskid')
    if (id) updateTask(id, patch)
  }
  const [showAddProject, setShowAddProject] = useState(false)

  const navItems = [
    { id: 'dashboard', label: '대시보드', icon: GridIcon },
    { id: 'projects',  label: '프로젝트', icon: FolderIcon },
  ]

  return (
    <>
      <aside
        className="flex flex-col h-full flex-shrink-0"
        style={{ width, background: '#0e0e0e' }}
      >
        {/* Logo + 뒤로/앞으로 */}
        <div className="px-4 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid #1e1e1e' }}>
          <span className="text-sm font-semibold tracking-tight flex-1" style={{ color: '#efefef' }}>
            Schedule
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#1a1a1a', color: '#666', fontSize: 10 }}>
            beta
          </span>
          <button
            onClick={goBack}
            disabled={!canBack}
            title="뒤로"
            className="flex items-center justify-center w-6 h-6 rounded transition-all"
            style={{
              background: canBack ? '#1a1a1a' : 'transparent',
              color:      canBack ? '#aaa'    : '#333',
              border:     `1px solid ${canBack ? '#2e2e2e' : 'transparent'}`,
              cursor:     canBack ? 'pointer' : 'default',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M6.5 2L3.5 5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={goForward}
            disabled={!canForward}
            title="앞으로"
            className="flex items-center justify-center w-6 h-6 rounded transition-all"
            style={{
              background: canForward ? '#1a1a1a' : 'transparent',
              color:      canForward ? '#aaa'    : '#333',
              border:     `1px solid ${canForward ? '#2e2e2e' : 'transparent'}`,
              cursor:     canForward ? 'pointer' : 'default',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M3.5 2L6.5 5l-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="px-3 pt-4 flex flex-col gap-0.5">
          {navItems.map(item => {
            const Icon = item.icon
            const active = currentPage === item.id || (item.id === 'projects' && currentPage === 'project-detail')
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className="flex items-center gap-2.5 px-3 py-2 rounded text-xs w-full text-left transition-all"
                style={{
                  background: active ? '#1e1e1e' : 'transparent',
                  color: active ? '#efefef' : '#666',
                }}
              >
                <Icon size={15} color={active ? '#efefef' : '#555'} />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Divider */}
        <div className="mx-4 my-3" style={{ borderTop: '1px solid #1e1e1e' }} />

        {/* Projects list */}
        <div className="px-3 flex flex-col gap-0.5 flex-1 overflow-y-auto">
          <p className="px-3 mb-1 text-xs font-medium uppercase tracking-widest" style={{ color: '#444', fontSize: 10 }}>
            프로젝트
          </p>
          {projects.map(p => (
            <button
              key={p.id}
              onClick={() => setPage('project-detail', p.id)}
              className="flex items-center gap-2.5 px-3 py-2 rounded text-xs w-full text-left transition-all"
              style={{
                background: currentPage === 'project-detail' && selectedProjectId === p.id ? '#1e1e1e' : 'transparent',
                color: currentPage === 'project-detail' && selectedProjectId === p.id ? '#efefef' : '#888',
              }}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
              <span className="truncate">{p.name}</span>
            </button>
          ))}
        </div>

        {/* Add project */}
        <div className="p-3" style={{ borderTop: '1px solid #1e1e1e' }}>
          <button
            onClick={() => setShowAddProject(true)}
            className="flex items-center gap-2 px-3 py-2 rounded text-xs w-full transition-all"
            style={{ background: '#1a1a1a', color: '#888', border: '1px solid #222' }}
          >
            <span style={{ fontSize: 16, lineHeight: 1, color: '#555', marginTop: -1 }}>+</span>
            새 프로젝트
          </button>
        </div>
      </aside>

      {showAddProject && <AddProjectModal onClose={() => setShowAddProject(false)} />}
    </>
  )
}

// ── Icons ──────────────────────────────────────────────────
function GridIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="1.5" fill={color} opacity="0.8"/>
      <rect x="9" y="1" width="6" height="6" rx="1.5" fill={color} opacity="0.8"/>
      <rect x="1" y="9" width="6" height="6" rx="1.5" fill={color} opacity="0.8"/>
      <rect x="9" y="9" width="6" height="6" rx="1.5" fill={color} opacity="0.8"/>
    </svg>
  )
}

function FolderIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M1 4.5C1 3.67 1.67 3 2.5 3H6l1.5 2H13.5C14.33 5 15 5.67 15 6.5v6c0 .83-.67 1.5-1.5 1.5h-11C1.67 14 1 13.33 1 12.5v-8z" fill={color} opacity="0.7"/>
    </svg>
  )
}
