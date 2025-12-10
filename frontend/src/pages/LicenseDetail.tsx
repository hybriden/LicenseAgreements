import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { productTypesApi } from '@/lib/api'
import { formatCurrency, formatDate, daysUntil } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Users, TrendingUp } from 'lucide-react'

export function LicenseDetail() {
  const { id } = useParams<{ id: string }>()
  const licenseId = parseInt(id!)

  const { data: license, isLoading } = useQuery({
    queryKey: ['productType', licenseId],
    queryFn: () => productTypesApi.getOne(licenseId),
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Laster...</div>
  }

  if (!license) {
    return <div className="flex items-center justify-center h-64">Lisens ikke funnet</div>
  }

  const getBillingBadge = (nextBillingDate: string) => {
    const days = daysUntil(nextBillingDate)
    if (days < 0) return <Badge variant="destructive">Forfalt</Badge>
    if (days <= 30) return <Badge variant="warning">{days} dager</Badge>
    return <Badge variant="secondary">{formatDate(nextBillingDate)}</Badge>
  }

  const activeAgreements = license.agreements?.filter((a) => a.isActive) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/licenses">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{license.name}</h1>
          <p className="text-muted-foreground">
            <Badge variant="outline">{license.category?.name}</Badge>
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totalt kunder</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{license.summary?.totalCustomers || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Årlig omsetning</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(license.summary?.totalRevenue || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Standard intervall</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{license.defaultBillingIntervalMonths} mnd</div>
          </CardContent>
        </Card>
      </div>

      {license.description && (
        <Card>
          <CardHeader>
            <CardTitle>Beskrivelse</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{license.description}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Kunder med denne lisensen</CardTitle>
          <CardDescription>
            Oversikt over alle kunder som har {license.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kunde</TableHead>
                <TableHead className="text-right">Sum</TableHead>
                <TableHead>Intervall</TableHead>
                <TableHead>Fra dato</TableHead>
                <TableHead>Til dato</TableHead>
                <TableHead>Neste faktura</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeAgreements.map((agreement) => (
                <TableRow key={agreement.id}>
                  <TableCell className="font-medium">
                    <Link
                      to={`/customers/${agreement.customer?.id}`}
                      className="hover:underline"
                    >
                      {agreement.customer?.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(agreement.amount)}
                  </TableCell>
                  <TableCell>{agreement.billingIntervalMonths} mnd</TableCell>
                  <TableCell>{formatDate(agreement.startDate)}</TableCell>
                  <TableCell>{agreement.endDate ? formatDate(agreement.endDate) : '-'}</TableCell>
                  <TableCell>{getBillingBadge(agreement.nextBillingDate)}</TableCell>
                </TableRow>
              ))}
              {activeAgreements.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Ingen kunder har denne lisensen ennå
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
