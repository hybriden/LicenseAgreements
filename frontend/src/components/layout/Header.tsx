import { useQuery } from '@tanstack/react-query'
import { usersApi } from '@/lib/api'
import { User, Menu } from 'lucide-react'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: usersApi.getMe,
  })

  const roleLabels: Record<string, string> = {
    admin: 'Administrator',
    editor: 'Redaktør',
    viewer: 'Leser',
  }

  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background px-4 sm:px-6 lg:px-8"
      role="banner"
    >
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 -ml-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Åpne meny"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Desktop spacer */}
      <div className="hidden lg:block" />

      {/* User info - Epinova clean style */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"
          aria-hidden="true"
        >
          <User className="h-4 w-4" />
        </div>
        <div className="text-sm hidden sm:block">
          <p className="font-normal text-foreground">{user?.displayName || user?.email || 'Bruker'}</p>
          <p className="text-xs text-muted-foreground">{roleLabels[user?.role || 'viewer'] || user?.role}</p>
        </div>
      </div>
    </header>
  )
}
