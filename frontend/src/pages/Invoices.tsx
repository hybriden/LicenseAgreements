import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { reportsApi, agreementsApi } from '@/lib/api'
import { formatCurrency, formatDate, daysUntil } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Clock, CheckCircle, Receipt } from 'lucide-react'

export function Invoices() {
  const [days, setDays] = useState('30')
  const queryClient = useQueryClient()

  const { data: billing, isLoading } = useQuery({
    queryKey: ['reports', 'billing', days],
    queryFn: () => reportsApi.getBilling(parseInt(days)),
  })

  const markBilledMutation = useMutation({
    mutationFn: agreementsApi.markBilled,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'billing'] })
    },
  })

  const getBillingBadge = (nextBillingDate: string) => {
    const daysDiff = daysUntil(nextBillingDate)
    if (daysDiff < 0) {
      return <Badge variant="destructive">{Math.abs(daysDiff)} dager forfalt</Badge>
    }
    if (daysDiff === 0) {
      return <Badge variant="warning">I dag</Badge>
    }
    if (daysDiff <= 7) {
      return <Badge variant="warning">{daysDiff} dager</Badge>
    }
    return <Badge variant="secondary">{daysDiff} dager</Badge>
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Laster...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Faktura</h1>
          <p className="text-muted-foreground">Avtaler som må faktureres</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Vis neste</span>
          <Select
            value={days}
            onChange={(e) => setDays(e.target.value)}
            options={[
              { value: '7', label: '7 dager' },
              { value: '14', label: '14 dager' },
              { value: '30', label: '30 dager' },
              { value: '60', label: '60 dager' },
              { value: '90', label: '90 dager' },
            ]}
            className="w-32"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className={billing?.summary.overdueCount ? 'border-destructive' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Forfalt</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${billing?.summary.overdueCount ? 'text-destructive' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billing?.summary.overdueCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(billing?.summary.overdueTotal || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kommende</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billing?.summary.upcomingCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(billing?.summary.upcomingTotal || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total sum</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency((billing?.summary.overdueTotal || 0) + (billing?.summary.upcomingTotal || 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              {(billing?.summary.overdueCount || 0) + (billing?.summary.upcomingCount || 0)} avtaler
            </p>
          </CardContent>
        </Card>
      </div>

      {billing?.overdue && billing.overdue.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Forfalte fakturaer
            </CardTitle>
            <CardDescription>Disse avtalene har passert fakturadato</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kunde</TableHead>
                  <TableHead>Produkt/Lisens</TableHead>
                  <TableHead className="text-right">Sum</TableHead>
                  <TableHead>Fakturadato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Handling</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billing.overdue.map((agreement) => (
                  <TableRow key={agreement.id}>
                    <TableCell className="font-medium">
                      <Link to={`/customers/${agreement.customer?.id}`} className="hover:underline">
                        {agreement.customer?.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {agreement.productType?.name}
                      <Badge variant="outline" className="ml-2">
                        {agreement.productType?.category?.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(agreement.amount)}
                    </TableCell>
                    <TableCell>{formatDate(agreement.nextBillingDate)}</TableCell>
                    <TableCell>{getBillingBadge(agreement.nextBillingDate)}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => markBilledMutation.mutate(agreement.id)}
                        disabled={markBilledMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Fakturert
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Kommende fakturaer</CardTitle>
          <CardDescription>Avtaler som skal faktureres de neste {days} dagene</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kunde</TableHead>
                <TableHead>Produkt/Lisens</TableHead>
                <TableHead className="text-right">Sum</TableHead>
                <TableHead>Fakturadato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Handling</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {billing?.upcoming.map((agreement) => (
                <TableRow key={agreement.id}>
                  <TableCell className="font-medium">
                    <Link to={`/customers/${agreement.customer?.id}`} className="hover:underline">
                      {agreement.customer?.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {agreement.productType?.name}
                    <Badge variant="outline" className="ml-2">
                      {agreement.productType?.category?.name}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(agreement.amount)}
                  </TableCell>
                  <TableCell>{formatDate(agreement.nextBillingDate)}</TableCell>
                  <TableCell>{getBillingBadge(agreement.nextBillingDate)}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markBilledMutation.mutate(agreement.id)}
                      disabled={markBilledMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Fakturert
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!billing?.upcoming || billing.upcoming.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Ingen kommende fakturaer
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
