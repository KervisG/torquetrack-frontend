import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'

import { FormError } from '@/components/form-error'
import { PageHeader } from '@/components/app-shell/page-header'
import { Badge } from '@/components/ui/badge'
import { PermissionNotice } from '@/features/admin/auth/components/permission-notice'
import { useAdminPermissions } from '@/features/admin/auth/hooks/use-admin-permissions'
import { formatMoney } from '@/lib/money'

import { listAdminCarts } from '../api'
import { cartLabel, formatCartUpdated } from '../components/carts-table'
import { adminCartKeys } from '../query-keys'

// La API no tiene un GET por id: el detalle sale del listado (y de su cache).
export function CartDetailPage() {
  const { id = '' } = useParams()
  const { can } = useAdminPermissions()
  const allowed = can('carts.view')
  const carts = useQuery({
    queryKey: adminCartKeys.list(),
    queryFn: listAdminCarts,
    enabled: allowed,
  })

  if (!allowed) {
    return <PermissionNotice title="Cart" message="You do not have permission to view carts." />
  }

  const back = { to: '/admin/carts', label: 'All carts' }

  if (carts.isPending) {
    return (
      <section>
        <PageHeader title="Cart" back={back} />
        <p className="text-sm text-muted-foreground">Loading cart…</p>
      </section>
    )
  }
  if (carts.error) {
    return (
      <section>
        <PageHeader title="Cart" back={back} />
        <FormError error={carts.error} />
      </section>
    )
  }

  const cart = carts.data.find((row) => row.id === id)
  if (!cart) {
    return (
      <section>
        <PageHeader title="Cart" back={back} />
        <p className="text-sm text-muted-foreground">Cart not found.</p>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title={cartLabel(cart)}
        back={back}
        meta={<Badge variant={cart.status === 'ACTIVE' ? 'secondary' : 'outline'}>{cart.status}</Badge>}
        description={`Updated ${formatCartUpdated(cart.updatedAt)}`}
      />
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Email</dt>
          <dd className="font-medium">{cart.email || '—'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Stage</dt>
          <dd className="font-medium">{cart.stage || '—'}</dd>
        </div>
      </dl>
      <div className="overflow-x-auto rounded-lg border border-foreground/15 bg-background">
        <table aria-label="Cart items" className="w-full text-left text-sm">
          <thead className="border-b text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Part</th>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 text-right font-medium">Qty</th>
              <th className="px-4 py-3 text-right font-medium">Price when added</th>
            </tr>
          </thead>
          <tbody>
            {cart.items.map((item) => (
              <tr key={item.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-4">{item.partNumber || '—'}</td>
                <td className="px-4 py-4">{item.title || item.id}</td>
                <td className="px-4 py-4 text-right">{item.quantity}</td>
                <td className="px-4 py-4 text-right">
                  {item.priceAtAdd == null ? '—' : formatMoney(item.priceAtAdd)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
