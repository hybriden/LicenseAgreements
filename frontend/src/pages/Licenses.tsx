import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { productTypesApi, categoriesApi, type ProductType } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Eye, Pencil, Trash2, Key } from 'lucide-react'

export function Licenses() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLicense, setEditingLicense] = useState<ProductType | null>(null)
  const queryClient = useQueryClient()

  const { data: licenses, isLoading } = useQuery({
    queryKey: ['productTypes', 'Lisens'],
    queryFn: () => productTypesApi.getAll({ category: 'Lisens' }),
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  })

  const licenseCategory = categories?.find((c) => c.name === 'Lisens')

  const createMutation = useMutation({
    mutationFn: productTypesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productTypes'] })
      setDialogOpen(false)
      setEditingLicense(null)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ProductType> }) =>
      productTypesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productTypes'] })
      setDialogOpen(false)
      setEditingLicense(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: productTypesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productTypes'] })
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name') as string,
      categoryId: licenseCategory?.id || 2,
      description: formData.get('description') as string || undefined,
      defaultBillingIntervalMonths: parseInt(formData.get('defaultBillingIntervalMonths') as string),
    }

    if (editingLicense) {
      updateMutation.mutate({ id: editingLicense.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const openCreateDialog = () => {
    setEditingLicense(null)
    setDialogOpen(true)
  }

  const openEditDialog = (license: ProductType) => {
    setEditingLicense(license)
    setDialogOpen(true)
  }

  const totalRevenue = licenses?.reduce((sum, l) => sum + (l.totalRevenue || 0), 0) || 0
  const totalCustomers = licenses?.reduce((sum, l) => sum + (l.customerCount || 0), 0) || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lisenser</h1>
          <p className="text-muted-foreground">Tredjepartslisenser og programvare</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          Ny lisens
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totalt lisenser</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{licenses?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totalt kunder</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Årlig omsetning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alle lisenser</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">Laster...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Navn</TableHead>
                  <TableHead>Beskrivelse</TableHead>
                  <TableHead>Fakturaintervall</TableHead>
                  <TableHead>Kunder</TableHead>
                  <TableHead className="text-right">Årlig omsetning</TableHead>
                  <TableHead className="w-[100px]">Handlinger</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licenses?.map((license) => (
                  <TableRow key={license.id}>
                    <TableCell className="font-medium">
                      <Link
                        to={`/licenses/${license.id}`}
                        className="hover:underline"
                      >
                        {license.name}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {license.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {license.defaultBillingIntervalMonths} mnd
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {license.customerCount || 0} kunder
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(license.totalRevenue || 0)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/licenses/${license.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(license)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm('Er du sikker på at du vil slette denne lisensen?')) {
                              deleteMutation.mutate(license.id)
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {licenses?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Ingen lisenser funnet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLicense ? 'Rediger lisens' : 'Ny lisens'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Navn *</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  defaultValue={editingLicense?.name}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Beskrivelse</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingLicense?.description || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultBillingIntervalMonths">Standard fakturaintervall</Label>
                <Select
                  id="defaultBillingIntervalMonths"
                  name="defaultBillingIntervalMonths"
                  defaultValue={editingLicense?.defaultBillingIntervalMonths?.toString() || '12'}
                  options={[
                    { value: '1', label: '1 måned' },
                    { value: '3', label: '3 måneder' },
                    { value: '6', label: '6 måneder' },
                    { value: '12', label: '12 måneder' },
                  ]}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Avbryt
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingLicense ? 'Lagre' : 'Opprett'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
