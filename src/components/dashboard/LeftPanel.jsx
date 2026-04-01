import React from 'react'
import MiniCalendar from './MiniCalendar'
import useStore from '../../store/useStore'

export default function LeftPanel() {
  const { tasks, projects, fixedBlocks, selectedDate, deleteFixedBlock } = useStore(s => ({
    tasks:           s.tasks,
    projects:        s.projects,
    fixedBlocks:     s.fixedBlocks,
    selectedDate:    s.selectedDate,
    deleteFixedBlock: s.deleteFixedBlock,
  }))

  // Progress per project for selected date
  const projectProgress = projects.map(proj => {
    const dayTasks = tasks.filter(t => t.projId === proj.id && t.date === selectedDate)
    const total    = dayTasks.length
    const done     = dayTasks.filter(t => t.done).length
    return { proj, total, done }
  }).filter(p => p.total > 0)

  const DAY_LABELS = ['월','화','수','목','금','토','일']

  return (
    <div
      className="flex flex-col gap-4 h-full overflow-y-auto py-4 px-3"
      style={{ width: 260, flexShrink: 0 }}
    >
      {/* Mini Calendar */}
      <section
        className="rounded-lg p-3"
        style={{ background: '#131313', border: '1px solid #1e1e1e' }}
      >
        <MiniCalendar />
      </section>

      {/* Project progress */}
      {projectProgress.length > 0 && (
        <section
          className="rounded-lg p-3"
          style={{ background: '#131313', border: '1px solid #1e1e1e' }}
        >
          <p className="text-xs font-medium mb-3" style={{ color: '#aaa' }}>오늘 진행률</p>
          <div className="flex flex-col gap-3">
            {projectProgress.map(({ proj, total, done }) => {
              const pct = total > 0 ? Math.round((done / total) * 100) : 0
              return (
                <div key={proj.id}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: proj.color }} />
                      <span className="text-xs truncate" style={{ color: '#ccc', maxWidth: 130 }}>{proj.name}</span>
                    </div>
                    <span className="text-xs" style={{ color: '#555' }}>{done}/{total}</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: '#222' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: proj.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Fixed blocks list */}
      <section
        className="rounded-lg p-3"
        style={{ background: '#131313', border: '1px solid #1e1e1e' }}
      >
        <p className="text-xs font-medium mb-3" style={{ color: '#aaa' }}>고정 시간 블록</p>
        {fixedBlocks.length === 0 ? (
          <p className="text-xs" style={{ color: '#444' }}>등록된 블록이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {fixedBlocks.map(fb => (
              <div
                key={fb.id}
                className="flex items-start justify-between gap-2 group"
              >
                <div className="flex items-start gap-2 min-w-0">
                  <span
                    className="w-2 h-2 rounded-sm mt-0.5 flex-shrink-0"
                    style={{ background: fb.color }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: '#ccc' }}>{fb.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#555', fontSize: 10 }}>
                      {fb.startTime} – {fb.endTime}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#444', fontSize: 10 }}>
                      {fb.days.map(d => DAY_LABELS[d]).join(' ')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => deleteFixedBlock(fb.id)}
                  className="opacity-0 group-hover:opacity-100 text-xs flex-shrink-0 transition-opacity"
                  style={{ color: '#555' }}
                  title="삭제"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
