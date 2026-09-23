// Valores que acepta `POST /api/admin/customers/<id>/tax-status/`.
export const TAX_STATUSES = [
  'PENDING VERIFICATION',
  'VERIFIED',
  'REJECTED',
  'EXPIRED',
  'NOT SUBMITTED',
] as const

export type AdminCustomer = {
  id: string
  email: string | null
  name: string
  company: string
  phone: string
  address1: string
  address2: string
  city: string
  state: string
  zip: string
  // `ACTIVE` es un perfil con cuenta; `INVITED` tiene una invitación vigente.
  portalStatus: string
  taxStatus: string
  taxIdMasked: string
}

export type TaxExemption = {
  id: string
  email: string | null
  status: string
  tax: {
    company: string
    taxId: string
    taxState: string
    taxExemptionType: string
    certificateName: string
    // Data URL en base64, tal como lo subió el cliente.
    certificateData: string
    submittedAt: Date | null
    reviewedAt: Date | null
    reviewedBy: string | null
  }
}

export function customerLabel(customer: Pick<AdminCustomer, 'name' | 'company' | 'email'>): string {
  return customer.name || customer.company || customer.email || 'Customer'
}

export function portalLabel(status: string): string {
  if (status === 'ACTIVE') return 'Has account'
  if (status === 'INVITED') return 'Invited'
  return 'No account'
}
