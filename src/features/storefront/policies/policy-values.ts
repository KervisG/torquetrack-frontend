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
  {
    to: '/policies/shipping',
    title: 'Shipping Policy',
    description: 'How TorqueTrack Diesel ships diesel parts: processing times, carriers, rates and damaged deliveries.',
  },
  {
    to: '/policies/returns',
    title: 'Returns & Refunds',
    description: 'Return window, restocking fees, core returns and refund timing for TorqueTrack Diesel orders.',
  },
  {
    to: '/policies/privacy',
    title: 'Privacy Policy',
    description: 'What information TorqueTrack Diesel collects, how it is used and the choices you have.',
  },
  {
    to: '/policies/terms',
    title: 'Terms of Service',
    description: 'Terms for buying from TorqueTrack Diesel: pricing, payment, core charges, fitment and emissions parts.',
  },
]
