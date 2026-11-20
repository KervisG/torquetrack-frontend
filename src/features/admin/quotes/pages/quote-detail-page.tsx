import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Plus } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'

import { FormError } from '@/components/form-error'
import { PageHeader } from '@/components/app-shell/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PermissionNotice } from '@/features/admin/auth/components/permission-notice'
import { useAdminPermissions } from '@/features/admin/auth/hooks/use-admin-permissions'
import { formatDate } from '@/lib/format-date'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import { listQuotes } from '../api'
import { QuoteActions } from '../components/quote-actions'
import { QuoteCatalogPicker } from '../components/quote-catalog-picker'
import { QuoteForm } from '../components/quote-form'
import {
  EditableGroup,
  EditableItemRow,
  EditableText,
  useInlineQuoteSave,
  type SaveChange,
} from '../components/quote-inline-edit'
import { VehicleDetailsCard } from '../components/vehicle-details-card'
import { VinCheckButton } from '../components/vin-check-line'
import { useSaveQuote } from '../hooks/use-save-quote'
import { adminQuoteKeys } from '../query-keys'
import { quoteFormValues, savedQuoteTax } from '../quote-form-values'
import type { AdminQuote, QuoteTaxSource } from '../types'

const DAY_MS = 24 * 60 * 60 * 1000

// Color por estado: activa en verde, vencida en rojo, convertida en azul.
const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'border-transparent bg-emerald-100 text-emerald-800',
  EXPIRED: 'border-transparent bg-red-100 text-red-800',
  CONVERTED: 'border-transparent bg-blue-100 text-blue-800',
}

// Lo que cada sección necesita para editar su parte con el lápiz.
type EditProps = { quote: AdminQuote; canEdit: boolean; saveChange: SaveChange }

// La API no tiene un GET por id: el detalle sale del listado (y de su cache).
export function QuoteDetailPage() {
  const { id = '' } = useParams()
  const { can } = useAdminPermissions()
  const allowed = can('quotes.view')
  const quotes = useQuery({
    queryKey: adminQuoteKeys.list(),
    queryFn: listQuotes,
    enabled: allowed,
  })
  const quote = quotes.data?.find((row) => row.id === id)
  // "Edit quote" abre el formulario completo en la misma hoja; los lápices
  // cambian un dato a la vez sin salir de la vista.
  const [editing, setEditing] = useState(false)
  const [dirty, setDirty] = useState(false)
  const save = useSaveQuote(quote, () => setEditing(false))
  const { saveChange } = useInlineQuoteSave(quote)

  if (!allowed) {
    return <PermissionNotice title="Quote" message="You do not have permission to view quotes." />
  }

  const back = { to: '/admin/quotes', label: 'All quotes' }

  if (quotes.isPending) {
    return (
      <section>
        <PageHeader title="Quote" back={back} />
        <p className="text-sm text-muted-foreground">Loading quote…</p>
      </section>
    )
  }
  if (quotes.error) {
    return (
      <section>
        <PageHeader title="Quote" back={back} />
        <FormError error={quotes.error} />
      </section>
    )
  }

  if (!quote) {
    return (
      <section>
        <PageHeader title="Quote" back={back} />
        <p className="text-sm text-muted-foreground">Quote not found.</p>
      </section>
    )
  }

  if (editing) {
    const canOverrideTax = can('tax_exemptions.review')
    const cancel = () => {
      if (dirty && !window.confirm('Discard your changes to this quote?')) return
      save.reset()
      setDirty(false)
      setEditing(false)
    }
    return (
      <section className="mx-auto max-w-4xl">
        <QuoteHeader quote={quote} back={back} />
        <div className="mt-6 border-t pt-5">
          <QuoteForm
            key={quote.id}
            layout="single"
            defaultValues={quoteFormValues(quote, canOverrideTax)}
            quoteId={quote.id}
            customerId={quote.customerId ?? undefined}
            editing
            canOverrideTax={canOverrideTax}
            savedTax={savedQuoteTax(quote)}
            canSearchCatalog={can('products.view')}
            submitting={save.isPending}
            error={save.error}
            onSubmit={(values) => save.mutate(values)}
            onCancel={cancel}
            onDirtyChange={setDirty}
          />
        </div>
      </section>
    )
  }

  // Una cotización convertida ya tiene pedido: el backend no la deja editar.
  const edit: EditProps = {
    quote,
    canEdit: can('quotes.create') && quote.status !== 'CONVERTED',
    saveChange,
  }

  // Todo el ancho: las líneas y los totales a la izquierda, el contexto de la
  // cotización a la derecha. Cada dato tiene su lápiz.
  return (
    <section>
      <QuoteHeader quote={quote} back={back} />
      <div className="mt-4">
        <QuoteActions quote={quote} can={can} onEdit={() => setEditing(true)} />
      </div>
      <div className="mt-6 grid gap-8 border-t pt-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          <ItemsSection {...edit} canSearchCatalog={can('products.view')} />
          <div className="flex justify-end border-t pt-5">
            <div className="w-full max-w-xs">
              <QuoteTotals {...edit} />
            </div>
          </div>
        </div>
        <aside className="space-y-6 lg:border-l lg:pl-8">
          <CustomerSection {...edit} />
          <VehicleSection {...edit} />
          <ShippingSection {...edit} />
          <NotesSection {...edit} />
        </aside>
      </div>
    </section>
  )
}

