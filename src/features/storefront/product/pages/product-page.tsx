import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'

import { CartQuantityLimit } from '@/components/cart-quantity-limit'
import { StorefrontButton } from '@/components/storefront-button'
import { getProduct } from '@/features/storefront/catalog/api'
import { ProductPhoto } from '@/features/storefront/catalog/components/product-photo'
import { categoryLabel } from '@/features/storefront/catalog/filter-products'
import { catalogKeys } from '@/features/storefront/catalog/query-keys'
import { ApiError } from '@/lib/api-client'
import { formatMoney, hasListedPrice } from '@/lib/money'
import { useCartStore } from '@/stores/cart-store'

export function ProductPage() {
  const { id = '' } = useParams()
  const add = useCartStore((state) => state.add)
  const setDrawerOpen = useCartStore((state) => state.setDrawerOpen)
  const inCart = useCartStore(
    (state) => state.items.find((line) => line.id === id)?.qty ?? 0,
  )
  const product = useQuery({
    queryKey: catalogKeys.product(id),
    queryFn: () => getProduct(id),
    enabled: Boolean(id),
  })

  if (product.isPending) {
    return <p className="px-4 py-16 text-center text-muted-foreground">Loading product…</p>
  }

  if (product.error) {
    return (
      <p className="px-4 py-16 text-center text-destructive">
        {product.error instanceof ApiError ? product.error.message : 'Unable to load products.'}
      </p>
    )
  }

  if (!product.data) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Product not found</h1>
        <p className="mt-2 text-muted-foreground">We could not find this product.</p>
        <StorefrontButton asChild tone="link" className="mt-4">
          <Link to="/">← Back to Store</Link>
        </StorefrontButton>
      </main>
    )
  }

  const item = product.data
  const priced = hasListedPrice(item.price)

  const category = item.category ? categoryLabel(item.category) : ''
  const aftermarket =
    item.aftermarketPart && item.aftermarketPart !== item.partNumber ? item.aftermarketPart : ''

  return (
    // La ficha de compra va en su columna y se queda fija al bajar.
    <main className="mx-auto grid max-w-7xl items-start gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.15fr)_18rem]">
      <div className="h-[28rem] overflow-hidden rounded-md border bg-neutral-100 lg:sticky lg:top-24 lg:h-[32rem] lg:self-start">
        <ProductPhoto
          src={item.image}
          partNumber={item.partNumber}
          className="h-full w-full object-contain p-8"
        />
      </div>
      <div>
        <StorefrontButton asChild tone="link" className="px-0 text-neutral-500">
          <Link to="/">← Back to Store</Link>
        </StorefrontButton>
        <div className="mt-5 flex flex-wrap gap-2">
          {category ? <Chip>{category}</Chip> : null}
          {item.condition ? <Chip>{item.condition}</Chip> : null}
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950">{item.title}</h1>
        <div className="mt-8 space-y-8">
          <DetailGrid
            title="Fitment"
            note={item.fitment}
            rows={[
              { label: 'Years', value: yearRange(item.yearFrom, item.yearTo) },
              { label: 'Make', value: item.make },
              { label: 'Model', value: item.model },
              { label: 'Engine', value: item.engine },
              { label: 'Engine family', value: item.engineFamily },
              { label: 'Engine code', value: item.engineCode },
            ]}
          />
          <DetailGrid
            title="Part numbers"
            rows={[
              { label: 'Part #', value: item.partNumber },
              { label: 'OEM', value: item.oemPart },
              { label: 'Aftermarket', value: aftermarket },
              { label: 'Reman', value: item.remanPart },
            ]}
          />
          <DetailGrid
            title="Details"
            rows={[
              { label: 'Manufacturer', value: item.manufacturer },
              { label: 'Type', value: item.type },
              { label: 'Fuel', value: item.fuelType },
              {
                label: 'Shipping weight',
                value: hasListedPrice(item.shippingWeight) ? `${item.shippingWeight} lb` : '',
              },
              { label: 'Warranty', value: item.warranty },
            ]}
          />
          {item.description?.trim() ? (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Description
              </h2>
              <p className="mt-3 text-sm leading-6 text-neutral-600">{item.description}</p>
            </section>
          ) : null}
        </div>
      </div>
      <BuyBox
        priced={priced}
        price={item.price}
        coreCharge={item.coreCharge}
        condition={item.condition}
        stock={item.stock}
        partNumber={item.partNumber}
        inCart={inCart}
        onAdd={() => {
          add(item.id)
          setDrawerOpen(true)
        }}
      />
    </main>
  )
}

