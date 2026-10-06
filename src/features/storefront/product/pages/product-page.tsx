import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { CircleAlert, CircleCheck, CircleHelp, Truck } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'

import { CartQuantityLimit } from '@/components/cart-quantity-limit'
import { StorefrontButton } from '@/components/storefront-button'
import { getProduct } from '@/features/storefront/catalog/api'
import { ProductPhoto } from '@/features/storefront/catalog/components/product-photo'
import {
  categoryLabel,
  isEmissionsCategory,
  productFitsVehicle,
} from '@/features/storefront/catalog/filter-products'
import { catalogReturnPath, productPath } from '@/features/storefront/catalog/product-path'
import { catalogKeys } from '@/features/storefront/catalog/query-keys'
import type { Product } from '@/features/storefront/catalog/types'
import { listApplications } from '@/features/storefront/garage/api'
import { garageKeys } from '@/features/storefront/garage/query-keys'
import type { VehicleApplication } from '@/features/storefront/garage/types'
import { trackAddToCart, trackViewItem } from '@/lib/analytics'
import { ApiError } from '@/lib/api-client'
import { formatMoney, hasListedPrice } from '@/lib/money'
import { SITE_NAME, usePageMeta } from '@/lib/page-meta'
import { useCartStore } from '@/stores/cart-store'
import { describeVehicle, useVehicleStore, type SavedVehicle } from '@/stores/vehicle-store'

