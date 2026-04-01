import React, { useState } from 'react'
import useStore from '../../store/useStore'

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

const COLOR_OPTIONS = [
  '#444444','#3b5e8c','#2d6b4f','#7a4a1e','#5a3472',
  '#555555','#1d4e6b','#3d5c2e','#6b2d2d','#3d3d6b',
]

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, '0')
  const m = i % 2 === 0 ? '00' : '30'
  return `${h}:${m}`
})

// 종료 시간용: 24:00 포함
const END_TIME_OPTIONS = [...TIME_OPTIONS, '24:00']

// ── 고정 시간 블록 탭 ──────────────────────────────────────
function FixedBlockTab({ onClose }) {
  const { fixedBlocks, addFixedBlock, deleteFixedBlock, updateFixedBlock } = useStore(s => ({
    fixedBlocks:       s.fixedBlocks,
    addFixedBlock:     s.addFixedBlock,
    deleteFixedBlock:  s.deleteFixedBlock,
    updateFixedBlock:  s.updateFixedBlock,
  }))

  const EMPTY = { name: '', days: [0,1,2,3,4], startTime: '09:00', endTime: '10:00', color: '#444444' }
  const [editingId, setEditingId] = useState(null) // null = 신규, string = 수정 중
  const [showForm,  setShowForm]  = useState(false)
  const [form, setForm] = useState(EMPTY)

  const toggleDay = (day) =>
    setForm(f => ({ ...f, days: f.days.includes(day) ? f.days.filter(d => d !== day) : [...f.days, day] }))

  const openNew = () => {
    setEditingId(null)
    setForm(EMPTY)
    setShowForm(true)
  }

  const openEdit = (block) => {
    setEditingId(block.id)
    setForm({ name: block.name, days: [...block.days], startTime: block.startTime, endTime: block.endTime, color: block.color })
    setShowForm(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim() || form.days.length === 0) return
    if (editingId) {
      updateFixedBlock(editingId, { ...form, name: form.name.trim() })
    } else {
      addFixedBlock({ ...form, name: form.name.trim() })
    }
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY)
  }

  // 폼 표시 중일 때
  if (showForm) return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <label className="block text-xs mb-1" style={{ color: '#aaa' }}>이름</label>
        <input
          autoFocus
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="예: 점심 시간, 회의 등"
          className="w-full px-3 py-2 rounded text-sm"
          style={{ background: '#131313', border: '1px solid #2e2e2e', color: '#efefef' }}
        />
      </div>

      <div>
        <label className="block text-xs mb-2" style={{ color: '#aaa' }}>반복 요일</label>
        <div className="flex gap-1.5">
          {DAY_LABELS.map((label, i) => (
            <button key={i} type="button" onClick={() => toggleDay(i)}
              className="w-8 h-8 rounded text-xs font-medium flex-shrink-0 transition-all"
              style={{
                background: form.days.includes(i) ? '#60a5fa' : '#222',
                color:      form.days.includes(i) ? '#000'    : '#666',
                border:     `1px solid ${form.days.includes(i) ? '#60a5fa' : '#333'}`,
              }}
            >{label}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs mb-2" style={{ color: '#aaa' }}>시간 범위</label>
        <div className="flex items-center gap-2">
          <input type="time" value={form.startTime}
            onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
            className="flex-1 px-2 py-2 rounded text-sm"
            style={{ background: '#131313', border: '1px solid #2e2e2e', color: '#efefef', colorScheme: 'dark' }} />
          <span style={{ color: '#555' }}>—</span>
          <input type="time" value={form.endTime}
            onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
            className="flex-1 px-2 py-2 rounded text-sm"
            style={{ background: '#131313', border: '1px solid #2e2e2e', color: '#efefef', colorScheme: 'dark' }} />
        </div>
      </div>

      <div>
        <label className="block text-xs mb-2" style={{ color: '#aaa' }}>색상</label>
        <div className="flex gap-2 flex-wrap">
          {COLOR_OPTIONS.map(c => (
            <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
              className="w-7 h-7 rounded border-2 transition-all"
              style={{ background: c, borderColor: form.color === c ? '#fff' : 'transparent' }} />
          ))}
        </div>
      </div>

      <div className="flex gap-2 mt-1">
        <button type="button" onClick={handleCancel}
          className="flex-1 px-3 py-2 rounded text-sm"
          style={{ background: '#222', color: '#aaa', border: '1px solid #2e2e2e' }}>
          취소
        </button>
        <button type="submit"
          className="flex-1 px-3 py-2 rounded text-sm font-medium"
          style={{ background: '#60a5fa', color: '#000' }}>
          {editingId ? '저장' : '추가'}
        </button>
      </div>
    </form>
  )

  // 목록 표시
  return (
    <div className="flex flex-col gap-3">
      {fixedBlocks.length === 0 ? (
        <p className="text-xs text-center py-4" style={{ color: '#444' }}>등록된 고정 시간 블록이 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
          {fixedBlocks.map(block => (
            <div key={block.id}
              className="flex items-center gap-2 px-3 py-2.5 rounded group"
              style={{ background: '#131313', border: '1px solid #222' }}
            >
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: block.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: '#ddd' }}>{block.name}</p>
                <p className="text-xs mt-0.5" style={{ color: '#555' }}>
                  {block.startTime}–{block.endTime} · {block.days.map(d => DAY_LABELS[d]).join(' ')}
                </p>
              </div>
              <button onClick={() => openEdit(block)}
                className="opacity-0 group-hover:opacity-100 px-2 py-1 rounded text-xs transition-opacity"
                style={{ background: '#222', color: '#888', border: '1px solid #333' }}>
                수정
              </button>
              <button onClick={() => deleteFixedBlock(block.id)}
                className="opacity-0 group-hover:opacity-100 px-2 py-1 rounded text-xs transition-opacity"
                style={{ background: '#2a1515', color: '#e05', border: '1px solid #3a1515' }}>
                삭제
              </button>
            </div>
          ))}
        </div>
      )}
      <button onClick={openNew}
        className="w-full py-2 rounded text-xs"
        style={{ background: '#131313', color: '#60a5fa', border: '1px solid #60a5fa33' }}>
        + 새 고정 시간 블록 추가
      </button>
      <button onClick={onClose}
        className="w-full py-2 rounded text-xs"
        style={{ background: '#1a1a1a', color: '#666', border: '1px solid #222' }}>
        닫기
      </button>
    </div>
  )
}

