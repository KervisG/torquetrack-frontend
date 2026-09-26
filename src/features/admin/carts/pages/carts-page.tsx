import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { FormError } from '@/components/form-error'
import { FormField } from '@/components/form-field'
import { PageHeader } from '@/components/app-shell/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PermissionNotice } from '@/features/admin/auth/components/permission-notice'
import { useAdminPermissions } from '@/features/admin/auth/hooks/use-admin-permissions'

import { listAdminCarts } from '../api'
import { adminCartKeys } from '../query-keys'
import type { AdminCart } from '../types'

const STATUS_TABS = ['ALL', 'ACTIVE', 'ABANDONED', 'BUILDING_QUOTE', 'CHECKOUT'] as const

const updatedFormat = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function matches(cart: AdminCart, search: string, status: string): boolean {
  if (status !== 'ALL' && cart.status !== status) return false
  const needle = search.trim().toLowerCase()
  if (!needle) return true
  return [cart.id, cart.email, cart.status, ...cart.items.flatMap((item) => [item.title, item.partNumber, item.id])]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(needle))
}

export function CartsPage() {
  const { can } = useAdminPermissions()
  const allowed = can('carts.view')
  const [params, setParams] = useSearchParams()
  const status = params.get('status')?.toUpperCase() || 'ALL'
  const search = params.get('q') ?? ''
  const carts = useQuery({
    queryKey: adminCartKeys.list(),
    queryFn: listAdminCarts,
    enabled: allowed,
  })
  const rows = useMemo(
    () => (carts.data ?? []).filter((cart) => matches(cart, search, status)),
    [carts.data, search, status],
  )

  if (!allowed) {
    return <PermissionNotice title="Carts" message="You do not have permission to view carts." />
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Carts"
        description="Open carts, including ones that have gone quiet and ones being turned into quotes."
      />
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div role="tablist" aria-label="Cart status" className="flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => (
              <Button
                key={tab}
                type="button"
                role="tab"
                size="sm"
                variant={status === tab ? 'default' : 'outline'}
                aria-selected={status === tab}
                onClick={() => {
                  const next = new URLSearchParams(params)
                  if (tab === 'ALL') next.delete('status')
                  else next.set('status', tab)
                  setParams(next, { replace: true })
                }}
              >
                {tab === 'ALL' ? 'All' : tab.replaceAll('_', ' ')}
              </Button>
            ))}
          </div>
          <FormField
            id="cart-search"
            label="Search carts"
            placeholder="Cart, email or part"
            value={search}
            onChange={(event) => {
              const next = new URLSearchParams(params)
              const value = event.target.value
              if (value) next.set('q', value)
              else next.delete('q')
              setParams(next, { replace: true })
            }}
          />
          {carts.isPending ? (
            <p className="text-sm text-muted-foreground">Loading carts…</p>
          ) : carts.error ? (
            <FormError error={carts.error} />
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No carts found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table aria-label="Carts" className="w-full text-left text-sm">
                <thead className="border-b text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Cart</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 pr-4 font-medium">Items</th>
                    <th className="py-2 font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((cart) => (
                    <tr key={cart.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">
                        <p className="font-medium">{cart.id}</p>
                        {cart.email ? <p className="text-muted-foreground">{cart.email}</p> : null}
                      </td>
                      <td className="py-2 pr-4">
                        <Badge variant={cart.status === 'ACTIVE' ? 'secondary' : 'outline'}>
                          {cart.status}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4">
                        {cart.items.map((item) => item.title || item.partNumber || item.id).join(', ') ||
                          `${cart.items.length}`}
                      </td>
                      <td className="py-2">{updatedFormat.format(cart.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
