import { ApiError, apiRequest } from '@/lib/api-client'
import { optionalNumber, type AdminProductValues } from '@/lib/validators/admin-product'

import type { AdminApplication, AdminProduct } from './types'

function num(value: unknown): number | undefined {
  const parsed = Number(value)
  return value !== null && value !== undefined && value !== '' && Number.isFinite(parsed)
    ? parsed
    : undefined
}

function text(value: unknown): string | undefined {
  if (value === null || value === undefined || value === '') return undefined
  return String(value)
}

function toProduct(row: Record<string, unknown>): AdminProduct {
  return {
    id: String(row.id ?? ''),
    active: row.active !== false,
    title: text(row.title),
    category: text(row.category),
    type: text(row.type),
    condition: text(row.condition),
    make: text(row.make),
    model: text(row.model),
    yearFrom: num(row.yearFrom),
    yearTo: num(row.yearTo),
    engine: text(row.engine),
    engineFamily: text(row.engineFamily),
    engineCode: text(row.engineCode),
    fitment: text(row.fitment),
    manufacturer: text(row.manufacturer),
    partNumber: text(row.partNumber),
    oemPart: text(row.oemPart),
    aftermarketPart: text(row.aftermarketPart),
    description: text(row.description),
    warranty: text(row.warranty),
    supplier: text(row.supplier),
    supplierPartNumber: text(row.supplierPartNumber),
    supplierUrl: text(row.supplierUrl),
    internalNotes: text(row.internalNotes),
    price: num(row.price),
    compareAt: num(row.compareAt),
    coreCharge: num(row.coreCharge),
    purchaseCost: num(row.purchaseCost),
    image: text(row.image),
    shippingWeight: num(row.shippingWeight),
    packageLength: num(row.packageLength),
    packageWidth: num(row.packageWidth),
    packageHeight: num(row.packageHeight),
    applicationIds: Array.isArray(row.applicationIds) ? row.applicationIds.map(String) : [],
  }
}

export async function listAdminProducts(): Promise<AdminProduct[]> {
  const rows = await apiRequest<Record<string, unknown>[]>('/admin/products')
  return rows.map(toProduct)
}

// El id de la URL es el del producto. Se manda el registro completo: un campo
// que no va en el body se borra, salvo precios y costos que el backend conserva.
export function saveAdminProduct(
  id: string,
  payload: Record<string, unknown>,
): Promise<{ ok: true; product: Record<string, unknown> }> {
  return apiRequest(`/admin/products/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

// Opciones del selector de vehículos compatibles; `id` es el código que va en
// `applicationIds`.
export function listAdminApplications(): Promise<AdminApplication[]> {
  return apiRequest<AdminApplication[]>('/admin/applications')
}

export function deactivateAdminProduct(id: string): Promise<{ ok: true }> {
  return apiRequest(`/admin/products/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

// Solo `active`: el backend conserva precio y el resto del registro guardado.
export function activateAdminProduct(id: string): Promise<{ ok: true }> {
  return apiRequest(`/admin/products/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify({ active: true }),
  })
}

const EXPORT_FALLBACK_FILE_NAME = 'torquetrack-catalog.zip'

function exportFileName(disposition: string | null): string {
  const match = /filename="?([^";]+)"?/i.exec(disposition ?? '')
  return match?.[1]?.trim() || EXPORT_FALLBACK_FILE_NAME
}

// ZIP del catálogo (productos, aplicaciones e imágenes locales) para cargarlo
// en otro servidor con `import_catalog`. No usa `apiRequest`: ese cliente
// fuerza JSON, y el ZIP es binario y puede tardar más que una petición normal.
export async function exportAdminProducts(): Promise<{ blob: Blob; fileName: string }> {
  const response = await fetch('/api/admin/products/export/', { credentials: 'include' })
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null)
    const message =
      body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
        ? body.error
        : 'Export failed'
    throw new ApiError(message, response.status)
  }
  return {
    blob: await response.blob(),
    fileName: exportFileName(response.headers.get('Content-Disposition')),
  }
}

export function productPayload(
  existing: AdminProduct | undefined,
  values: AdminProductValues,
  options: { canEditPricing: boolean; canViewCosts: boolean },
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    ...(existing ?? {}),
    title: values.title,
    partNumber: values.partNumber,
    category: values.category,
    condition: values.condition,
    make: values.make,
    model: values.model,
    yearFrom: optionalNumber(values.yearFrom),
    yearTo: optionalNumber(values.yearTo),
    engine: values.engine,
    fitment: values.fitment,
    description: values.description,
    warranty: values.warranty,
    shippingWeight: values.shippingWeight,
    packageLength: values.packageLength,
    packageWidth: values.packageWidth,
    packageHeight: values.packageHeight,
    image: values.image,
    active: values.active,
    applicationIds: values.applicationIds,
  }
  if (options.canEditPricing) {
    payload.price = optionalNumber(values.price)
    payload.coreCharge = values.coreCharge
    if (options.canViewCosts) payload.purchaseCost = values.purchaseCost
  } else {
    delete payload.price
    delete payload.compareAt
    delete payload.coreCharge
    delete payload.purchaseCost
  }
  if (options.canViewCosts) {
    payload.supplier = values.supplier
    payload.supplierPartNumber = values.supplierPartNumber
    payload.supplierUrl = values.supplierUrl
    payload.internalNotes = values.internalNotes
  } else {
    delete payload.supplier
    delete payload.supplierPartNumber
    delete payload.supplierUrl
    delete payload.internalNotes
    delete payload.purchaseCost
  }
  delete payload.id
  return payload
}