export function ProductPage() {
  // El segmento puede ser el slug o el id: el backend resuelve los dos.
  const { idOrSlug = '' } = useParams()
  // Vuelve al listado con los filtros y la búsqueda que traía el comprador.
  const backTo = catalogReturnPath(useLocation().state)
  const add = useCartStore((state) => state.add)
  const setDrawerOpen = useCartStore((state) => state.setDrawerOpen)
  const product = useQuery({
    queryKey: catalogKeys.product(idOrSlug),
    queryFn: () => getProduct(idOrSlug),
    enabled: Boolean(idOrSlug),
  })
  // El carrito guarda el id real, no lo que vino en la URL.
  const productId = product.data?.id
  const inCart = useCartStore(
    (state) => state.items.find((line) => line.id === productId)?.qty ?? 0,
  )

  useEffect(() => {
    if (product.data) trackViewItem(product.data)
  }, [product.data])

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
        <PageMeta title="Product not found" noindex />
        <h1 className="text-2xl font-semibold">Product not found</h1>
        <p className="mt-2 text-muted-foreground">We could not find this product.</p>
        <StorefrontButton asChild tone="link" className="mt-4">
          <Link to={backTo}>← Back to Store</Link>
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
      <ProductSeo product={item} />
      <div className="h-[28rem] overflow-hidden rounded-md border bg-neutral-100 lg:sticky lg:top-24 lg:h-[32rem] lg:self-start">
        <ProductPhoto
          src={item.image}
          partNumber={item.partNumber}
          category={item.category}
          brand={item.manufacturer}
          size="large"
          className="h-full w-full object-contain p-8"
        />
      </div>
      <div>
        <StorefrontButton asChild tone="link" className="px-0 text-neutral-500">
          <Link to={backTo}>← Back to Store</Link>
        </StorefrontButton>
        <div className="mt-5 flex flex-wrap gap-2">
          {category ? <Chip>{category}</Chip> : null}
          {item.condition ? <Chip>{item.condition}</Chip> : null}
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950">{item.title}</h1>
        <FitBadge product={item} />
        <KeyFacts product={item} />
        {isEmissionsCategory(item.category) ? <EmissionsNotice /> : null}
        <div className="mt-8 space-y-8">
          <DetailGrid
            title="Compatibility"
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
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-neutral-600">{item.description}</p>
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
        warranty={item.warranty}
        partNumber={item.partNumber}
        inCart={inCart}
        onAdd={() => {
          add(item.id)
          trackAddToCart(item)
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
  warranty,
  partNumber,
  inCart,
  onAdd,
}: {
  priced: boolean
  price?: number
  coreCharge?: number
  condition?: string
  stock?: string
  warranty?: string
  partNumber?: string
  inCart: number
  onAdd: () => void
}) {
  const facts = [
    condition ? { label: 'Condition', value: condition } : null,
    stock ? { label: 'Availability', value: stock } : null,
    warranty ? { label: 'Warranty', value: warranty } : null,
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
      {/* La cotización no reemplaza la compra: la acción principal es el carrito. */}
      <StorefrontButton
        type="button"
        className="mt-4 h-11 w-full rounded-full bg-amber-400 text-neutral-950 hover:bg-amber-500"
        onClick={onAdd}
      >
        Add to Cart
      </StorefrontButton>
      {/* Sumar en el tope no agrega nada: el store recorta a 99. */}
      <CartQuantityLimit qty={inCart} />
      <StorefrontButton
        asChild
        tone="outline"
        className="mt-2 h-10 w-full rounded-full border-neutral-300 bg-white text-sm text-neutral-800 hover:bg-neutral-50"
      >
        <Link to="/quote">Request a quote</Link>
      </StorefrontButton>
      <p className="mt-3 text-xs leading-5 text-neutral-500">
        Shipping is calculated at checkout, before you pay.
      </p>
    </aside>
  )
}

// Orientativo: el backend vuelve a verificar el fitment contra el VIN en el
// checkout, que es el chequeo que cuenta. Sin datos de compatibilidad en el
// producto no se afirma ni se niega: se pide confirmar.
function FitBadge({ product }: { product: Product }) {
  const vehicle = useVehicleStore((state) => state.vehicle)
  const setSelectorOpen = useVehicleStore((state) => state.setSelectorOpen)
  // Un vehículo de VIN no trae id de aplicación: para usar las del producto
  // hay que cruzarlo con la lista. Mientras carga (o si falla) manda el texto.
  const applications = useQuery({
    queryKey: garageKeys.applications(),
    queryFn: listApplications,
    enabled: Boolean(vehicle && !vehicle.applicationId && product.applicationIds?.length),
  })

  if (!vehicle) {
    return (
      <button
        type="button"
        className="mt-4 inline-flex items-center gap-2 rounded-md border border-dashed border-neutral-300 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
        onClick={() => setSelectorOpen(true)}
      >
        <Truck className="size-4" aria-hidden="true" />
        Select your vehicle to check fit
      </button>
    )
  }

  const status = fitStatus(product, vehicle, applications.data)
  const name = vehicleName(vehicle)
  const styles = {
    fits: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    'no-fit': 'border-red-300 bg-red-50 text-red-900',
    unknown: 'border-amber-300 bg-amber-50 text-amber-950',
  }[status]
  const Icon = status === 'fits' ? CircleCheck : status === 'no-fit' ? CircleAlert : CircleHelp
  const message =
    status === 'fits'
      ? `Fits your ${name}`
      : status === 'no-fit'
        ? `Doesn't fit your ${name}`
        : `Check fitment for your ${name}`

  return (
    <div className={`mt-4 flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm ${styles}`}>
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <p className="font-medium">{message}</p>
      <button
        type="button"
        className="ml-auto underline underline-offset-4"
        onClick={() => setSelectorOpen(true)}
      >
        Change vehicle
      </button>
      {status === 'unknown' ? (
        <p className="w-full text-xs">
          This listing has no compatibility data. We confirm fitment by VIN at checkout, or call us
          before you order.
        </p>
      ) : null}
    </div>
  )
}

type FitStatus = 'fits' | 'no-fit' | 'unknown'

function hasFitmentData(product: Product): boolean {
  return Boolean(
    product.applicationIds?.length ||
      product.make?.trim() ||
      product.model?.trim() ||
      product.yearFrom ||
      product.yearTo ||
      product.engine?.trim(),
  )
}

function fitStatus(
  product: Product,
  vehicle: SavedVehicle,
  applications: VehicleApplication[] | undefined,
): FitStatus {
  if (!hasFitmentData(product)) return 'unknown'
  return productFitsVehicle(product, vehicle, applications) ? 'fits' : 'no-fit'
}

// "2019 Ford F-250": el motor queda fuera para que el mensaje se lea corto.
function vehicleName(vehicle: SavedVehicle): string {
  return (
    [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ') ||
    describeVehicle(vehicle)
  )
}

// Resumen arriba de la ficha con lo que el comprador busca primero. Solo se
// muestra lo que trae el catálogo; un dato vacío no aparece.
function KeyFacts({ product }: { product: Product }) {
  const compatibility =
    product.fitment?.trim() ||
    [yearRange(product.yearFrom, product.yearTo), product.make, product.model, product.engine]
      .filter(Boolean)
      .join(' ')
  const availability = product.stock?.trim()
  const facts = [
    { label: 'Condition', value: product.condition?.trim() },
    { label: 'Availability', value: availability },
    { label: 'Warranty', value: product.warranty?.trim() },
    { label: 'Compatibility', value: compatibility },
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact.value))
  if (!facts.length) return null

  const outOfStock = schemaAvailability(availability) === 'https://schema.org/OutOfStock'
  const availabilityClass = outOfStock ? 'text-red-700' : 'text-emerald-700'
  return (
    <dl className="mt-4 grid gap-2 sm:grid-cols-2">
      {facts.map((fact) => (
        <div key={fact.label} className="rounded-md border bg-white px-3 py-2">
          <dt className="text-xs text-neutral-500">{fact.label}</dt>
          <dd
            className={`text-sm font-medium ${
              fact.label === 'Availability' ? availabilityClass : 'text-neutral-900'
            }`}
          >
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function EmissionsNotice() {
  return (
    <section
      aria-label="Emissions compliance notice"
      className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950"
    >
      <p className="font-semibold">Emissions equipment notice</p>
      <p className="mt-1">
        This part is sold for legal, emissions-compliant use only, to repair or replace factory
        emissions equipment. It is not intended for the removal of, or tampering with, any
        emissions control device.
      </p>
      <p className="mt-1">
        This part may not be legal for sale or use in California (CARB) on pollution-controlled
        vehicles.{' '}
        <Link to="/policies/terms" className="font-medium underline underline-offset-4">
          See our Terms
        </Link>
        .
      </p>
    </section>
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

function PageMeta({ title, noindex }: { title: string; noindex?: boolean }) {
  usePageMeta({ title, noindex })
  return null
}

const DESCRIPTION_LIMIT = 160

function productDescription(product: Product): string {
  const text = product.description?.replace(/\s+/g, ' ').trim()
  const fallback = [
    product.title,
    product.partNumber ? `Part # ${product.partNumber}` : '',
    product.fitment || '',
    product.condition || '',
  ]
    .filter(Boolean)
    .join(' · ')
  const value = text || `${fallback}. Diesel parts from ${SITE_NAME}.`
  return value.length > DESCRIPTION_LIMIT ? `${value.slice(0, DESCRIPTION_LIMIT - 1).trimEnd()}…` : value
}

// `stock` es texto libre del catálogo; solo se distinguen los casos que
// schema.org nombra.
function schemaAvailability(stock?: string): string {
  const value = stock?.toLowerCase() ?? ''
  if (/out of stock|sold out|unavailable/.test(value)) return 'https://schema.org/OutOfStock'
  if (/backorder|back order|special order/.test(value)) return 'https://schema.org/BackOrder'
  return 'https://schema.org/InStock'
}

function ProductSeo({ product }: { product: Product }) {
  const path = productPath(product)
  const title = product.partNumber
    ? `${product.title ?? 'Product'} – ${product.partNumber}`
    : (product.title ?? 'Product')
  usePageMeta({
    title,
    description: productDescription(product),
    canonicalPath: path,
    image: product.image,
    type: 'product',
  })

  const origin = window.location.origin
  const url = new URL(path, origin).toString()
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    sku: product.partNumber || product.id,
    mpn: product.partNumber || undefined,
    brand: product.manufacturer ? { '@type': 'Brand', name: product.manufacturer } : undefined,
    image: product.image ? new URL(product.image, origin).toString() : undefined,
    description: product.description?.trim() || undefined,
    itemCondition: /reman|rebuilt|refurb/i.test(product.condition ?? '')
      ? 'https://schema.org/RefurbishedCondition'
      : /used/i.test(product.condition ?? '')
        ? 'https://schema.org/UsedCondition'
        : undefined,
    url,
    // Sin precio publicado ("Price on request") no hay oferta que declarar.
    offers: hasListedPrice(product.price)
      ? {
          '@type': 'Offer',
          price: Number(product.price).toFixed(2),
          priceCurrency: 'USD',
          availability: schemaAvailability(product.stock),
          url,
        }
      : undefined,
  }

  return (
    <script
      type="application/ld+json"
      // `<` escapado: un texto del catálogo con `</script>` no puede cerrar el tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
    />
  )
}
