import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoriesApi, productTypesApi, type Category, type ProductType } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, FolderOpen, Package } from 'lucide-react'

export function Settings() {
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [productTypeDialogOpen, setProductTypeDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingProductType, setEditingProductType] = useState<ProductType | null>(null)
  const queryClient = useQueryClient()

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  })

  const { data: productTypes, isLoading: productTypesLoading } = useQuery({
    queryKey: ['productTypes'],
    queryFn: () => productTypesApi.getAll(),
  })

  // Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setCategoryDialogOpen(false)
      setEditingCategory(null)
    },
  })

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Category> }) =>
      categoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setCategoryDialogOpen(false)
      setEditingCategory(null)
    },
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  // Product type mutations
  const createProductTypeMutation = useMutation({
    mutationFn: productTypesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productTypes'] })
      setProductTypeDialogOpen(false)
      setEditingProductType(null)
    },
  })

  const updateProductTypeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ProductType> }) =>
      productTypesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productTypes'] })
      setProductTypeDialogOpen(false)
      setEditingProductType(null)
    },
  })

  const deleteProductTypeMutation = useMutation({
    mutationFn: productTypesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productTypes'] })
    },
  })

  const handleCategorySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string || undefined,
    }

    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data })
    } else {
      createCategoryMutation.mutate(data)
    }
  }

  const handleProductTypeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name') as string,
      categoryId: parseInt(formData.get('categoryId') as string),
      description: formData.get('description') as string || undefined,
      defaultBillingIntervalMonths: parseInt(formData.get('defaultBillingIntervalMonths') as string),
    }

    if (editingProductType) {
      updateProductTypeMutation.mutate({ id: editingProductType.id, data })
    } else {
      createProductTypeMutation.mutate(data)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Innstillinger</h1>
        <p className="text-muted-foreground">Administrer kategorier og produkttyper</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Categories */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Kategorier
              </CardTitle>
              <CardDescription>F.eks. Produkt, Lisens</CardDescription>
            </div>
            <Button
              size="sm"
              className="self-start sm:self-auto"
              onClick={() => {
                setEditingCategory(null)
                setCategoryDialogOpen(true)
              }}
            >
              <Plus className="h-4 w-4" />
              Ny kategori
            </Button>
          </CardHeader>
          <CardContent>
            {categoriesLoading ? (
              <div className="flex items-center justify-center h-32">Laster...</div>
            ) : (
              <div className="space-y-3">
                {categories?.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{category.name}</p>
                      {category.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {category.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingCategory(category)
                          setCategoryDialogOpen(true)
                        }}
                        aria-label={`Rediger ${category.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm('Er du sikker på at du vil slette denne kategorien?')) {
                            deleteCategoryMutation.mutate(category.id)
                          }
                        }}
                        aria-label={`Slett ${category.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {(!categories || categories.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">
                    Ingen kategorier
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Types */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Produkttyper
              </CardTitle>
              <CardDescription>Produkter og lisenser</CardDescription>
            </div>
            <Button
              size="sm"
              className="self-start sm:self-auto"
              onClick={() => {
                setEditingProductType(null)
                setProductTypeDialogOpen(true)
              }}
            >
              <Plus className="h-4 w-4" />
              Ny produkttype
            </Button>
          </CardHeader>
          <CardContent>
            {productTypesLoading ? (
              <div className="flex items-center justify-center h-32">Laster...</div>
            ) : (
              <div className="space-y-3">
                {productTypes?.map((pt) => (
                  <div
                    key={pt.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{pt.name}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {pt.category?.name}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {pt.defaultBillingIntervalMonths} mnd
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingProductType(pt)
                          setProductTypeDialogOpen(true)
                        }}
                        aria-label={`Rediger ${pt.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm('Er du sikker på at du vil slette denne produkttypen?')) {
                            deleteProductTypeMutation.mutate(pt.id)
                          }
                        }}
                        aria-label={`Slett ${pt.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {(!productTypes || productTypes.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">
                    Ingen produkttyper
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Rediger kategori' : 'Ny kategori'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCategorySubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="cat-name">Navn *</Label>
                <Input
                  id="cat-name"
                  name="name"
                  required
                  defaultValue={editingCategory?.name}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-description">Beskrivelse</Label>
                <Textarea
                  id="cat-description"
                  name="description"
                  defaultValue={editingCategory?.description || ''}
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setCategoryDialogOpen(false)}
              >
                Avbryt
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
              >
                {editingCategory ? 'Lagre' : 'Opprett'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Product Type Dialog */}
      <Dialog open={productTypeDialogOpen} onOpenChange={setProductTypeDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingProductType ? 'Rediger produkttype' : 'Ny produkttype'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleProductTypeSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="pt-name">Navn *</Label>
                <Input
                  id="pt-name"
                  name="name"
                  required
                  defaultValue={editingProductType?.name}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pt-categoryId">Kategori *</Label>
                <Select
                  id="pt-categoryId"
                  name="categoryId"
                  required
                  defaultValue={editingProductType?.categoryId?.toString() || ''}
                  options={categories?.map((c) => ({
                    value: c.id.toString(),
                    label: c.name,
                  })) || []}
                  placeholder="Velg kategori"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pt-description">Beskrivelse</Label>
                <Textarea
                  id="pt-description"
                  name="description"
                  defaultValue={editingProductType?.description || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pt-interval">Standard fakturaintervall</Label>
                <Select
                  id="pt-interval"
                  name="defaultBillingIntervalMonths"
                  defaultValue={editingProductType?.defaultBillingIntervalMonths?.toString() || '12'}
                  options={[
                    { value: '1', label: '1 måned' },
                    { value: '3', label: '3 måneder' },
                    { value: '6', label: '6 måneder' },
                    { value: '12', label: '12 måneder' },
                  ]}
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setProductTypeDialogOpen(false)}
              >
                Avbryt
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={createProductTypeMutation.isPending || updateProductTypeMutation.isPending}
              >
                {editingProductType ? 'Lagre' : 'Opprett'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
