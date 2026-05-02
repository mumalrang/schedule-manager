import React, { useState } from 'react'
import useStore from '../../store/useStore'

export default function TimeSettingsModal({ onClose }) {
  const { activeHours, setActiveHours } = useStore(s => ({
    activeHours:    s.activeHours,
    setActiveHours: s.setActiveHours,
  }))

  const [start, setStart] = useState(activeHours?.start ?? '06:00')
  const [end,   setEnd]   = useState(activeHours?.end   ?? '23:00')

  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
  const startMin     = toMin(start)
  const endMin       = toMin(end)
  const duration     = endMin > startMin ? endMin - startMin : 0
  const durationText = duration > 0
    ? `${Math.floor(duration / 60)}시간${duration % 60 > 0 ? ` ${duration % 60}분` : ''}`.trim()
    : '–'

  const handleSave = () => {
    setActiveHours({ start, end })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="rounded-lg shadow-2xl" style={{ background: '#1a1a1a', border: '1px solid #2e2e2e', width: 360 }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #222' }}>
          <h3 className="text-sm font-semibold" style={{ color: '#efefef' }}>시간 세팅</h3>
          <button onClick={onClose} className="text-lg leading-none" style={{ color: '#555' }}>×</button>
        </div>

        <div className="p-5 flex flex-col gap-4">
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
              <div className="absolute h-full rounded"
                style={{
                  left:  `${(startMin / 1440) * 100}%`,
                  width: `${Math.max(0, ((endMin - startMin) / 1440) * 100)}%`,
                  background: '#60a5fa',
                  opacity: 0.7,
                }} />
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
      </div>
    </div>
  )
}
