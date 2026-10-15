import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'

import { FormError } from '@/components/form-error'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { catalogKeys } from '@/features/storefront/catalog/query-keys'
import {
  DEFAULT_PRODUCT_LINE,
  PRODUCT_LINE_OPTIONS,
  type ProductLineValue,
} from '@/lib/product-lines'

import { createAdminCategory, setAdminCategoryLine } from '../api'
import { adminProductKeys } from '../query-keys'
import type { AdminCategory } from '../types'

const SELECT_CLASS = 'h-9 rounded-md border border-input bg-background px-2 text-sm'

type CategoriesDialogProps = {
  categories: AdminCategory[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

function productsLabel(count: number): string {
  return count === 1 ? '1 product' : `${count} products`
}

// Categorías del catálogo y la sección de la portada donde sale cada una.
// Cada cambio se guarda al instante.
export function CategoriesDialog({ categories, open, onOpenChange }: CategoriesDialogProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [line, setLine] = useState<ProductLineValue>(DEFAULT_PRODUCT_LINE)

  // La portada agrupa por sección: la tienda vuelve a pedir su resumen.
  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: adminProductKeys.all }),
      queryClient.invalidateQueries({ queryKey: catalogKeys.all }),
    ])
  }

  const create = useMutation({
    mutationFn: () => createAdminCategory(name.trim(), line),
    onSuccess: async () => {
      setName('')
      setLine(DEFAULT_PRODUCT_LINE)
      await refresh()
    },
  })
  const move = useMutation({
    mutationFn: ({ category, to }: { category: AdminCategory; to: ProductLineValue }) =>
      setAdminCategoryLine(category.id, to),
    onSuccess: refresh,
  })
  const busy = create.isPending || move.isPending
  const failure = create.error ?? move.error

  function handleCreate(event: FormEvent) {
    event.preventDefault()
    move.reset()
    if (name.trim()) create.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="space-y-1 border-b px-6 py-4 pr-12">
          <DialogTitle>Categories</DialogTitle>
          <DialogDescription>
            The home section decides where a category shows on the storefront home page.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 space-y-6 overflow-y-auto px-6 py-4">
          <form aria-label="New category" className="space-y-3" noValidate onSubmit={handleCreate}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="category-name"
                label="New category"
                placeholder="Category name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <div className="space-y-2">
                <Label htmlFor="category-line">Home section</Label>
                <select
                  id="category-line"
                  className={`${SELECT_CLASS} w-full`}
                  value={line}
                  onChange={(event) => setLine(event.target.value as ProductLineValue)}
                >
                  {PRODUCT_LINE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button type="submit" disabled={busy || !name.trim()}>
              {create.isPending ? 'Adding…' : 'Add category'}
            </Button>
          </form>

          {categories.length ? (
            <ul aria-label="Categories" className="divide-y rounded-md border">
              {categories.map((category) => (
                <li key={category.id} className="flex flex-wrap items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{category.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {productsLabel(category.productCount)}
                    </p>
                  </div>
                  <select
                    aria-label={`Home section for ${category.name}`}
                    className={SELECT_CLASS}
                    value={category.line}
                    disabled={busy}
                    onChange={(event) => {
                      create.reset()
                      move.mutate({ category, to: event.target.value as ProductLineValue })
                    }}
                  >
                    {PRODUCT_LINE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No categories yet.</p>
          )}
          {failure ? <FormError error={failure} /> : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
