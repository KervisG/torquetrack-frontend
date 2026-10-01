// Valores supuestos de las políticas, pendientes de confirmar por el dueño.
// El backend no los define: cambiarlos aquí actualiza todas las páginas.
export const POLICY_LAST_UPDATED = { label: 'October 1, 2026', iso: '2026-10-01' }
export const PROCESSING_BUSINESS_DAYS = '1–2'
export const DAMAGE_REPORT_DAYS = 5
export const RETURN_WINDOW_DAYS = 30
export const RESTOCKING_FEE_PERCENT = 15
export const REFUND_PROCESSING_BUSINESS_DAYS = 5
export const CORE_RETURN_WINDOW_DAYS = 30
export const GOVERNING_STATE = 'Florida'

export const POLICY_PAGES = [
  { to: '/policies/shipping', title: 'Shipping Policy' },
  { to: '/policies/returns', title: 'Returns & Refunds' },
  { to: '/policies/privacy', title: 'Privacy Policy' },
  { to: '/policies/terms', title: 'Terms of Service' },
]
