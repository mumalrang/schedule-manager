import React, { useState, useCallback } from 'react'
import LeftPanel from './LeftPanel'
import CenterPanel from './CenterPanel'
import DumpPanel from './DumpPanel'
import AddTaskModal from '../modals/AddTaskModal'
import TimeSettingsModal from '../modals/TimeSettingsModal'
import ResizeHandle from '../ResizeHandle'
import useStore from '../../store/useStore'

const LEFT_MIN  = 180
const LEFT_MAX  = 400
const RIGHT_MIN = 180
const RIGHT_MAX = 400
const LEFT_DEFAULT  = 260
const RIGHT_DEFAULT = 260

export default function Dashboard() {
  const selectedDate = useStore(s => s.selectedDate)

  const [taskModal,         setTaskModal]         = useState(null)
  const [timeSettingsModal, setTimeSettingsModal] = useState(false)
  const [leftWidth,         setLeftWidth]         = useState(LEFT_DEFAULT)
  const [rightWidth,        setRightWidth]        = useState(RIGHT_DEFAULT)

  const handleRequestAddTask = (defaults = {}) => {
    setTaskModal({ defaultDate: selectedDate, ...defaults })
  }

  const onLeftResize  = useCallback((delta) => {
    setLeftWidth(w  => Math.min(LEFT_MAX,  Math.max(LEFT_MIN,  w + delta)))
  }, [])
  const onRightResize = useCallback((delta) => {
    setRightWidth(w => Math.min(RIGHT_MAX, Math.max(RIGHT_MIN, w - delta)))
  }, [])

  return (
    <div className="flex h-full overflow-hidden">
      {/* Top action bar */}
      <div
        className="absolute top-0 right-0 z-10 flex gap-2 px-4 py-3"
      >
        <button
          onClick={() => setTimeSettingsModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs"
          style={{ background: '#1a1a1a', color: '#aaa', border: '1px solid #222' }}
        >
          <span style={{ fontSize: 13 }}>⚙️</span>
          시간 세팅
        </button>
        <button
          onClick={() => handleRequestAddTask()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium"
          style={{ background: '#60a5fa', color: '#000' }}
        >
          + 할 일
        </button>
      </div>

      {/* Panels */}
      <div className="flex flex-1 overflow-hidden" style={{ paddingTop: 0 }}>
        <LeftPanel width={leftWidth} />

        <ResizeHandle onResize={onLeftResize} />

        <CenterPanel onRequestAddTask={handleRequestAddTask} />

        <ResizeHandle onResize={onRightResize} />

        <DumpPanel width={rightWidth} />
      </div>

      {/* Modals */}
      {taskModal && (
        <AddTaskModal {...taskModal} onClose={() => setTaskModal(null)} />
      )}
      {timeSettingsModal && (
        <TimeSettingsModal onClose={() => setTimeSettingsModal(false)} />
      )}
    </div>
  )
}
