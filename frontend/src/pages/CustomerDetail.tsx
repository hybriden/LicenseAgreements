import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customersApi, agreementsApi, productTypesApi, type Agreement } from '@/lib/api'
import { formatCurrency, formatDate, daysUntil } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { ArrowLeft, Plus, Pencil, Trash2, Building2, Mail, Phone, MapPin } from 'lucide-react'

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>()
  const customerId = parseInt(id!)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAgreement, setEditingAgreement] = useState<Agreement | null>(null)
  const queryClient = useQueryClient()

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => customersApi.getOne(customerId),
  })

  const { data: productTypes } = useQuery({
    queryKey: ['productTypes'],
    queryFn: () => productTypesApi.getAll(),
  })

  const createAgreementMutation = useMutation({
    mutationFn: agreementsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] })
      setDialogOpen(false)
      setEditingAgreement(null)
    },
  })

  const updateAgreementMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Agreement> }) =>
      agreementsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] })
      setDialogOpen(false)
      setEditingAgreement(null)
    },
  })

  const deleteAgreementMutation = useMutation({
    mutationFn: agreementsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] })
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      customerId,
      productTypeId: parseInt(formData.get('productTypeId') as string),
      amount: parseFloat(formData.get('amount') as string),
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string || undefined,
      billingIntervalMonths: parseInt(formData.get('billingIntervalMonths') as string),
      nextBillingDate: formData.get('nextBillingDate') as string,
      notes: formData.get('notes') as string || undefined,
    }

    if (editingAgreement) {
      updateAgreementMutation.mutate({ id: editingAgreement.id, data })
    } else {
      createAgreementMutation.mutate(data)
    }
  }

  const openCreateDialog = () => {
    setEditingAgreement(null)
    setDialogOpen(true)
  }

  const openEditDialog = (agreement: Agreement) => {
    setEditingAgreement(agreement)
    setDialogOpen(true)
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Laster...</div>
  }

  if (!customer) {
    return <div className="flex items-center justify-center h-64">Kunde ikke funnet</div>
  }

  const getBillingBadge = (nextBillingDate: string) => {
    const days = daysUntil(nextBillingDate)
    if (days < 0) return <Badge variant="destructive">Forfalt</Badge>
    if (days <= 30) return <Badge variant="warning">{days} dager</Badge>
    return <Badge variant="secondary">{formatDate(nextBillingDate)}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/customers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{customer.name}</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Kundeinformasjon</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customer.orgNumber && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{customer.orgNumber}</span>
              </div>
            )}
            {customer.contactEmail && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${customer.contactEmail}`} className="hover:underline">
                  {customer.contactEmail}
                </a>
              </div>
            )}
            {customer.contactPhone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{customer.contactPhone}</span>
              </div>
            )}
            {customer.address && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{customer.address}</span>
              </div>
            )}
            {customer.notes && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">{customer.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Sammendrag</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Aktive avtaler</p>
                <p className="text-2xl font-bold">{customer.summary?.totalAgreements || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Månedlig verdi</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(customer.summary?.totalMonthlyValue || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Årlig verdi</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(customer.summary?.totalAnnualValue || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Avtaler</CardTitle>
            <CardDescription>Produkter og lisenser for denne kunden</CardDescription>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4" />
            Ny avtale
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produkt/Lisens</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Sum</TableHead>
                <TableHead>Intervall</TableHead>
                <TableHead>Startdato</TableHead>
                <TableHead>Neste faktura</TableHead>
                <TableHead className="w-[80px]">Handlinger</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customer.activeAgreements?.map((agreement) => (
                <TableRow key={agreement.id}>
                  <TableCell className="font-medium">
                    {agreement.productType?.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {agreement.productType?.category?.name}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(agreement.amount)}
                  </TableCell>
                  <TableCell>{agreement.billingIntervalMonths} mnd</TableCell>
                  <TableCell>{formatDate(agreement.startDate)}</TableCell>
                  <TableCell>{getBillingBadge(agreement.nextBillingDate)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(agreement)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm('Er du sikker på at du vil avslutte denne avtalen?')) {
                            deleteAgreementMutation.mutate(agreement.id)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!customer.activeAgreements || customer.activeAgreements.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Ingen avtaler funnet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAgreement ? 'Rediger avtale' : 'Ny avtale'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="productTypeId">Produkt/Lisens *</Label>
                <Select
                  id="productTypeId"
                  name="productTypeId"
                  required
                  defaultValue={editingAgreement?.productTypeId?.toString() || ''}
                  options={productTypes?.map((pt) => ({
                    value: pt.id.toString(),
                    label: `${pt.name} (${pt.category?.name})`,
                  })) || []}
                  placeholder="Velg produkt/lisens"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Sum (NOK) *</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    required
                    defaultValue={editingAgreement?.amount}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billingIntervalMonths">Fakturaintervall (mnd) *</Label>
                  <Select
                    id="billingIntervalMonths"
                    name="billingIntervalMonths"
                    required
                    defaultValue={editingAgreement?.billingIntervalMonths?.toString() || '12'}
                    options={[
                      { value: '1', label: '1 måned' },
                      { value: '3', label: '3 måneder' },
                      { value: '6', label: '6 måneder' },
                      { value: '12', label: '12 måneder' },
                    ]}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Startdato *</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    required
                    defaultValue={editingAgreement?.startDate?.split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Sluttdato</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    defaultValue={editingAgreement?.endDate?.split('T')[0] || ''}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nextBillingDate">Neste fakturadato *</Label>
                <Input
                  id="nextBillingDate"
                  name="nextBillingDate"
                  type="date"
                  required
                  defaultValue={editingAgreement?.nextBillingDate?.split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notater</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  defaultValue={editingAgreement?.notes || ''}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Avbryt
              </Button>
              <Button
                type="submit"
                disabled={createAgreementMutation.isPending || updateAgreementMutation.isPending}
              >
                {editingAgreement ? 'Lagre' : 'Opprett'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
