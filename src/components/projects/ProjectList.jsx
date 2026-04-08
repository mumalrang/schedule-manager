import React, { useState, useRef, useEffect } from 'react'
import ProjectCard from './ProjectCard'
import useStore from '../../store/useStore'

const COLOR_OPTIONS = [
  '#60a5fa','#34d399','#fbbf24','#f87171','#a78bfa',
  '#fb923c','#38bdf8','#4ade80','#f472b6','#818cf8',
]

// ── 전체 프로젝트 마일스톤 타임라인 ────────────────────────────
function ProjectsTimeline({ projects, milestones, setPage, hiddenProjects }) {
  const containerRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const LABEL_W = 110

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(e => setContainerWidth(e[0].contentRect.width))
    ro.observe(containerRef.current)
    setContainerWidth(containerRef.current.offsetWidth)
    return () => ro.disconnect()
  }, [])

  // 마일스톤 없으면 숨김
  if (milestones.length === 0) return null

  const now = new Date(); now.setHours(0,0,0,0)
  const todayStr = now.toISOString().split('T')[0]

  // 숨긴 프로젝트 제외한 visible 프로젝트/마일스톤
  const visibleProjects   = projects.filter(p => !hiddenProjects.has(p.id))
  const visibleMilestones = milestones.filter(m => !hiddenProjects.has(m.projId))

  if (visibleMilestones.length === 0) {
    return (
      <div className="flex-shrink-0 rounded-lg flex items-center justify-center py-6 text-xs"
        style={{ background: '#0c0c0c', border: '1px solid #1e1e1e', color: '#333' }}>
        표시할 프로젝트가 없습니다
      </div>
    )
  }

  // 전체 날짜 범위 계산
  const allDates = visibleMilestones.flatMap(m => [
    new Date(m.startDate + 'T00:00:00').getTime(),
    new Date(m.endDate   + 'T00:00:00').getTime(),
  ])
  const minDate = new Date(Math.min(...allDates))
  const maxDate = new Date(Math.max(...allDates))
  minDate.setDate(minDate.getDate() - 3)
  maxDate.setDate(maxDate.getDate() + 3)

  const totalDays = Math.ceil((maxDate - minDate) / 86400000) + 1
  const chartW = containerWidth - LABEL_W
  const DAY_W  = chartW > 0 ? chartW / totalDays : 0

  const dateToX = (str) =>
    Math.ceil((new Date(str + 'T00:00:00') - minDate) / 86400000) * DAY_W

  const todayX = Math.ceil((now - minDate) / 86400000) * DAY_W

  // 날짜 레이블
  const spacing = Math.max(1, Math.ceil(56 / Math.max(DAY_W, 1)))
  const dateLabels = []
  for (let i = 0; i <= totalDays; i += spacing) {
    const d = new Date(minDate); d.setDate(minDate.getDate() + i)
    dateLabels.push({ x: i * DAY_W, label: `${d.getMonth()+1}/${d.getDate()}` })
  }

  const LANE_H   = 22
  const HEADER_H = 24

  // 프로젝트별 레인 배치 (숨긴 프로젝트 제외)
  const rows = visibleProjects.map(proj => {
    const pms = visibleMilestones.filter(m => m.projId === proj.id)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))

    const overlaps = (a, b) => a.startDate <= b.endDate && b.startDate <= a.endDate
    const lanes = []
    pms.forEach(ms => {
      let placed = false
      for (const lane of lanes) {
        if (!lane.some(m => overlaps(m, ms))) { lane.push(ms); placed = true; break }
      }
      if (!placed) lanes.push([ms])
    })
    return { proj, lanes }
  }).filter(r => r.lanes.length > 0)

  // 각 행의 누적 Y 계산
  let cumY = HEADER_H
  const rowYs = rows.map(r => {
    const y = cumY
    cumY += r.lanes.length * LANE_H + 8
    return y
  })
  const totalH = cumY

  return (
    <div
      ref={containerRef}
      className="flex-shrink-0 rounded-lg overflow-hidden"
      style={{ background: '#0c0c0c', border: '1px solid #1e1e1e' }}
    >
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <p className="text-xs font-semibold" style={{ color: '#555' }}>전체 프로젝트 타임라인</p>
        <p className="text-xs" style={{ color: '#333' }}>
          {new Date(minDate.getTime() + 3 * 86400000).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
          {' – '}
          {new Date(maxDate.getTime() - 3 * 86400000).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
        </p>
      </div>

      <div className="px-4 pb-3">
        <div className="flex" style={{ width: '100%' }}>
          {/* 프로젝트 레이블 열 */}
          <div style={{ width: LABEL_W, flexShrink: 0, position: 'relative', height: totalH }}>
            {rows.map(({ proj }, ri) => (
              <button
                key={proj.id}
                onClick={() => setPage('project-detail', proj.id)}
                className="absolute flex items-center gap-1.5 text-left w-full pr-2 transition-opacity hover:opacity-100"
                style={{
                  top:     rowYs[ri],
                  height:  rows[ri].lanes.length * LANE_H,
                  opacity: 0.75,
                }}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: proj.color }} />
                <span className="text-xs truncate" style={{ color: '#aaa', fontSize: 11 }}>{proj.name}</span>
              </button>
            ))}
          </div>

          {/* 차트 영역 */}
          <div style={{ flex: 1, position: 'relative', height: totalH, minWidth: 0 }}>
            {/* 날짜 헤더 */}
            {dateLabels.map(({ x, label }) => (
              <span key={x} className="absolute select-none"
                style={{ left: x + 2, top: 0, color: '#444', fontSize: 10 }}>{label}</span>
            ))}
            {/* 수직 눈금선 */}
            {Array.from({ length: totalDays + 1 }, (_, i) => (
              <div key={i} className="absolute"
                style={{ left: i * DAY_W, top: 0, bottom: 0, borderLeft: '1px solid #181818' }} />
            ))}
            {/* 오늘 라인 */}
            {todayX >= 0 && todayX <= chartW && (
              <div className="absolute" style={{ left: todayX, top: 0, bottom: 0, borderLeft: '2px solid #ef4444', zIndex: 10 }}>
                <span className="absolute text-xs" style={{ top: 0, left: 3, color: '#ef4444', fontSize: 9 }}>오늘</span>
              </div>
            )}
            {/* 마일스톤 바 */}
            {rows.map(({ proj, lanes }, ri) =>
              lanes.map((lane, li) =>
                lane.map(ms => {
                  const x = dateToX(ms.startDate)
                  const w = dateToX(ms.endDate) + DAY_W - x - 4
                  const isPast = ms.endDate < todayStr
                  return (
                    <button
                      key={ms.id}
                      onClick={() => setPage('project-detail', proj.id)}
                      title={`${ms.name}\n${ms.startDate} – ${ms.endDate}`}
                      className="absolute rounded text-xs truncate px-1.5 transition-opacity hover:opacity-100"
                      style={{
                        left:       x + 2,
                        width:      Math.max(w, 16),
                        top:        rowYs[ri] + li * LANE_H + 2,
                        height:     LANE_H - 4,
                        background: isPast ? proj.color + '14' : proj.color + '28',
                        border:     `1px solid ${isPast ? proj.color + '22' : proj.color + '55'}`,
                        color:      isPast ? proj.color + '66' : proj.color + 'cc',
                        opacity:    0.9,
                        zIndex: 5,
                        lineHeight: `${LANE_H - 4}px`,
                      }}
                    >
                      {ms.name}
                    </button>
                  )
                })
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

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
  const projects   = useStore(s => s.projects)
  const milestones = useStore(s => s.milestones)
  const setPage    = useStore(s => s.setPage)
  const [showTimeline,  setShowTimeline]  = useState(true)
  const [hiddenProjects, setHiddenProjects] = useState(new Set())

  const toggleHideProject = (projId) => {
    setHiddenProjects(prev => {
      const next = new Set(prev)
      next.has(projId) ? next.delete(projId) : next.add(projId)
      return next
    })
  }

  return (
    <div className="h-full overflow-y-auto p-6 flex flex-col gap-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: '#efefef' }}>프로젝트</h1>
          <p className="text-sm mt-1" style={{ color: '#555' }}>{projects.length}개의 프로젝트</p>
        </div>
        <button
          onClick={() => setShowTimeline(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-all"
          style={{
            background: showTimeline ? '#1a2a1a' : '#1a1a1a',
            color:      showTimeline ? '#34d399' : '#555',
            border:     `1px solid ${showTimeline ? '#34d39933' : '#2a2a2a'}`,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="1" y="2" width="5" height="2" rx="1" fill="currentColor"/>
            <rect x="1" y="5" width="9" height="2" rx="1" fill="currentColor" opacity="0.6"/>
            <rect x="1" y="8" width="7" height="2" rx="1" fill="currentColor" opacity="0.3"/>
          </svg>
          타임라인
        </button>
      </div>

      {/* 전체 마일스톤 타임라인 */}
      {showTimeline && (
        <ProjectsTimeline
          projects={projects}
          milestones={milestones}
          setPage={setPage}
          hiddenProjects={hiddenProjects}
        />
      )}

      {/* 프로젝트 카드 그리드 */}
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        {projects.map(p => (
          <ProjectCard
            key={p.id}
            project={p}
            isHidden={hiddenProjects.has(p.id)}
            onToggleHide={toggleHideProject}
          />
        ))}
        <NewProjectCard />
      </div>
    </div>
  )
}
