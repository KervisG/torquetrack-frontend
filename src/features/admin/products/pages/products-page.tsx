import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Package } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { EmptyState } from '@/components/empty-state'
import { FormError } from '@/components/form-error'
import { FormField } from '@/components/form-field'
import { ListPagination, usePagedRows } from '@/components/list-pagination'
import { PageHeader } from '@/components/app-shell/page-header'
import { Button } from '@/components/ui/button'
import { PermissionNotice } from '@/features/admin/auth/components/permission-notice'
import { useAdminPermissions } from '@/features/admin/auth/hooks/use-admin-permissions'
import { catalogKeys } from '@/features/storefront/catalog/query-keys'
import { ApiError } from '@/lib/api-client'
import type { AdminProductValues } from '@/lib/validators/admin-product'

import {
  activateAdminProduct,
  deactivateAdminProduct,
  deleteAdminProduct,
  createAdminCategory,
  exportAdminProducts,
  listAdminBrands,
  listAdminCategories,
  listAdminProducts,
  productPayload,
  saveAdminProduct,
  uploadBrandLogo,
  uploadProductImage,
} from '../api'
import { BrandsDialog } from '../components/brands-dialog'
import { CategoriesDialog } from '../components/categories-dialog'
import { DeleteProductDialog } from '../components/delete-product-dialog'
import {
  ProductEditorDialog,
  type ProductSubmitExtras,
} from '../components/product-editor-dialog'
import { ProductLayoutToggle, type ProductLayout } from '../components/product-layout-toggle'
import { ProductsCardGrid } from '../components/products-card-grid'
import { ProductsTable } from '../components/products-table'
import { adminProductKeys } from '../query-keys'
import type { AdminProduct } from '../types'

const PHOTOS_FAILED =
  'The product was saved, but some photos could not be uploaded. Add them again under Photos & notes.'
const LOGO_FAILED =
  'The product was saved, but the brand logo could not be uploaded. Add it under Brands.'

type SaveVariables = ProductSubmitExtras & { id: string; values: AdminProductValues }

function matches(product: AdminProduct, search: string): boolean {
  const needle = search.trim().toLowerCase()
  if (!needle) return true
  return [product.title, product.partNumber, product.category, product.make, product.fitment, product.id]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(needle))
}