// El total es lo primero que se busca: va arriba, junto al número.
function QuoteHeader({ quote, back }: { quote: AdminQuote; back: { to: string; label: string } }) {
  const facts = [
    expiryLabel(quote),
    `${quote.items.length} ${quote.items.length === 1 ? 'item' : 'items'}`,
    quote.createdBy ? `By ${quote.createdBy}` : '',
  ].filter(Boolean)

  return (
    <header className="space-y-2">
      <Link
        to={back.to}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        {back.label}
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{`Quote ${quote.number}`}</h1>
            <Badge variant="outline" className={cn(STATUS_STYLES[quote.status])}>
              {statusLabel(quote.status)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {facts.join(' · ')}
            {quote.orderNumber ? ` · Order ${quote.orderNumber}` : ''}
          </p>
        </div>
        <p className="text-3xl font-semibold tabular-nums">{formatMoney(quote.totals.total)}</p>
      </div>
    </header>
  )
}

// Sin `customerId` la cotización solo guarda el snapshot de contacto: se
// muestra como contacto de la cotización, distinto de una cuenta de cliente.
function CustomerSection({ quote, canEdit, saveChange }: EditProps) {
  const { name, company, email, phone } = quote.customer
  const linked = Boolean(quote.customerId)
  const tax = taxLabel(quote.taxSource, quote.taxDescription)
  const field = (key: 'name' | 'company' | 'email' | 'phone') => (value: string) =>
    saveChange((values) => ({ ...values, customer: { ...values.customer, [key]: value } }))

  return (
    <Section
      title={linked ? 'Customer' : 'Quote contact'}
      badge={
        <Badge
          variant={linked ? 'default' : 'secondary'}
          title={linked ? undefined : 'Saved on this quote only. No customer account was created.'}
        >
          {linked ? 'Account' : 'No account'}
        </Badge>
      }
    >
      <dl className="space-y-1 text-sm">
        <Row label="Name">
          <EditableText label="name" value={name} canEdit={canEdit} onSave={field('name')} />
        </Row>
        <Row label="Company">
          <EditableText label="company" value={company} canEdit={canEdit} onSave={field('company')} />
        </Row>
        <Row label="Email">
          <EditableText
            label="email"
            type="email"
            value={email}
            display={email ? <a href={`mailto:${email}`} className="hover:underline">{email}</a> : undefined}
            canEdit={canEdit}
            onSave={field('email')}
          />
        </Row>
        <Row label="Phone">
          <EditableText
            label="phone"
            type="tel"
            value={phone}
            display={phone ? <a href={`tel:${phone}`} className="hover:underline">{phone}</a> : undefined}
            canEdit={canEdit}
            onSave={field('phone')}
          />
        </Row>
        {tax ? (
          <Row label="Tax">
            <span className="text-muted-foreground">{tax}</span>
          </Row>
        ) : null}
      </dl>
      {linked && quote.customerId ? (
        <Link
          to={`/admin/customers/${encodeURIComponent(quote.customerId)}`}
          className="inline-block text-sm font-medium underline-offset-4 hover:underline"
        >
          View customer
        </Link>
      ) : null}
    </Section>
  )
}

const VEHICLE_FIELDS = [
  { key: 'year', label: 'Year', className: 'col-span-2' },
  { key: 'make', label: 'Make', className: 'col-span-4' },
  { key: 'model', label: 'Model', className: 'col-span-4' },
  { key: 'engine', label: 'Engine', className: 'col-span-2' },
  { key: 'vin', label: 'VIN', className: 'col-span-6' },
] as const

function VehicleSection({ quote, canEdit, saveChange }: EditProps) {
  const label = vehicleLabel(quote)
  if (!label && !canEdit) return null
  const { year, make, model, engine, vin } = quote.vehicle
  return (
    <Section title="Vehicle">
      <EditableGroup
        label="vehicle"
        fields={[...VEHICLE_FIELDS]}
        values={{ year, make, model, engine, vin }}
        canEdit={canEdit}
        onSave={(next) => saveChange((values) => ({ ...values, vehicle: { ...values.vehicle, ...next } }))}
      >
        {label ? (
          <p className="text-sm font-medium">{label}</p>
        ) : (
          <p className="text-sm text-muted-foreground">No vehicle</p>
        )}
      </EditableGroup>
      <VehicleDetailsCard vehicle={quote.vehicle} showHeadline={false} />
    </Section>
  )
}

const ADDRESS_FIELDS = [
  { key: 'address1', label: 'Address', className: 'col-span-6' },
  { key: 'city', label: 'City', className: 'col-span-3' },
  { key: 'state', label: 'State', className: 'col-span-1' },
  { key: 'zip', label: 'ZIP', className: 'col-span-2' },
] as const

function ShippingSection({ quote, canEdit, saveChange }: EditProps) {
  const { address1, city, state, zip } = quote.shippingAddress
  const cityLine = [city, [state, zip].filter(Boolean).join(' ')].filter(Boolean).join(', ')
  if (!address1 && !cityLine && !canEdit) return null
  return (
    <Section title="Ship to">
      <EditableGroup
        label="shipping address"
        fields={[...ADDRESS_FIELDS]}
        values={{ address1, city, state, zip }}
        canEdit={canEdit}
        onSave={(next) =>
          saveChange((values) => ({ ...values, shippingAddress: { ...values.shippingAddress, ...next } }))
        }
      >
        {address1 || cityLine ? (
          <address className="text-sm not-italic">
            {address1 ? <div>{address1}</div> : null}
            {cityLine ? <div>{cityLine}</div> : null}
          </address>
        ) : (
          <p className="text-sm text-muted-foreground">No address</p>
        )}
      </EditableGroup>
    </Section>
  )
}

function NotesSection({ quote, canEdit, saveChange }: EditProps) {
  const emailed = quote.lastEmailedAt
    ? `${formatDate(quote.lastEmailedAt)} to ${quote.lastEmailedTo}`
    : ''
  if (!quote.memo && !emailed && !canEdit) return null
  return (
    <Section title="Notes">
      <dl className="space-y-1 text-sm">
        <Row label="Memo">
          <EditableText
            label="memo"
            value={quote.memo}
            canEdit={canEdit}
            onSave={(memo) => saveChange((values) => ({ ...values, memo }))}
          />
        </Row>
        {emailed ? (
          <Row label="Emailed">
            <span className="text-muted-foreground">{emailed}</span>
          </Row>
        ) : null}
      </dl>
    </Section>
  )
}

// El número de parte va bajo la descripción y la columna Core solo aparece si
// alguna línea tiene core: menos columnas casi vacías.
function ItemsSection({ quote, canEdit, saveChange, canSearchCatalog }: EditProps & { canSearchCatalog: boolean }) {
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const { items } = quote
  const showCore = items.some((item) => item.coreCharge > 0)

  return (
    <Section title="Items">
      {items.length ? (
        <div className="overflow-x-auto">
          <table aria-label="Items" className="w-full text-left text-sm">
            <thead className="border-b text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="pb-2 pr-4 font-medium">Item</th>
                <th className="pb-2 pr-4 text-right font-medium">Qty</th>
                <th className="pb-2 pr-4 text-right font-medium">Unit price</th>
                {showCore ? <th className="pb-2 pr-4 text-right font-medium">Core</th> : null}
                {canEdit ? <th className="pb-2" aria-label="Actions" /> : null}
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <EditableItemRow
                  key={`${item.productId ?? item.partNumber}-${index}`}
                  item={item}
                  showCore={showCore}
                  canEdit={canEdit}
                  onSave={(line) =>
                    saveChange((values) => ({
                      ...values,
                      items: values.items.map((row, at) => (at === index ? { ...row, ...line } : row)),
                    }))
                  }
                  onRemove={() =>
                    saveChange((values) => ({
                      ...values,
                      items: values.items.filter((_, at) => at !== index),
                    }))
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No items.</p>
      )}
      {canEdit ? (
        adding ? (
          <div className="space-y-2 rounded-md border p-3">
            <QuoteCatalogPicker
              vehicle={quote.vehicle}
              canSearch={canSearchCatalog}
              onAdd={async (line) => {
                const message = await saveChange((values) => ({ ...values, items: [...values.items, line] }))
                setAddError(message)
                if (!message) setAdding(false)
              }}
            />
            {addError ? <p className="text-xs text-destructive">{addError}</p> : null}
            <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>
              Done
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-start gap-1">
            <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(true)}>
              <Plus className="size-4" aria-hidden="true" />
              Add item
            </Button>
            <VinCheckButton quote={quote} saveChange={saveChange} />
          </div>
        )
      ) : null}
    </Section>
  )
}

// Los totales salen tal cual de la API (nunca se suman aquí); las filas en
// cero se ocultan, salvo el subtotal, el envío (editable) y el total.
function QuoteTotals({ quote, canEdit, saveChange }: EditProps) {
  const { totals } = quote
  const money = (label: string, value: number | undefined) => (
    <div key={label} className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{formatMoney(value)}</dd>
    </div>
  )
  return (
    <dl aria-label="Totals" className="space-y-1 text-sm">
      {money('Subtotal', totals.subtotal)}
      {totals.core ? money('Core charges', totals.core) : null}
      <div className="flex items-center justify-between gap-2">
        <dt className="text-muted-foreground">Shipping</dt>
        <dd className="tabular-nums">
          <EditableText
            label="shipping"
            type="number"
            value={String(quote.shipping)}
            display={formatMoney(totals.shipping)}
            canEdit={canEdit}
            onSave={(value) => saveChange((values) => ({ ...values, shipping: Number(value) }))}
          />
        </dd>
      </div>
      {totals.tax ? money('Tax', totals.tax) : null}
      <Separator className="my-1" />
      <div className="flex justify-between text-base font-semibold">
        <dt>Total</dt>
        <dd className="tabular-nums">{formatMoney(totals.total)}</dd>
      </div>
    </dl>
  )
}

function statusLabel(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase()
}

function expiryLabel(quote: AdminQuote): string {
  if (!quote.expiresAt) return `Created ${formatDate(quote.createdAt)}`
  if (quote.status === 'EXPIRED') return `Expired ${formatDate(quote.expiresAt)}`
  if (quote.status === 'CONVERTED') return `Created ${formatDate(quote.createdAt)}`
  const days = Math.ceil((quote.expiresAt.getTime() - Date.now()) / DAY_MS)
  if (days < 0) return `Expired ${formatDate(quote.expiresAt)}`
  if (days === 0) return 'Expires today'
  return `Expires in ${days} ${days === 1 ? 'day' : 'days'}`
}

function taxLabel(source: QuoteTaxSource, description: string): string {
  const labels: Record<QuoteTaxSource, string> = {
    calculated: 'Calculated',
    exempt: 'Exempt',
    manual: 'Manual override',
    '': '',
  }
  // La descripción guardada a veces repite la etiqueta ("Manual override").
  const extra = description.trim().toLowerCase() === labels[source].toLowerCase() ? '' : description
  return [labels[source], extra].filter(Boolean).join(' · ')
}

function vehicleLabel(quote: AdminQuote): string {
  const { year, make, model, engine, vin } = quote.vehicle
  const name = [year, make, model, engine].filter(Boolean).join(' ')
  return [name, vin ? `VIN ${vin}` : ''].filter(Boolean).join(' · ')
}

// Un bloque de contexto: título chico y contenido.
function Section({ title, badge, children }: { title: string; badge?: ReactNode; children: ReactNode }) {
  return (
    <section className="min-w-0 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
        {badge}
      </div>
      {children}
    </section>
  )
}

// Etiqueta y valor en dos columnas.
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[5rem_minmax(0,1fr)] items-center gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 font-medium">{children}</dd>
    </div>
  )
}
