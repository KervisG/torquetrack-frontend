import { customerAddress, type OrderCustomer } from '../types'

export function CustomerDetails({ customer }: { customer: OrderCustomer }) {
  return (
    <dl className="grid gap-4 text-sm sm:grid-cols-2">
      <Detail label="Name" value={customer.name} />
      <Detail label="Company" value={customer.company} />
      <Detail label="Email" value={customer.email} />
      <Detail label="Phone" value={customer.phone} />
      <div className="sm:col-span-2">
        <Detail label="Address" value={customerAddress(customer)} />
      </div>
    </dl>
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
