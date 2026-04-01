import React from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/dashboard/Dashboard'
import ProjectList from './components/projects/ProjectList'
import ProjectDetail from './components/projects/ProjectDetail'
import useStore from './store/useStore'

export default function App() {
  const currentPage = useStore(s => s.currentPage)

  return (
    <div className="flex h-full w-full overflow-hidden" style={{ background: '#0a0a0a' }}>
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        {currentPage === 'dashboard'       && <Dashboard />}
        {currentPage === 'projects'        && <ProjectList />}
        {currentPage === 'project-detail'  && <ProjectDetail />}
      </main>
    </div>
  )
}
