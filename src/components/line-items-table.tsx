import { formatMoney } from '@/lib/money'

// Línea ya normalizada por el `api.ts` de cada feature (`qty`/`quantity`,
// `price`/`unitPrice`). `lineTotal` solo existe cuando lo calculó el backend.
export type LineItem = {
  productId?: string
  title: string
  partNumber: string
  quantity: number
  unitPrice: number
  coreCharge: number
  lineTotal?: number
}

export function LineItemsTable({ items, label = 'Items' }: { items: LineItem[]; label?: string }) {
  if (!items.length) {
    return <p className="text-sm text-muted-foreground">No items.</p>
  }

  const showLineTotal = items.every((item) => item.lineTotal !== undefined)

  return (
    <div className="overflow-x-auto">
      <table aria-label={label} className="w-full text-left text-sm">
        <thead className="border-b text-muted-foreground">
          <tr>
            <th className="py-2 pr-4 font-medium">Description</th>
            <th className="py-2 pr-4 font-medium">Part #</th>
            <th className="py-2 pr-4 text-right font-medium">Qty</th>
            <th className="py-2 pr-4 text-right font-medium">Unit price</th>
            <th className="py-2 pr-4 text-right font-medium">Core</th>
            {showLineTotal ? <th className="py-2 text-right font-medium">Line total</th> : null}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={`${item.productId ?? item.partNumber}-${index}`} className="border-b last:border-0">
              <td className="py-2 pr-4">{item.title || '—'}</td>
              <td className="py-2 pr-4">{item.partNumber || '—'}</td>
              <td className="py-2 pr-4 text-right">{item.quantity}</td>
              <td className="py-2 pr-4 text-right">{formatMoney(item.unitPrice)}</td>
              <td className="py-2 pr-4 text-right">{formatMoney(item.coreCharge)}</td>
              {showLineTotal ? (
                <td className="py-2 text-right">{formatMoney(item.lineTotal)}</td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
