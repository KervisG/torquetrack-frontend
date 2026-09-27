import type { ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { formatMoney } from '@/lib/money'

import { formatDate } from '@/lib/format-date'

type Column = { label: string; value: (row: DocumentRow) => ReactNode }

type DocumentRow = {
  id: string
  number: string
  status: string
  createdAt: Date
  total?: number
  extra?: string
  shipment?: ReactNode
}

type DocumentsTableProps = {
  label: string
  numberLabel: string
  extraLabel?: string
  shipmentLabel?: string
  rows: DocumentRow[]
  emptyMessage: string
}

// Tabla presentacional compartida por pedidos y cotizaciones. El total es
// el que devolvió la API; nunca se recalcula.
export function DocumentsTable({
  label,
  numberLabel,
  extraLabel,
  shipmentLabel,
  rows,
  emptyMessage,
}: DocumentsTableProps) {
  if (!rows.length) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>
  }

  const columns: Column[] = [{ label: 'Date', value: (row) => formatDate(row.createdAt) }]
  if (extraLabel) columns.push({ label: extraLabel, value: (row) => row.extra ?? '—' })
  if (shipmentLabel) columns.push({ label: shipmentLabel, value: (row) => row.shipment ?? '—' })

  return (
    <div className="overflow-x-auto">
      <table aria-label={label} className="w-full text-left text-sm">
        <thead className="border-b text-muted-foreground">
          <tr>
            <th className="py-2 pr-4 font-medium">{numberLabel}</th>
            {columns.map((column) => (
              <th key={column.label} className="py-2 pr-4 font-medium">
                {column.label}
              </th>
            ))}
            <th className="py-2 pr-4 font-medium">Status</th>
            <th className="py-2 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b last:border-0">
              <td className="py-2 pr-4 font-medium">{row.number}</td>
              {columns.map((column) => (
                <td key={column.label} className="py-2 pr-4">
                  {column.value(row)}
                </td>
              ))}
              <td className="py-2 pr-4">
                <Badge variant="secondary">{row.status}</Badge>
              </td>
              <td className="py-2 text-right">{formatMoney(row.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
