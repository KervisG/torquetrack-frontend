import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'

import { FormError } from '@/components/form-error'
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

  const back = (
    <Link to="/admin/customers" className="text-sm text-muted-foreground hover:text-foreground">
      ← All customers
    </Link>
  )

  if (customers.isPending) {
    return <p className="text-sm text-muted-foreground">Loading customer…</p>
  }
  if (customers.error) {
    return <FormError error={customers.error} />
  }

  const customer = customers.data.find((row) => row.id === id)
  if (!customer) {
    return (
      <section className="space-y-3">
        {back}
        <p className="text-sm text-muted-foreground">Customer not found.</p>
      </section>
    )
  }

  const address = [
    customer.address1,
    customer.address2,
    [customer.city, customer.state, customer.zip].filter(Boolean).join(' '),
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <section className="space-y-6">
      {back}
      <h1 className="text-2xl font-semibold">{customerLabel(customer)}</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg" id="customer-profile-title">
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl
            role="region"
            aria-labelledby="customer-profile-title"
            className="grid gap-3 text-sm sm:grid-cols-2"
          >
            <Detail label="Name" value={customer.name} />
            <Detail label="Company" value={customer.company} />
            <Detail label="Email" value={customer.email ?? ''} />
            <Detail label="Phone" value={customer.phone} />
            <Detail label="Address" value={address} />
            <Detail label="Portal" value={portalLabel(customer.portalStatus)} />
            <Detail label="Tax status" value={customer.taxStatus} />
            <Detail label="Tax ID" value={customer.taxIdMasked} />
          </dl>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg" id="customer-tax-title">
            Tax exemption
          </CardTitle>
        </CardHeader>
        <CardContent role="region" aria-labelledby="customer-tax-title">
          {can('tax_exemptions.review') ? (
            <TaxExemptionReview customerId={customer.id} />
          ) : (
            <p className="text-sm text-muted-foreground">
              You do not have permission to review tax exemptions.
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value || '—'}</dd>
    </div>
  )
}
