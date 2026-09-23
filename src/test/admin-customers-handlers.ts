import { http, HttpResponse } from 'msw'

// Forma de `GET /api/admin/customers/`: columnas de la fila más el `data`
// expandido, con el tax ID enmascarado.
export type CustomerApiRow = {
  id: string
  email: string | null
  name?: string
  company?: string
  phone?: string
  address1?: string
  city?: string
  state?: string
  zip?: string
  portalStatus: string
  taxStatus: string
  taxIdMasked: string
  taxCompany?: string
  taxState?: string
  taxSubmittedAt?: string | null
}

export function customerRow(overrides: Partial<CustomerApiRow>): CustomerApiRow {
  return {
    id: 'C_PAT',
    email: 'pat@example.com',
    name: 'Pat Fleet',
    company: 'Fleet LLC',
    phone: '555-0100',
    address1: '100 Main St',
    city: 'Tampa',
    state: 'FL',
    zip: '33601',
    portalStatus: 'ACTIVE',
    taxStatus: 'VERIFIED',
    taxIdMasked: '•••••6789',
    ...overrides,
  }
}

export const sampleTaxExemption = {
  id: 'C_PAT',
  email: 'pat@example.com',
  status: 'PENDING VERIFICATION',
  tax: {
    company: 'Fleet LLC',
    taxId: '12-3456789',
    taxState: 'FL',
    taxExemptionType: 'Resale',
    certificateName: 'resale.pdf',
    certificateData: 'data:application/pdf;base64,JVBERi0xLjQK',
    submittedAt: '2026-09-10T12:00:00Z',
    reviewedAt: null as string | null,
    reviewedBy: null as string | null,
  },
}

type Call = { method: string; path: string; body?: unknown }

// Backend en memoria de `admin/customers`: registra cada llamada para
// assertear también lo que NO se pidió.
export function customersBackend(initial: CustomerApiRow[], exemption = sampleTaxExemption) {
  const customers = [...initial]
  let taxExemption = structuredClone(exemption)
  const calls: Call[] = []
  const handlers = [
    http.get('/api/admin/customers/', ({ request }) => {
      calls.push({ method: 'GET', path: new URL(request.url).pathname })
      return HttpResponse.json(customers)
    }),
    http.post('/api/admin/customers/portal-invite/', async ({ request }) => {
      const body = await request.json()
      calls.push({ method: 'POST', path: '/api/admin/customers/portal-invite/', body })
      return HttpResponse.json({
        ok: true,
        activationUrl: 'http://localhost:5174/activate?token=abc123',
      })
    }),
    http.post('/api/admin/customers/', async ({ request }) => {
      const body = (await request.json()) as Record<string, string>
      calls.push({ method: 'POST', path: '/api/admin/customers/', body })
      const existing = customers.findIndex((row) => row.id === body.id)
      const saved = customerRow({
        ...(existing >= 0 ? customers[existing] : {}),
        ...body,
        id: body.id || `C_NEW${customers.length}`,
        portalStatus: existing >= 0 ? customers[existing].portalStatus : 'NOT ACTIVATED',
        taxStatus: existing >= 0 ? customers[existing].taxStatus : 'NOT SUBMITTED',
      })
      if (existing >= 0) customers[existing] = saved
      else customers.push(saved)
      return HttpResponse.json({ customer: saved, reusedExistingCustomer: !body.id })
    }),
    http.delete('/api/admin/customers/:id/', ({ params }) => {
      calls.push({ method: 'DELETE', path: `/api/admin/customers/${params.id}/` })
      customers.splice(
        customers.findIndex((row) => row.id === params.id),
        1,
      )
      return HttpResponse.json({ ok: true, deletedCustomerId: params.id })
    }),
    http.get('/api/admin/customers/:id/tax-exemption/', ({ params }) => {
      calls.push({ method: 'GET', path: `/api/admin/customers/${params.id}/tax-exemption/` })
      return HttpResponse.json(taxExemption)
    }),
    http.post('/api/admin/customers/:id/tax-status/', async ({ params, request }) => {
      const body = (await request.json()) as { status: string }
      calls.push({ method: 'POST', path: `/api/admin/customers/${params.id}/tax-status/`, body })
      const reviewedAt = '2026-09-12T09:30:00Z'
      taxExemption = {
        ...taxExemption,
        status: body.status,
        tax: { ...taxExemption.tax, reviewedAt, reviewedBy: 'ada@example.com' },
      }
      const index = customers.findIndex((row) => row.id === params.id)
      if (index >= 0) customers[index] = { ...customers[index], taxStatus: body.status }
      return HttpResponse.json({
        ok: true,
        status: body.status,
        reviewedAt,
        reviewedBy: 'ada@example.com',
      })
    }),
  ]
  return { handlers, calls }
}
