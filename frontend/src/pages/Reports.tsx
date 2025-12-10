import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Download, TrendingUp, PieChart } from 'lucide-react'

export function Reports() {
  const { data: revenue, isLoading } = useQuery({
    queryKey: ['reports', 'revenue'],
    queryFn: reportsApi.getRevenue,
  })

  const handleExportAgreements = () => {
    window.open(reportsApi.exportAgreements(), '_blank')
  }

  const handleExportCustomers = () => {
    window.open(reportsApi.exportCustomers(), '_blank')
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Laster...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rapport</h1>
          <p className="text-muted-foreground">Omsetning og statistikk</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCustomers}>
            <Download className="h-4 w-4" />
            Eksporter kunder
          </Button>
          <Button variant="outline" onClick={handleExportAgreements}>
            <Download className="h-4 w-4" />
            Eksporter avtaler
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Årlig omsetning totalt</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(revenue?.summary.totalAnnualRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {revenue?.summary.totalAgreements || 0} aktive avtaler
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produkter</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                revenue?.byCategory.find((c) => c.name === 'Produkt')?.totalRevenue || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {revenue?.byCategory.find((c) => c.name === 'Produkt')?.agreementCount || 0} avtaler
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lisenser</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                revenue?.byCategory.find((c) => c.name === 'Lisens')?.totalRevenue || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {revenue?.byCategory.find((c) => c.name === 'Lisens')?.agreementCount || 0} avtaler
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Omsetning per kategori</CardTitle>
            <CardDescription>Årlig omsetning fordelt på kategorier</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Avtaler</TableHead>
                  <TableHead className="text-right">Årlig omsetning</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenue?.byCategory.map((category) => (
                  <TableRow key={category.name}>
                    <TableCell className="font-medium">
                      <Badge variant="outline">{category.name}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{category.agreementCount}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(category.totalRevenue)}
                    </TableCell>
                  </TableRow>
                ))}
                {(!revenue?.byCategory || revenue.byCategory.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Ingen data
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Topp produkter/lisenser</CardTitle>
            <CardDescription>Rangert etter årlig omsetning</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Navn</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Omsetning</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenue?.byProductType.slice(0, 10).map((product) => (
                  <TableRow key={product.name}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{product.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(product.totalRevenue)}
                    </TableCell>
                  </TableRow>
                ))}
                {(!revenue?.byProductType || revenue.byProductType.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Ingen data
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
