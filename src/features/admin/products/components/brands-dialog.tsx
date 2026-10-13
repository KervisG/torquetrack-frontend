import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef, useState, type FormEvent } from 'react'

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
import { catalogKeys } from '@/features/storefront/catalog/query-keys'

import {
  createAdminBrand,
  deleteBrandLogo,
  MAX_PRODUCT_IMAGE_BYTES,
  PRODUCT_IMAGE_TYPES,
  setAdminBrandActive,
  uploadBrandLogo,
} from '../api'
import { adminProductKeys } from '../query-keys'
import type { AdminBrand } from '../types'

const LOGO_TOO_LARGE = 'The logo must be 4 MB or smaller.'

type BrandsDialogProps = {
  brands: AdminBrand[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

function productsLabel(count: number): string {
  return count === 1 ? '1 product' : `${count} products`
}

// Marcas del catálogo: alta con logo opcional, logo y estado de cada una.
// Cada acción se guarda al instante, como la galería de fotos.
export function BrandsDialog({ brands, open, onOpenChange }: BrandsDialogProps) {
  const queryClient = useQueryClient()
  const newLogoRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [newLogo, setNewLogo] = useState<File | null>(null)
  const [notice, setNotice] = useState('')

  // Desactivar una marca cambia sus productos, y la tienda arma el filtro de
  // marcas con los activos: el panel y la tienda vuelven a pedir sus datos.
  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: adminProductKeys.all }),
      queryClient.invalidateQueries({ queryKey: catalogKeys.all }),
    ])
  }

  const create = useMutation({
    mutationFn: async () => {
      const brand = await createAdminBrand(name.trim())
      if (newLogo) await uploadBrandLogo(brand.id, newLogo)
    },
    onSuccess: () => {
      setName('')
      setNewLogo(null)
      if (newLogoRef.current) newLogoRef.current.value = ''
    },
    // Si el logo falló, la marca ya quedó creada y tiene que verse en la lista.
    onSettled: refresh,
  })
  const setActive = useMutation({
    mutationFn: ({ brand, active }: { brand: AdminBrand; active: boolean }) =>
      setAdminBrandActive(brand.id, active),
    onSuccess: refresh,
  })
  const setLogo = useMutation({
    mutationFn: ({ brand, file }: { brand: AdminBrand; file: File }) =>
      uploadBrandLogo(brand.id, file),
    onSuccess: refresh,
  })
  const removeLogo = useMutation({
    mutationFn: (brand: AdminBrand) => deleteBrandLogo(brand.id),
    onSuccess: refresh,
  })
  const busy = create.isPending || setActive.isPending || setLogo.isPending || removeLogo.isPending
  const failure = create.error ?? setActive.error ?? setLogo.error ?? removeLogo.error

  function resetFeedback() {
    setNotice('')
    for (const mutation of [create, setActive, setLogo, removeLogo]) mutation.reset()
  }

  function fits(file: File): boolean {
    if (file.size <= MAX_PRODUCT_IMAGE_BYTES) return true
    setNotice(LOGO_TOO_LARGE)
    return false
  }

  function handleCreate(event: FormEvent) {
    event.preventDefault()
    resetFeedback()
    if (!name.trim() || (newLogo && !fits(newLogo))) return
    create.mutate()
  }

  function handleStatus(brand: AdminBrand, active: boolean) {
    resetFeedback()
    const question = `Deactivate ${brand.name} and its ${productsLabel(brand.productCount)}? They will be hidden from the store.`
    if (!active && brand.productCount > 0 && !window.confirm(question)) return
    setActive.mutate({ brand, active })
  }

  function handleLogo(brand: AdminBrand, file: File | undefined) {
    resetFeedback()
    if (file && fits(file)) setLogo.mutate({ brand, file })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="space-y-1 border-b px-6 py-4 pr-12">
          <DialogTitle>Brands</DialogTitle>
          <DialogDescription>
            Deactivating a brand deactivates every product that carries it; activating it brings
            them back.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 space-y-6 overflow-y-auto px-6 py-4">
          <form aria-label="New brand" className="space-y-3" noValidate onSubmit={handleCreate}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="brand-name"
                label="New brand"
                placeholder="Brand name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <FormField
                id="brand-new-logo"
                ref={newLogoRef}
                label="Logo (optional)"
                type="file"
                accept={PRODUCT_IMAGE_TYPES}
                onChange={(event) => setNewLogo(event.target.files?.[0] ?? null)}
              />
            </div>
            <Button type="submit" disabled={busy || !name.trim()}>
              {create.isPending ? 'Adding…' : 'Add brand'}
            </Button>
          </form>

          {brands.length ? (
            <ul aria-label="Brands" className="divide-y rounded-md border">
              {brands.map((brand) => (
                <li key={brand.id} className="flex flex-wrap items-center gap-3 p-3">
                  <div className="flex h-12 w-20 shrink-0 items-center justify-center overflow-hidden rounded bg-neutral-100">
                    {brand.logo ? (
                      <img
                        src={brand.logo}
                        alt={`${brand.name} logo`}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">No logo</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{brand.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {productsLabel(brand.productCount)}
                    </p>
                  </div>
                  <label className="cursor-pointer text-sm underline">
                    {brand.logo ? 'Replace logo' : 'Upload logo'}
                    <input
                      type="file"
                      accept={PRODUCT_IMAGE_TYPES}
                      aria-label={`Logo for ${brand.name}`}
                      className="sr-only"
                      disabled={busy}
                      onChange={(event) => {
                        handleLogo(brand, event.target.files?.[0])
                        event.target.value = ''
                      }}
                    />
                  </label>
                  {brand.logo ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      aria-label={`Remove logo for ${brand.name}`}
                      disabled={busy}
                      onClick={() => {
                        resetFeedback()
                        removeLogo.mutate(brand)
                      }}
                    >
                      Remove logo
                    </Button>
                  ) : null}
                  <select
                    aria-label={`Status for ${brand.name}`}
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                    value={brand.active ? 'active' : 'inactive'}
                    disabled={busy}
                    onChange={(event) => handleStatus(brand, event.target.value === 'active')}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No brands yet.</p>
          )}
          {notice ? (
            <p role="alert" className="text-sm text-destructive">
              {notice}
            </p>
          ) : null}
          {failure ? <FormError error={failure} /> : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
