import React from 'react'
import useStore from '../../store/useStore'

export default function ProjectCard({ project }) {
  const { tasks, setPage } = useStore(s => ({
    tasks:   s.tasks,
    setPage: s.setPage,
  }))

  const projTasks = tasks.filter(t => t.projId === project.id)
  const total     = projTasks.length
  const done      = projTasks.filter(t => t.done).length
  const pct       = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <button
      onClick={() => setPage('project-detail', project.id)}
      className="flex flex-col text-left rounded-lg overflow-hidden transition-all group"
      style={{ background: '#131313', border: '1px solid #1e1e1e' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#2e2e2e'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#1e1e1e'}
    >
      {/* Color bar */}
      <div className="h-1 w-full" style={{ background: project.color }} />

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Title & desc */}
        <div>
          <h3 className="text-sm font-semibold" style={{ color: '#efefef' }}>{project.name}</h3>
          {project.desc && (
            <p className="text-xs mt-1 line-clamp-2" style={{ color: '#666' }}>{project.desc}</p>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between mt-auto">
          <span className="text-xs" style={{ color: '#555' }}>
            {total === 0 ? '할 일 없음' : `${done} / ${total} 완료`}
          </span>
          <span className="text-xs font-medium" style={{ color: pct === 100 ? '#34d399' : '#aaa' }}>
            {total > 0 ? `${pct}%` : ''}
          </span>
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div className="h-1 rounded-full overflow-hidden" style={{ background: '#222' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: project.color }}
            />
          </div>
        )}
      </div>
    </button>
  )
}
