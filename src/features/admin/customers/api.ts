import { apiRequest } from '@/lib/api-client'

import type { AdminCustomer, TaxExemption } from './types'

// El backend expande el `data` del perfil: cualquier campo puede faltar.
type RawCustomer = Partial<AdminCustomer> & { id: string; portalStatus: string; taxStatus: string }

type RawTaxExemption = Omit<TaxExemption, 'tax'> & {
  tax: Omit<TaxExemption['tax'], 'submittedAt' | 'reviewedAt'> & {
    submittedAt: string | null
    reviewedAt: string | null
  }
}

function toCustomer(row: RawCustomer): AdminCustomer {
  return {
    id: row.id,
    email: row.email ?? null,
    name: row.name ?? '',
    company: row.company ?? '',
    phone: row.phone ?? '',
    address1: row.address1 ?? '',
    address2: row.address2 ?? '',
    city: row.city ?? '',
    state: row.state ?? '',
    zip: row.zip ?? '',
    portalStatus: row.portalStatus,
    taxStatus: row.taxStatus || 'NOT SUBMITTED',
    taxIdMasked: row.taxIdMasked ?? '',
  }
}

function toDate(value: string | null | undefined): Date | null {
  return value ? new Date(value) : null
}

export async function listCustomers(): Promise<AdminCustomer[]> {
  const rows = await apiRequest<RawCustomer[]>('/admin/customers')
  return rows.map(toCustomer)
}

// Alta o edición: con `id` actualiza, sin `id` crea (o reutiliza el perfil
// invitado con el mismo email).
export async function saveCustomer(payload: {
  id?: string | null
  name: string
  company?: string
  email: string
  phone?: string
  address1?: string
  city?: string
  state?: string
  zip?: string
}): Promise<AdminCustomer> {
  const body = await apiRequest<{ customer: RawCustomer }>('/admin/customers', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return toCustomer(body.customer)
}

export function deleteCustomer(id: string): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>(`/admin/customers/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

// Sin proveedor de correo el enlace no se envía: el panel lo muestra para
// compartirlo a mano.
export function sendPortalInvite(customerId: string): Promise<{ ok: true; activationUrl: string }> {
  return apiRequest<{ ok: true; activationUrl: string }>('/admin/customers/portal-invite', {
    method: 'POST',
    body: JSON.stringify({ customerId }),
  })
}

export async function getTaxExemption(id: string): Promise<TaxExemption> {
  const body = await apiRequest<RawTaxExemption>(
    `/admin/customers/${encodeURIComponent(id)}/tax-exemption`,
  )
  return {
    ...body,
    tax: {
      ...body.tax,
      submittedAt: toDate(body.tax.submittedAt),
      reviewedAt: toDate(body.tax.reviewedAt),
    },
  }
}

export async function updateTaxStatus(
  id: string,
  status: string,
): Promise<{ ok: true; status: string; reviewedAt: Date | null; reviewedBy: string | null }> {
  const body = await apiRequest<{
    ok: true
    status: string
    reviewedAt: string | null
    reviewedBy: string | null
  }>(`/admin/customers/${encodeURIComponent(id)}/tax-status`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  })
  return { ...body, reviewedAt: toDate(body.reviewedAt) }
}
