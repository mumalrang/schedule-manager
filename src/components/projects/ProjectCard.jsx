import React from 'react'
import useStore from '../../store/useStore'

// 눈 아이콘 (보임/숨김)
function EyeIcon({ visible }) {
  return visible ? (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <path d="M1 7C1 7 3 3 7 3s6 4 6 4-2 4-6 4S1 7 1 7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      <circle cx="7" cy="7" r="1.8" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  ) : (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <path d="M1 7C1 7 3 3 7 3s6 4 6 4-2 4-6 4S1 7 1 7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" opacity="0.4"/>
      <line x1="2" y1="2" x2="12" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

export default function ProjectCard({ project, isHidden, onToggleHide }) {
  const { tasks, setPage } = useStore(s => ({
    tasks:   s.tasks,
    setPage: s.setPage,
  }))

  const projTasks = tasks.filter(t => t.projId === project.id)
  const total     = projTasks.length
  const done      = projTasks.filter(t => t.done).length
  const pct       = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div
      className="flex flex-col text-left rounded-lg overflow-hidden transition-all group relative"
      style={{ background: '#131313', border: '1px solid #1e1e1e' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#2e2e2e'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#1e1e1e'}
    >
      {/* Color bar */}
      <div className="h-1 w-full" style={{ background: project.color }} />

      {/* 눈 토글 버튼 */}
      <button
        onClick={e => { e.stopPropagation(); onToggleHide(project.id) }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded"
        style={{
          width: 22, height: 22,
          background: isHidden ? '#2a2a2a' : project.color + '22',
          color: isHidden ? '#555' : project.color,
          border: `1px solid ${isHidden ? '#333' : project.color + '44'}`,
          zIndex: 2,
        }}
        title={isHidden ? '타임라인에 표시' : '타임라인에서 숨기기'}
      >
        <EyeIcon visible={!isHidden} />
      </button>

      <button
        className="flex flex-col flex-1 text-left p-4 gap-3 w-full"
        onClick={() => setPage('project-detail', project.id)}
      >
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
      </button>
    </div>
  )
}
