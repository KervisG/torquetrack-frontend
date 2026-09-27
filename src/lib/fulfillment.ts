// Estados de envío y transportistas que devuelve el backend
// (`FulfillmentStatus` y `Carrier` de `checkout/models/order.py`). Lo usan el
// panel y el portal del cliente; el enlace de seguimiento siempre lo arma el
// backend (`trackingUrl`).
export const FULFILLMENT_STATUSES = ['UNFULFILLED', 'PREPARING', 'SHIPPED', 'DELIVERED'] as const

export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number]

export const CARRIERS = [
  { value: 'UPS', label: 'UPS' },
  { value: 'FEDEX', label: 'FedEx' },
  { value: 'USPS', label: 'USPS' },
  { value: 'OTHER', label: 'Other' },
] as const

export type Carrier = (typeof CARRIERS)[number]['value']

const STATUS_LABELS: Record<FulfillmentStatus, string> = {
  UNFULFILLED: 'Not shipped',
  PREPARING: 'Preparing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
}

export function toFulfillmentStatus(value: unknown): FulfillmentStatus {
  return FULFILLMENT_STATUSES.find((status) => status === value) ?? 'UNFULFILLED'
}

export function fulfillmentLabel(status: FulfillmentStatus): string {
  return STATUS_LABELS[status]
}

export function carrierLabel(carrier: string): string {
  return CARRIERS.find((option) => option.value === carrier)?.label ?? carrier
}

export function fulfillmentBadgeVariant(
  status: FulfillmentStatus,
): 'default' | 'secondary' | 'outline' {
  if (status === 'DELIVERED') return 'default'
  if (status === 'SHIPPED') return 'secondary'
  return 'outline'
}
