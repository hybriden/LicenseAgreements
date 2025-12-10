import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { Users, FileText, AlertTriangle, TrendingUp, Clock, ArrowUpRight, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'

interface StatCardProps {
  to?: string
  title: string
  value: string | number
  subtitle: string
  icon: React.ReactNode
  gradient: string
  shadowColor: string
}

function StatCard({ to, title, value, subtitle, icon, gradient, shadowColor }: StatCardProps) {
  const content = (
    <div
      className={`relative overflow-hidden rounded-2xl ${gradient} p-5 sm:p-6 text-white shadow-lg ${shadowColor} transition-all duration-300 hover:shadow-xl hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-background`}
      role="article"
      aria-label={`${title}: ${value}`}
    >
      {/* Decorative background */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />

      <div className="relative">
        <div className="flex items-center justify-between">
          <div
            className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm"
            aria-hidden="true"
          >
            {icon}
          </div>
          {to && (
            <ArrowUpRight className="h-5 w-5 opacity-0 transition-all group-hover:opacity-100" aria-hidden="true" />
          )}
        </div>
        <div className="mt-3 sm:mt-4">
          <p className="text-xs sm:text-sm font-medium text-white/90">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold mt-1 tabular-nums">{value}</p>
        </div>
        <p className="text-xs sm:text-sm text-white/75 mt-2 truncate">{subtitle}</p>
      </div>
    </div>
  )

  if (to) {
    return (
      <Link to={to} className="group block focus:outline-none">
        {content}
      </Link>
    )
  }

  return content
}

export function Dashboard() {
  const { data: stats, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: reportsApi.getDashboard,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-label="Laster dashboard">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden="true" />
          <span>Laster dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Oversikt over lisenser og avtaler</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg px-3 py-2 hover:bg-muted disabled:opacity-50 self-start sm:self-auto"
          aria-label={isFetching ? 'Oppdaterer...' : 'Oppdater dashboard'}
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
          <span>{isFetching ? 'Oppdaterer...' : 'Oppdater'}</span>
        </button>
      </header>

      {/* Stats Grid */}
      <section aria-label="Statistikk">
        <h2 className="sr-only">Nøkkeltall</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            to="/customers"
            title="Kunder"
            value={stats?.customers.total || 0}
            subtitle="Se alle kunder"
            icon={<Users className="h-6 w-6" />}
            gradient="bg-gradient-to-br from-blue-600 to-blue-700"
            shadowColor="shadow-blue-600/25 hover:shadow-blue-600/35"
          />

          <StatCard
            title="Aktive avtaler"
            value={stats?.agreements.total || 0}
            subtitle={`${stats?.productTypes.total || 0} produkttyper`}
            icon={<FileText className="h-6 w-6" />}
            gradient="bg-gradient-to-br from-emerald-600 to-emerald-700"
            shadowColor="shadow-emerald-600/25"
          />

          <StatCard
            to="/reports"
            title="Årlig omsetning"
            value={formatCurrency(stats?.agreements.totalAnnualRevenue || 0)}
            subtitle="Se rapport"
            icon={<TrendingUp className="h-6 w-6" />}
            gradient="bg-gradient-to-br from-violet-600 to-violet-700"
            shadowColor="shadow-violet-600/25 hover:shadow-violet-600/35"
          />

          <StatCard
            to="/invoices"
            title="Kommende fakturaer"
            value={stats?.billing.upcoming || 0}
            subtitle={`${formatCurrency(stats?.billing.upcomingTotal || 0)} neste 30 dager`}
            icon={<Clock className="h-6 w-6" />}
            gradient="bg-gradient-to-br from-amber-600 to-orange-600"
            shadowColor="shadow-amber-600/25 hover:shadow-amber-600/35"
          />
        </div>
      </section>

      {/* Overdue Alert */}
      {(stats?.billing.overdue ?? 0) > 0 && (
        <section
          aria-label="Varsler"
          role="alert"
          className="rounded-2xl bg-gradient-to-r from-red-50 to-red-50/50 border-2 border-red-200 p-4 sm:p-6"
        >
          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
            <div
              className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-red-100 text-red-700 flex-shrink-0"
              aria-hidden="true"
            >
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-red-800">Forfalte fakturaer</h3>
              <p className="text-sm sm:text-base text-red-700 mt-1">
                <strong>{stats?.billing.overdue}</strong> avtaler med forfalt fakturadato.
                Totalt <strong>{formatCurrency(stats?.billing.overdueTotal || 0)}</strong>.
              </p>
              <Link
                to="/invoices"
                className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-red-800 hover:text-red-900 underline underline-offset-4 decoration-red-300 hover:decoration-red-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 rounded"
              >
                Se forfalte fakturaer
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section aria-label="Hurtighandlinger og informasjon">
        <h2 className="sr-only">Hurtighandlinger og systeminformasjon</h2>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-2xl border bg-card p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Hurtighandlinger</h3>
            <nav className="mt-4 space-y-1" aria-label="Hurtighandlinger">
              <Link
                to="/customers"
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors rounded-lg px-3 py-2.5 -mx-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="h-2 w-2 rounded-full bg-blue-600" aria-hidden="true" />
                Legg til ny kunde
              </Link>
              <Link
                to="/products"
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors rounded-lg px-3 py-2.5 -mx-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-600" aria-hidden="true" />
                Opprett nytt produkt
              </Link>
              <Link
                to="/licenses"
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors rounded-lg px-3 py-2.5 -mx-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="h-2 w-2 rounded-full bg-violet-600" aria-hidden="true" />
                Registrer ny lisens
              </Link>
            </nav>
          </article>

          <article className="rounded-2xl border bg-card p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Kategorier</h3>
            <dl className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-muted-foreground">Produkter</dt>
                <dd className="text-sm font-semibold text-foreground tabular-nums">
                  {stats?.categories.total ? Math.floor(stats.categories.total / 2) : 0}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-muted-foreground">Lisenser</dt>
                <dd className="text-sm font-semibold text-foreground tabular-nums">
                  {stats?.categories.total ? Math.ceil(stats.categories.total / 2) : 0}
                </dd>
              </div>
            </dl>
          </article>

          <article className="rounded-2xl border bg-card p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">System</h3>
            <dl className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-muted-foreground">Status</dt>
                <dd className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <span
                    className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"
                    aria-hidden="true"
                  />
                  <span>Aktiv</span>
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-muted-foreground">Valuta</dt>
                <dd className="text-sm font-semibold text-foreground">{stats?.currency || 'NOK'}</dd>
              </div>
            </dl>
          </article>
        </div>
      </section>
    </div>
  )
}
