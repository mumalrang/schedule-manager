import React, { useState } from 'react'
import ProjectCard from './ProjectCard'
import useStore from '../../store/useStore'

const COLOR_OPTIONS = [
  '#60a5fa','#34d399','#fbbf24','#f87171','#a78bfa',
  '#fb923c','#38bdf8','#4ade80','#f472b6','#818cf8',
]

function NewProjectCard() {
  const addProject = useStore(s => s.addProject)
  const [open,  setOpen]  = useState(false)
  const [name,  setName]  = useState('')
  const [desc,  setDesc]  = useState('')
  const [color, setColor] = useState('#60a5fa')

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex flex-col items-center justify-center rounded-lg h-36 transition-all"
        style={{ border: '1px dashed #222', color: '#444' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#666' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#222'; e.currentTarget.style.color = '#444' }}
      >
        <span className="text-2xl mb-1" style={{ lineHeight: 1 }}>+</span>
        <span className="text-xs">새 프로젝트</span>
      </button>
    )
  }

  const handleAdd = () => {
    if (!name.trim()) return
    addProject({ name: name.trim(), desc: desc.trim(), color })
    setName(''); setDesc(''); setColor('#60a5fa'); setOpen(false)
  }

  return (
    <div
      className="rounded-lg p-4 flex flex-col gap-3"
      style={{ border: '1px solid #2e2e2e', background: '#131313' }}
    >
      <input
        autoFocus
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="프로젝트 이름"
        className="w-full px-2 py-1.5 rounded text-sm"
        style={{ background: '#1a1a1a', border: '1px solid #2e2e2e', color: '#efefef' }}
        onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setOpen(false) }}
      />
      <input
        value={desc}
        onChange={e => setDesc(e.target.value)}
        placeholder="설명 (선택)"
        className="w-full px-2 py-1.5 rounded text-sm"
        style={{ background: '#1a1a1a', border: '1px solid #2e2e2e', color: '#efefef' }}
      />
      <div className="flex gap-1.5 flex-wrap">
        {COLOR_OPTIONS.map(c => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            className="w-5 h-5 rounded-full border-2 transition-all"
            style={{ background: c, borderColor: color === c ? '#fff' : 'transparent' }}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={() => setOpen(false)}
          className="flex-1 px-2 py-1.5 rounded text-xs"
          style={{ background: '#222', color: '#aaa' }}>취소</button>
        <button onClick={handleAdd}
          className="flex-1 px-2 py-1.5 rounded text-xs font-medium"
          style={{ background: '#60a5fa', color: '#000' }}>추가</button>
      </div>
    </div>
  )
}

export default function ProjectList() {
  const projects = useStore(s => s.projects)

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold" style={{ color: '#efefef' }}>프로젝트</h1>
        <p className="text-sm mt-1" style={{ color: '#555' }}>{projects.length}개의 프로젝트</p>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        {projects.map(p => (
          <ProjectCard key={p.id} project={p} />
        ))}
        <NewProjectCard />
      </div>
    </div>
  )
}
