import { Outlet } from 'react-router-dom'
import { useState, useCallback } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false)
  }, [])

  const handleOpenSidebar = useCallback(() => {
    setSidebarOpen(true)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Skip link for keyboard navigation - WCAG 2.1 */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Hopp til hovedinnhold
      </a>

      <Sidebar isOpen={sidebarOpen} onClose={handleCloseSidebar} />

      <div className="lg:pl-64">
        <Header onMenuClick={handleOpenSidebar} />
        <main
          id="main-content"
          className="p-4 sm:p-6 lg:p-8"
          role="main"
          tabIndex={-1}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
