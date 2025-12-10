import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Package,
  Key,
  FileText,
  Receipt,
  Settings,
  UserCog,
  X,
} from 'lucide-react'
import { useEffect } from 'react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', description: 'Oversikt og statistikk' },
  { to: '/customers', icon: Users, label: 'Kunder', description: 'Administrer kunder' },
  { to: '/products', icon: Package, label: 'Produkter', description: 'Produkter og kategorier' },
  { to: '/licenses', icon: Key, label: 'Lisenser', description: 'Lisensavtaler' },
  { to: '/reports', icon: FileText, label: 'Rapport', description: 'Rapporter og analyser' },
  { to: '/invoices', icon: Receipt, label: 'Faktura', description: 'Fakturaer og oppfølging' },
  { to: '/users', icon: UserCog, label: 'Brukere', description: 'Brukeradministrasjon' },
  { to: '/settings', icon: Settings, label: 'Innstillinger', description: 'Systeminnstillinger' },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      {/* Logo - Epinova style with E icon */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-white/10">
        <div
          className="flex h-10 w-10 items-center justify-center"
          aria-hidden="true"
        >
          {/* Epinova-style E logo */}
          <svg
            viewBox="0 0 40 40"
            fill="none"
            className="h-10 w-10"
          >
            <rect width="40" height="40" fill="transparent" />
            <path
              d="M8 8h24v4H12v8h16v4H12v8h20v4H8V8z"
              fill="currentColor"
              className="text-white"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-light tracking-tight text-white">Epinova</h1>
          <p className="text-[11px] text-white/60 uppercase tracking-wider font-normal">Lisenser</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto" aria-label="Hovedmeny">
        <p
          className="px-3 py-2 text-[11px] font-medium text-white/50 uppercase tracking-wider"
          id="nav-menu-label"
        >
          Meny
        </p>
        <ul className="space-y-0.5" role="list" aria-labelledby="nav-menu-label">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-normal transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  )
                }
                aria-label={item.description}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-white/10">
        <div className="rounded-md bg-white/10 p-4">
          <p className="text-sm font-normal text-white">Epinova AS</p>
          <p className="text-xs text-white/60 mt-1">License Management System</p>
        </div>
      </div>
    </>
  )
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation()

  // Close sidebar on route change (mobile)
  useEffect(() => {
    onClose()
  }, [location.pathname, onClose])

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      {/* Desktop Sidebar - Epinova teal */}
      <aside
        className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar text-white hidden lg:flex lg:flex-col"
        role="navigation"
        aria-label="Hovednavigasjon"
      >
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar - Epinova teal */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-72 bg-sidebar text-white flex flex-col lg:hidden',
          'transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        role="navigation"
        aria-label="Hovednavigasjon"
        aria-hidden={!isOpen}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-md text-white/60 hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          aria-label="Lukk meny"
        >
          <X className="h-5 w-5" />
        </button>

        <SidebarContent onNavigate={onClose} />
      </aside>
    </>
  )
}