// ── 활동 시간 범위 탭 ──────────────────────────────────────
function ActiveHoursTab({ onClose }) {
  const { activeHours, setActiveHours } = useStore(s => ({
    activeHours:    s.activeHours,
    setActiveHours: s.setActiveHours,
  }))

  const [start, setStart] = useState(activeHours?.start ?? '06:00')
  const [end,   setEnd]   = useState(activeHours?.end   ?? '23:00')

  const handleSave = () => {
    setActiveHours({ start, end })
    onClose()
  }

  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
  const startMin  = toMin(start)
  const endMin    = toMin(end)
  const duration  = endMin > startMin ? endMin - startMin : 0
  const durationText = duration > 0
    ? `${Math.floor(duration / 60)}시간 ${duration % 60 > 0 ? `${duration % 60}분` : ''}`.trim()
    : '–'

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs leading-relaxed" style={{ color: '#666' }}>
        타임그리드에서 기본으로 표시할 하루 활동 시간 범위를 설정합니다.
        범위 밖의 시간도 스크롤하면 볼 수 있어요.
      </p>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="block text-xs mb-2" style={{ color: '#aaa' }}>시작 시간</label>
          <input type="time" value={start} onChange={e => setStart(e.target.value)}
            className="w-full px-2 py-2 rounded text-sm"
            style={{ background: '#131313', border: '1px solid #2e2e2e', color: '#efefef', colorScheme: 'dark' }} />
        </div>
        <span className="mt-5" style={{ color: '#555' }}>—</span>
        <div className="flex-1">
          <label className="block text-xs mb-2" style={{ color: '#aaa' }}>종료 시간</label>
          <input type="time" value={end === '24:00' ? '23:59' : end}
            onChange={e => setEnd(e.target.value)}
            className="w-full px-2 py-2 rounded text-sm"
            style={{ background: '#131313', border: '1px solid #2e2e2e', color: '#efefef', colorScheme: 'dark' }} />
        </div>
      </div>

      {/* 미리보기 바 */}
      <div>
        <div className="flex justify-between text-xs mb-1.5" style={{ color: '#555' }}>
          <span>00:00</span>
          <span style={{ color: '#888' }}>활동 시간: {durationText}</span>
          <span>24:00</span>
        </div>
        <div className="relative h-4 rounded overflow-hidden" style={{ background: '#222' }}>
          <div
            className="absolute h-full rounded"
            style={{
              left:  `${(startMin / 1440) * 100}%`,
              width: `${Math.max(0, ((endMin - startMin) / 1440) * 100)}%`,
              background: '#60a5fa',
              opacity: 0.7,
            }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1" style={{ color: '#555' }}>
          <span>{start}</span>
          <span>{end}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={onClose}
          className="flex-1 px-3 py-2 rounded text-sm"
          style={{ background: '#222', color: '#aaa', border: '1px solid #2e2e2e' }}>
          취소
        </button>
        <button onClick={handleSave}
          className="flex-1 px-3 py-2 rounded text-sm font-medium"
          style={{ background: '#60a5fa', color: '#000' }}>
          저장
        </button>
      </div>
    </div>
  )
}

// ── 메인 모달 ──────────────────────────────────────────────
const TABS = [
  { id: 'fixed',  label: '고정 시간 블록' },
  { id: 'active', label: '활동 시간 범위' },
]

export default function TimeSettingsModal({ onClose, defaultTab = 'fixed' }) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="rounded-lg shadow-2xl"
        style={{ background: '#1a1a1a', border: '1px solid #2e2e2e', width: 400 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-0">
          <h3 className="text-sm font-semibold" style={{ color: '#efefef' }}>시간 세팅</h3>
          <button onClick={onClose} className="text-lg leading-none" style={{ color: '#555' }}>×</button>
        </div>

        {/* Tabs */}
        <div className="flex px-5 mt-4 gap-0" style={{ borderBottom: '1px solid #222' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-3 py-2 text-xs font-medium relative"
              style={{
                color: activeTab === tab.id ? '#efefef' : '#555',
                background: 'transparent',
                borderBottom: activeTab === tab.id ? '2px solid #60a5fa' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-5">
          {activeTab === 'fixed'  && <FixedBlockTab  onClose={onClose} />}
          {activeTab === 'active' && <ActiveHoursTab onClose={onClose} />}
        </div>
      </div>
    </div>
  )
}
