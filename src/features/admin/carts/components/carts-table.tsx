import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'

import type { AdminCart } from '../types'

const updatedFormat = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function formatCartUpdated(value: Date): string {
  return updatedFormat.format(value)
}

export function cartLabel(cart: AdminCart): string {
  return cart.email || 'Guest'
}

function itemCount(cart: AdminCart): string {
  const count = cart.items.length
  return count === 1 ? '1 item' : `${count} items`
}

export function CartsTable({ carts }: { carts: AdminCart[] }) {
  if (!carts.length) {
    return <p className="text-sm text-muted-foreground">No carts found.</p>
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-foreground/15 bg-background">
      <table aria-label="Carts" className="w-full text-left text-sm">
        <thead className="border-b text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Customer</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Items</th>
            <th className="px-4 py-3 font-medium">Updated</th>
          </tr>
        </thead>
        <tbody>
          {carts.map((cart) => (
            // El enlace cubre la fila. El nombre accesible es el cliente, no el id.
            <tr key={cart.id} className="group relative border-b border-border/60 last:border-0 hover:bg-muted/50">
              <td className="px-4 py-4">
                <Link
                  to={`/admin/carts/${encodeURIComponent(cart.id)}`}
                  className="font-medium after:absolute after:inset-0 after:content-[''] group-hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {cartLabel(cart)}
                </Link>
              </td>
              <td className="px-4 py-4">
                <Badge variant={cart.status === 'ACTIVE' ? 'secondary' : 'outline'}>{cart.status}</Badge>
              </td>
              <td className="px-4 py-4">{itemCount(cart)}</td>
              <td className="px-4 py-4">{formatCartUpdated(cart.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
