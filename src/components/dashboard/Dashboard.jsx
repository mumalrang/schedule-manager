import React, { useState } from 'react'
import LeftPanel from './LeftPanel'
import CenterPanel from './CenterPanel'
import RightPanel from './RightPanel'
import AddTaskModal from '../modals/AddTaskModal'
import AddFixedBlockModal from '../modals/AddFixedBlockModal'
import useStore from '../../store/useStore'

export default function Dashboard() {
  const selectedDate = useStore(s => s.selectedDate)

  const [taskModal,       setTaskModal]       = useState(null) // null | { defaultDate, defaultStart, defaultEnd, defaultProjId }
  const [fixedBlockModal, setFixedBlockModal] = useState(false)

  const handleRequestAddTask = (defaults = {}) => {
    setTaskModal({ defaultDate: selectedDate, ...defaults })
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Top action bar */}
      <div
        className="absolute top-0 right-0 z-10 flex gap-2 px-4 py-3"
        style={{ borderBottom: '0' }}
      >
        <button
          onClick={() => setFixedBlockModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs"
          style={{ background: '#1a1a1a', color: '#aaa', border: '1px solid #222' }}
        >
          <span style={{ fontSize: 14, lineHeight: 1, marginTop: -1 }}>⏱</span>
          고정 시간 추가
        </button>
        <button
          onClick={() => handleRequestAddTask()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium"
          style={{ background: '#60a5fa', color: '#000' }}
        >
          + 할 일
        </button>
      </div>

      {/* Left panel */}
      <div style={{ borderRight: '1px solid #1e1e1e' }}>
        <LeftPanel />
      </div>

      {/* Center panel */}
      <CenterPanel onRequestAddTask={handleRequestAddTask} />

      {/* Right panel */}
      <div style={{ borderLeft: '1px solid #1e1e1e' }}>
        <RightPanel onRequestAddTask={handleRequestAddTask} />
      </div>

      {/* Modals */}
      {taskModal && (
        <AddTaskModal
          {...taskModal}
          onClose={() => setTaskModal(null)}
        />
      )}
      {fixedBlockModal && (
        <AddFixedBlockModal onClose={() => setFixedBlockModal(false)} />
      )}
    </div>
  )
}
