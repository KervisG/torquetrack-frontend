import { formatMoney } from '@/lib/money'

import { formatPercent } from '../format'
import type { TopProduct } from '../types'

// La barra muestra qué parte de los ingresos del período aportó cada producto.
// Es una proporción para leer de un vistazo; los montos son los del backend.
export function TopProductsTable({ rows, periodRevenue }: { rows: TopProduct[]; periodRevenue: number }) {
  if (!rows.length) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No products sold in this period.</p>
  }

  const base = periodRevenue > 0 ? periodRevenue : Math.max(...rows.map((row) => row.revenue), 1)

  return (
    <div className="-mx-4 overflow-x-auto sm:mx-0">
      <table className="w-full min-w-[30rem] text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th scope="col" className="py-2 pl-4 pr-3 font-medium sm:pl-0">Product</th>
            <th scope="col" className="px-3 py-2 text-right font-medium">Units</th>
            <th scope="col" className="py-2 pl-3 pr-4 text-right font-medium sm:pr-0">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const share = Math.min(100, (row.revenue / base) * 100)
            return (
              <tr key={row.productId} className="border-b last:border-0">
                <td className="py-3 pl-4 pr-3 sm:pl-0">
                  <p className="font-medium leading-snug">{row.title}</p>
                  <p className="text-xs text-muted-foreground">Part # {row.partNumber || '—'}</p>
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{row.units}</td>
                <td className="py-3 pl-3 pr-4 sm:pr-0">
                  <p className="text-right font-medium tabular-nums">{formatMoney(row.revenue)}</p>
                  <div className="mt-1.5 flex items-center justify-end gap-2">
                    <span className="h-1.5 w-20 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                      <span
                        className="block h-full rounded-full"
                        style={{ width: `${share}%`, background: 'hsl(var(--chart-1))' }}
                      />
                    </span>
                    <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">
                      {formatPercent(share)}
                      <span className="sr-only"> of revenue</span>
                    </span>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
