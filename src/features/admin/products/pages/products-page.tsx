import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { FormError } from '@/components/form-error'
import { FormField } from '@/components/form-field'
import { ListPagination, usePagedRows } from '@/components/list-pagination'
import { PageHeader } from '@/components/app-shell/page-header'
import { Button } from '@/components/ui/button'
import { PermissionNotice } from '@/features/admin/auth/components/permission-notice'
import { useAdminPermissions } from '@/features/admin/auth/hooks/use-admin-permissions'
import type { AdminProductValues } from '@/lib/validators/admin-product'

import {
  activateAdminProduct,
  deactivateAdminProduct,
  listAdminProducts,
  productPayload,
  saveAdminProduct,
} from '../api'
import { ProductEditorDialog } from '../components/product-editor-dialog'
import { ProductLayoutToggle, type ProductLayout } from '../components/product-layout-toggle'
import { ProductsCardGrid } from '../components/products-card-grid'
import { ProductsTable } from '../components/products-table'
import { adminProductKeys } from '../query-keys'
import type { AdminProduct } from '../types'

function matches(product: AdminProduct, search: string): boolean {
  const needle = search.trim().toLowerCase()
  if (!needle) return true
  return [product.title, product.partNumber, product.category, product.make, product.fitment, product.id]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(needle))
}

function productIdFromTitle(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
  const suffix = crypto.randomUUID().slice(0, 8)
  return slug ? `${slug}-${suffix}` : `product-${suffix}`
}

export function ProductsPage() {
  const { can } = useAdminPermissions()
  const allowed = can('products.view')
  const canEdit = can('products.edit')
  const canEditPricing = can('pricing.edit')
  const canViewCosts = can('costs.view')
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [layout, setLayout] = useState<ProductLayout>('list')
  const [editing, setEditing] = useState<AdminProduct | null | undefined>(undefined)
  const products = useQuery({
    queryKey: adminProductKeys.list(),
    queryFn: listAdminProducts,
    enabled: allowed,
  })
  const save = useMutation({
    mutationFn: (values: AdminProductValues) => {
      const id = editing?.id ?? productIdFromTitle(values.title)
      return saveAdminProduct(
        id,
        productPayload(editing ?? undefined, values, { canEditPricing, canViewCosts }),
      )
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminProductKeys.all })
      setEditing(undefined)
    },
  })
  const deactivate = useMutation({
    mutationFn: (product: AdminProduct) => deactivateAdminProduct(product.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminProductKeys.all })
    },
  })
  const activate = useMutation({
    mutationFn: (product: AdminProduct) => activateAdminProduct(product.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminProductKeys.all })
    },
  })
  const rows = useMemo(
    () => (products.data ?? []).filter((product) => matches(product, search)),
    [products.data, search],
  )
  const paged = usePagedRows(rows, search)

  function openEditor(product: AdminProduct) {
    save.reset()
    setEditing(product)
  }

  if (!allowed) {
    return (
      <PermissionNotice title="Products" message="You do not have permission to view products." />
    )
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Products"
        description="Catalog parts, pricing, fitment, and shipping dimensions."
        actions={
          canEdit ? (
            <Button type="button" onClick={() => setEditing(null)}>
              New product
            </Button>
          ) : null
        }
      />
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <FormField
              id="product-search"
              label="Search products"
              placeholder="Title, part number, category or make"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <ProductLayoutToggle layout={layout} onChange={setLayout} />
        </div>
        {products.isPending ? (
          <p className="text-sm text-muted-foreground">Loading products…</p>
        ) : products.error ? (
          <FormError error={products.error} />
        ) : (
          <>
            {layout === 'list' ? (
              <ProductsTable
                products={paged.items}
                canEdit={canEdit}
                deactivatingId={deactivate.isPending ? (deactivate.variables?.id ?? null) : null}
                activatingId={activate.isPending ? (activate.variables?.id ?? null) : null}
                onEdit={openEditor}
                onDeactivate={(product) => deactivate.mutate(product)}
                onActivate={(product) => activate.mutate(product)}
              />
            ) : (
              <ProductsCardGrid
                products={paged.items}
                canEdit={canEdit}
                deactivatingId={deactivate.isPending ? (deactivate.variables?.id ?? null) : null}
                activatingId={activate.isPending ? (activate.variables?.id ?? null) : null}
                onEdit={openEditor}
                onDeactivate={(product) => deactivate.mutate(product)}
                onActivate={(product) => activate.mutate(product)}
              />
            )}
            <ListPagination
              page={paged.page}
              pageCount={paged.pageCount}
              total={paged.total}
              from={paged.from}
              to={paged.to}
              onPage={paged.setPage}
            />
          </>
        )}
        {deactivate.error ? <FormError error={deactivate.error} /> : null}
        {activate.error ? <FormError error={activate.error} /> : null}
      </div>
      {editing !== undefined ? (
        <ProductEditorDialog
          key={editing?.id ?? 'new'}
          product={editing}
          open
          submitting={save.isPending}
          error={save.error}
          canEditPricing={canEditPricing}
          canViewCosts={canViewCosts}
          onOpenChange={(open) => {
            if (!open) setEditing(undefined)
          }}
          onSubmit={(values) => save.mutate(values)}
        />
      ) : null}
    </section>
  )
}
