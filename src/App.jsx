import React, { useState, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/dashboard/Dashboard'
import ProjectList from './components/projects/ProjectList'
import ProjectDetail from './components/projects/ProjectDetail'
import ResizeHandle from './components/ResizeHandle'
import DumpPanel from './components/dashboard/DumpPanel'
import useStore from './store/useStore'

const SIDEBAR_MIN = 160
const SIDEBAR_MAX = 320
const SIDEBAR_DEFAULT = 210

const DUMP_MIN = 180
const DUMP_MAX = 400
const DUMP_DEFAULT = 260

export default function App() {
  const currentPage = useStore(s => s.currentPage)
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT)
  const [dumpWidth,    setDumpWidth]    = useState(DUMP_DEFAULT)

  const onSidebarResize = useCallback((delta) => {
    setSidebarWidth(w => Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, w + delta)))
  }, [])

  const onDumpResize = useCallback((delta) => {
    setDumpWidth(w => Math.min(DUMP_MAX, Math.max(DUMP_MIN, w - delta)))
  }, [])

  return (
    <div className="flex h-full w-full overflow-hidden" style={{ background: '#0a0a0a' }}>
      <Sidebar width={sidebarWidth} />
      <ResizeHandle onResize={onSidebarResize} />
      <main className="flex-1 overflow-hidden">
        {currentPage === 'dashboard'      && <Dashboard />}
        {currentPage === 'projects'       && <ProjectList />}
        {currentPage === 'project-detail' && <ProjectDetail />}
      </main>
      <ResizeHandle onResize={onDumpResize} />
      <DumpPanel width={dumpWidth} />
    </div>
  )
}