function randomSuffix(): string {
  const bytes = new Uint8Array(4)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function productIdFromTitle(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
  const suffix = randomSuffix()
  return slug ? `${slug}-${suffix}` : `product-${suffix}`
}

function saveFile(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  // El click ya entregó el archivo al navegador; se libera la memoria del Blob.
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

// En pantallas chicas la tabla no cabe: arranca en tarjetas y desde `md` en
// lista. El toggle sigue mandando después.
function initialLayout(): ProductLayout {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'list'
  return window.matchMedia('(min-width: 768px)').matches ? 'list' : 'cards'
}

export function ProductsPage() {
  const { can } = useAdminPermissions()
  const allowed = can('products.view')
  const canEdit = can('products.edit')
  const canEditPricing = can('pricing.edit')
  const canViewCosts = can('costs.view')
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [layout, setLayout] = useState<ProductLayout>(initialLayout)
  // `?new=1` llega desde los accesos del dashboard y abre el alta.
  const [params, setParams] = useSearchParams()
  const [editing, setEditing] = useState<AdminProduct | null | undefined>(() =>
    canEdit && params.has('new') ? null : undefined,
  )
  const [photoNotice, setPhotoNotice] = useState('')
  const [brandsOpen, setBrandsOpen] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [deleting, setDeleting] = useState<AdminProduct | null>(null)
  const categories = useQuery({
    queryKey: adminProductKeys.categories(),
    queryFn: listAdminCategories,
    enabled: allowed,
  })
  const brands = useQuery({
    queryKey: adminProductKeys.brands(),
    queryFn: listAdminBrands,
    enabled: allowed,
  })
  const products = useQuery({
    queryKey: adminProductKeys.list(),
    queryFn: listAdminProducts,
    enabled: allowed,
  })
  const save = useMutation({
    // El alta es un PUT por id: repetirlo no crea otro producto. Un 4xx (precio,
    // permiso) no se reintenta; un timeout o un 5xx sí, como cuando el servidor
    // todavía está despertando.
    retry: (failureCount, error) =>
      failureCount < 3 && !(error instanceof ApiError && error.status < 500),
    mutationFn: async ({ id, values, newCategoryLine }: SaveVariables) => {
      if (newCategoryLine) {
        // La categoría va antes para que el producto ya nazca en su sección.
        // Un 400 es que ya existe (un reintento del PUT la creó): se sigue.
        try {
          await createAdminCategory(values.category, newCategoryLine)
        } catch (error) {
          if (!(error instanceof ApiError && error.status === 400)) throw error
        }
      }
      return saveAdminProduct(
        id,
        productPayload(editing ?? undefined, values, { canEditPricing, canViewCosts }),
      )
    },
    // Las fotos y el logo se suben acá y no en `mutationFn`: un reintento del
    // PUT volvería a subir lo que ya quedó guardado.
    onSuccess: async (_saved, { id, values, photos, brandLogo }) => {
      let photosFailed = false
      try {
        for (const file of photos) await uploadProductImage(id, file)
      } catch {
        photosFailed = true
      }
      let logoFailed = false
      if (brandLogo) {
        try {
          // La marca nació con el producto: recién ahora tiene id.
          const name = values.manufacturer.trim().toLowerCase()
          const brand = (await listAdminBrands()).find((row) => row.name.toLowerCase() === name)
          if (!brand) throw new Error('Brand not found')
          await uploadBrandLogo(brand.id, brandLogo)
        } catch {
          logoFailed = true
        }
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminProductKeys.all }),
        // La portada también se ve en la tienda.
        ...(photos.length ? [queryClient.invalidateQueries({ queryKey: catalogKeys.all })] : []),
      ])
      setPhotoNotice(
        [photosFailed ? PHOTOS_FAILED : '', logoFailed ? LOGO_FAILED : ''].filter(Boolean).join(' '),
      )
      // Si faltaron fotos, el editor sigue abierto sobre el producto ya
      // creado, con la galería lista para reintentar.
      const created = photosFailed
        ? queryClient
            .getQueryData<AdminProduct[]>(adminProductKeys.list())
            ?.find((product) => product.id === id)
        : undefined
      if (created) setEditing(created)
      else closeEditor()
    },
  })
  const deactivate = useMutation({
    mutationFn: (product: AdminProduct) => deactivateAdminProduct(product.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminProductKeys.all })
    },
  })
  const remove = useMutation({
    mutationFn: (product: AdminProduct) => deleteAdminProduct(product.id),
    onSuccess: async () => {
      setDeleting(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminProductKeys.all }),
        // El producto también desaparece de la tienda.
        queryClient.invalidateQueries({ queryKey: catalogKeys.all }),
      ])
    },
  })
  const exportCatalog = useMutation({
    mutationFn: exportAdminProducts,
    onSuccess: ({ blob, fileName }) => saveFile(blob, fileName),
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
  const brandNames = useMemo(() => (brands.data ?? []).map((brand) => brand.name), [brands.data])

  function closeEditor() {
    setEditing(undefined)
    if (params.has('new')) setParams({}, { replace: true })
  }

  function openEditor(product: AdminProduct) {
    save.reset()
    setPhotoNotice('')
    setEditing(product)
  }

  function confirmDelete(product: AdminProduct) {
    remove.reset()
    setDeleting(product)
  }

  function openNew() {
    save.reset()
    setPhotoNotice('')
    setEditing(null)
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
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={exportCatalog.isPending}
              onClick={() => exportCatalog.mutate()}
            >
              {exportCatalog.isPending ? 'Exporting…' : 'Export'}
            </Button>
            {canEdit ? (
              <Button type="button" variant="outline" onClick={() => setCategoriesOpen(true)}>
                Categories
              </Button>
            ) : null}
            {canEdit ? (
              <Button type="button" variant="outline" onClick={() => setBrandsOpen(true)}>
                Brands
              </Button>
            ) : null}
            {canEdit ? (
              <Button type="button" onClick={() => openNew()}>
                New product
              </Button>
            ) : null}
          </div>
        }
      />
      {exportCatalog.error ? <FormError error={exportCatalog.error} /> : null}
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
        ) : !products.data.length ? (
          <EmptyState
            icon={Package}
            title="No products yet"
            description="Products you add here show up in the storefront catalog and in quotes."
            action={
              canEdit ? (
                <Button type="button" onClick={() => openNew()}>
                  Add your first product
                </Button>
              ) : null
            }
          />
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
                onDelete={confirmDelete}
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
                onDelete={confirmDelete}
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
        {photoNotice && editing === undefined ? (
          <p role="alert" className="text-sm text-destructive">
            {photoNotice}
          </p>
        ) : null}
      </div>
      {editing !== undefined ? (
        <ProductEditorDialog
          key={editing?.id ?? 'new'}
          product={editing}
          open
          submitting={save.isPending}
          error={save.error}
          notice={photoNotice}
          brands={brandNames}
          canEditPricing={canEditPricing}
          canViewCosts={canViewCosts}
          onOpenChange={(open) => {
            if (open) return
            setPhotoNotice('')
            closeEditor()
          }}
          categories={categories.data ?? []}
          onSubmit={(values, extras) => {
            setPhotoNotice('')
            // El id se decide una vez: un reintento del PUT reusa el mismo.
            const id = editing?.id ?? productIdFromTitle(values.title)
            save.mutate({ id, values, ...extras })
          }}
        />
      ) : null}
      {deleting ? (
        <DeleteProductDialog
          product={deleting}
          deleting={remove.isPending}
          error={remove.error}
          onConfirm={(product) => remove.mutate(product)}
          onOpenChange={(open) => {
            if (!open) setDeleting(null)
          }}
        />
      ) : null}
      {categoriesOpen ? (
        <CategoriesDialog categories={categories.data ?? []} open onOpenChange={setCategoriesOpen} />
      ) : null}
      {brandsOpen ? (
        <BrandsDialog brands={brands.data ?? []} open onOpenChange={setBrandsOpen} />
      ) : null}
    </section>
  )
}
