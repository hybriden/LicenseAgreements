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
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-white/10">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M4 6h10v4H4z" />
            <path d="M14 10v8" />
            <circle cx="18" cy="8" r="2" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Epinova</h1>
          <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Lisenser</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto" aria-label="Hovedmeny">
        <p
          className="px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider"
          id="nav-menu-label"
        >
          Meny
        </p>
        <ul className="space-y-1" role="list" aria-labelledby="nav-menu-label">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
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
        <div className="rounded-xl bg-slate-800/50 p-4">
          <p className="text-sm font-semibold text-slate-200">Epinova AS</p>
          <p className="text-xs text-slate-400 mt-1">License Management System</p>
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
      {/* Desktop Sidebar */}
      <aside
        className="fixed left-0 top-0 z-40 h-screen w-64 bg-slate-900 text-white hidden lg:flex lg:flex-col"
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

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-72 bg-slate-900 text-white flex flex-col lg:hidden',
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
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          aria-label="Lukk meny"
        >
          <X className="h-5 w-5" />
        </button>

        <SidebarContent onNavigate={onClose} />
      </aside>
    </>
  )
}

