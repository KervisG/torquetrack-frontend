import type { AdminQuoteValues } from '@/lib/validators/admin-quote'

import type { AdminQuote } from './types'

// Valores del formulario para una cotización guardada. La usan el editor y el
// modo edición del detalle. Un override guardado se vuelve a mostrar solo a
// quien puede fijarlo; sin el permiso el guardado recalcula el impuesto.
export function quoteFormValues(quote: AdminQuote, canOverrideTax: boolean): AdminQuoteValues {
  const overriding = canOverrideTax && quote.taxSource === 'manual'
  return {
    status: quote.status,
    customer: { ...quote.customer },
    vehicle: { ...quote.vehicle },
    items: quote.items.map((item) => ({
      productId: item.productId,
      title: item.title,
      partNumber: item.partNumber,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      coreCharge: item.coreCharge,
    })),
    shipping: quote.shipping,
    shippingAddress: { ...quote.shippingAddress },
    tax: quote.tax,
    taxOverride: { enabled: overriding, reason: overriding ? quote.taxOverrideReason : '' },
    memo: quote.memo,
  }
}

// Los datos que el formulario necesita sobre el impuesto ya guardado.
export function savedQuoteTax(quote: AdminQuote) {
  return { amount: quote.tax, source: quote.taxSource, description: quote.taxDescription }
}
