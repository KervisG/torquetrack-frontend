// Un cero guardado en el catálogo no es un precio de venta.
export function hasListedPrice(value: number | undefined): boolean {
  return Number(value) > 0
}

export function formatMoney(value: number | undefined): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(value || 0))
}