function BuyBox({
  priced,
  price,
  coreCharge,
  condition,
  stock,
  partNumber,
  inCart,
  onAdd,
}: {
  priced: boolean
  price?: number
  coreCharge?: number
  condition?: string
  stock?: string
  partNumber?: string
  inCart: number
  onAdd: () => void
}) {
  const facts = [
    condition ? { label: 'Condition', value: condition } : null,
    stock ? { label: 'Availability', value: stock } : null,
    partNumber ? { label: 'Part #', value: partNumber } : null,
  ].filter((fact): fact is { label: string; value: string } => fact !== null)

  return (
    <aside className="h-fit rounded-lg border bg-white p-4 shadow-sm lg:sticky lg:top-24 lg:self-start">
      <p className="text-sm text-neutral-500">Price</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight">
        {priced ? formatMoney(price) : 'Price on request'}
      </p>
      {hasListedPrice(coreCharge) ? (
        <p className="mt-1 text-sm text-neutral-500">Core charge {formatMoney(coreCharge)}</p>
      ) : null}
      {facts.length ? (
        <dl className="mt-4 space-y-2 border-t pt-4 text-sm">
          {facts.map((fact) => (
            <div key={fact.label} className="flex justify-between gap-3">
              <dt className="text-neutral-500">{fact.label}</dt>
              <dd className="text-right font-medium">{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {/* La cotización no reemplaza la compra. */}
      <StorefrontButton
        type="button"
        className="mt-4 h-11 w-full rounded-full bg-amber-400 text-neutral-950 hover:bg-amber-500"
        onClick={onAdd}
      >
        Add to Cart
      </StorefrontButton>
      {/* Sumar en el tope no agrega nada: el store recorta a 99. */}
      <CartQuantityLimit qty={inCart} />
      <StorefrontButton asChild tone="outline" className="mt-2 h-11 w-full rounded-full">
        <Link to="/quote">Request a quote</Link>
      </StorefrontButton>
      <p className="mt-3 text-xs leading-5 text-neutral-500">
        Shipping is calculated at checkout, before you pay.
      </p>
    </aside>
  )
}

function yearRange(from?: number, to?: number): string {
  if (!from && !to) return ''
  if (from && to && from !== to) return `${from}–${to}`
  return String(from || to)
}

function Chip({ children }: { children: string }) {
  return (
    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
      {children}
    </span>
  )
}

function DetailGrid({
  title,
  rows,
  note,
}: {
  title: string
  rows: { label: string; value?: string }[]
  note?: string
}) {
  const visible = rows.filter((row) => row.value?.trim())
  const aside = note?.trim()
  if (!visible.length && !aside) return null
  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{title}</h2>
      {visible.length ? (
        <dl className="mt-3 grid grid-cols-2 gap-2">
          {visible.map((row) => (
            <div key={row.label} className="rounded-xl bg-neutral-50 px-3 py-3">
              <dt className="text-xs text-neutral-500">{row.label}</dt>
              <dd className="mt-1 break-words text-sm font-medium text-neutral-950">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {aside ? (
        <p className="mt-2 rounded-xl bg-neutral-50 px-3 py-3 text-sm leading-6 text-neutral-600">
          {aside}
        </p>
      ) : null}
    </section>
  )
}
