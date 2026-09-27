import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { FormError } from '@/components/form-error'
import { FormField } from '@/components/form-field'
import { ListPagination, usePagedRows } from '@/components/list-pagination'
import { PageHeader } from '@/components/app-shell/page-header'
import { Button } from '@/components/ui/button'
import { PermissionNotice } from '@/features/admin/auth/components/permission-notice'
import { useAdminPermissions } from '@/features/admin/auth/hooks/use-admin-permissions'

import { listAdminCarts } from '../api'
import { CartsTable } from '../components/carts-table'
import { adminCartKeys } from '../query-keys'
import type { AdminCart } from '../types'

const STATUS_TABS = ['ALL', 'ACTIVE', 'ABANDONED', 'BUILDING_QUOTE', 'CHECKOUT'] as const

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
  const paged = usePagedRows(rows, `${search}|${status}`)

  if (!allowed) {
    return <PermissionNotice title="Carts" message="You do not have permission to view carts." />
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Carts"
        description="Open carts, including ones that have gone quiet and ones being turned into quotes."
      />
      <div className="space-y-4">
        <div role="tablist" aria-label="Cart status" className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <Button
              key={tab}
              type="button"
              role="tab"
              size="sm"
              variant={status === tab ? 'default' : 'ghost'}
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
        ) : (
          <>
            <CartsTable carts={paged.items} />
            {rows.length > 0 ? (
              <ListPagination
                page={paged.page}
                pageCount={paged.pageCount}
                total={paged.total}
                from={paged.from}
                to={paged.to}
                onPage={paged.setPage}
              />
            ) : null}
          </>
        )}
      </div>
    </section>
  )
}
