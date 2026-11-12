import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useParams } from 'react-router-dom'

import { FormError } from '@/components/form-error'
import { PageHeader } from '@/components/app-shell/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PermissionNotice } from '@/features/admin/auth/components/permission-notice'
import { useAdminPermissions } from '@/features/admin/auth/hooks/use-admin-permissions'

import { listCustomers } from '../api'
import { TaxExemptionReview } from '../components/tax-exemption-review'
import { adminCustomerKeys } from '../query-keys'
import { customerLabel, portalLabel } from '../types'

// La API no tiene un GET por id: el perfil sale del mismo listado (y de su
// cache), y la revisión fiscal de `tax-exemption`, con su propio permiso.
export function CustomerDetailPage() {
  const { id = '' } = useParams()
  const { can } = useAdminPermissions()
  const allowed = can('customers.view')
  const customers = useQuery({
    queryKey: adminCustomerKeys.list(),
    queryFn: listCustomers,
    enabled: allowed,
  })

  if (!allowed) {
    return (
      <PermissionNotice
        title="Customer"
        message="You do not have permission to view customers."
      />
    )
  }

  const back = { to: '/admin/customers', label: 'All customers' }

  if (customers.isPending) {
    return (
      <section>
        <PageHeader title="Customer" back={back} />
        <p className="text-sm text-muted-foreground">Loading customer…</p>
      </section>
    )
  }
  if (customers.error) {
    return (
      <section>
        <PageHeader title="Customer" back={back} />
        <FormError error={customers.error} />
      </section>
    )
  }

  const customer = customers.data.find((row) => row.id === id)
  if (!customer) {
    return (
      <section>
        <PageHeader title="Customer" back={back} />
        <p className="text-sm text-muted-foreground">Customer not found.</p>
      </section>
    )
  }

  const address = [
    customer.address1,
    customer.address2,
    [customer.city, [customer.state, customer.zip].filter(Boolean).join(' ')]
      .filter(Boolean)
      .join(', '),
  ].filter(Boolean)

  return (
    <section className="space-y-4">
      <PageHeader
        title={customerLabel(customer)}
        back={back}
        description={customer.company && customer.name ? customer.company : undefined}
      />
      {/* Perfil compacto a la izquierda; la revisión fiscal ocupa el ancho principal. */}
      <div className="grid items-start gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base" id="customer-profile-title">
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <dl
              role="region"
              aria-labelledby="customer-profile-title"
              className="space-y-2 text-sm"
            >
              <Detail label="Name" value={customer.name} />
              <Detail label="Company" value={customer.company} />
              <Detail
                label="Email"
                value={customer.email ?? ''}
                href={customer.email ? `mailto:${customer.email}` : undefined}
              />
              <Detail
                label="Phone"
                value={customer.phone}
                href={customer.phone ? `tel:${customer.phone}` : undefined}
              />
              {address.length ? (
                <Row label="Address">
                  {address.map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </Row>
              ) : null}
              <Row label="Portal">
                <Badge variant={customer.portalStatus === 'ACTIVE' ? 'default' : 'secondary'}>
                  {portalLabel(customer.portalStatus)}
                </Badge>
              </Row>
              <Row label="Tax status">
                <Badge variant="outline">{customer.taxStatus}</Badge>
              </Row>
              <Detail label="Tax ID" value={customer.taxIdMasked} />
            </dl>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base" id="customer-tax-title">
              Tax exemption
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0" role="region" aria-labelledby="customer-tax-title">
            {can('tax_exemptions.review') ? (
              <TaxExemptionReview customerId={customer.id} />
            ) : (
              <p className="text-sm text-muted-foreground">
                You do not have permission to review tax exemptions.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[6rem_1fr] items-center gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="break-words font-medium">{children}</dd>
    </div>
  )
}

// Solo se muestran los datos cargados: un campo vacío no ocupa espacio.
function Detail({ label, value, href }: { label: string; value: string; href?: string }) {
  if (!value) return null
  return (
    <Row label={label}>
      {href ? (
        <a href={href} className="underline-offset-4 hover:underline">
          {value}
        </a>
      ) : (
        value
      )}
    </Row>
  )
}
