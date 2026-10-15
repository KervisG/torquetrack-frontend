import { useQuery } from '@tanstack/react-query'
import { ArrowRight, ArrowUp, Check } from 'lucide-react'
import { Link } from 'react-router-dom'

import { BrandMark } from '@/components/brand-mark'
import { getCatalogOverview, type CatalogOverview } from '@/features/storefront/catalog/api'
import { HomeHero } from '@/features/storefront/catalog/components/home-hero'
import { categoryLabel } from '@/features/storefront/catalog/filter-products'
import { shopPath } from '@/features/storefront/catalog/product-path'
import { catalogKeys } from '@/features/storefront/catalog/query-keys'
import { brandLogo } from '@/features/storefront/home/brand-logos'
import { SITE_NAME, usePageMeta } from '@/lib/page-meta'
import {
  DEFAULT_PRODUCT_LINE,
  PRODUCT_LINE_OPTIONS,
  type ProductLineValue,
} from '@/lib/product-lines'

type OverviewCategory = CatalogOverview['categories'][number]

type ProductLine = {
  id: ProductLineValue
  description: string
  categories: string[]
}

// Las líneas de producto de la portada. La línea de cada categoría la decide
// el panel (`line` del resumen del catálogo). `categories` fija el orden de
// las tarjetas de siempre y ubica una categoría si el backend aún no manda
// `line`; una categoría nueva va después, por cantidad de productos.
const PRODUCT_LINES: ProductLine[] = [
  {
    id: 'FUEL_SYSTEM',
    description:
      'Injectors, high-pressure pumps, fuel rails and contamination kits, new and remanufactured, matched to your engine by part number.',
    categories: ['INJECTOR', 'HPFP', 'HPOP', 'FUEL RAIL', 'CONTAMINATION KIT'],
  },
  {
    id: 'TURBO_AIR',
    description:
      'Complete turbochargers and actuators to bring boost and towing power back, ready to install.',
    categories: ['TURBO', 'TURBO ACTUATOR'],
  },
  {
    id: 'EMISSIONS',
    description:
      'Particulate filters, oxidation catalysts, DEF systems and EGR parts to keep your truck compliant and out of limp mode.',
    categories: ['DPF', 'DOC', 'SCR', 'EGR'],
  },
  {
    id: DEFAULT_PRODUCT_LINE,
    description: 'Other diesel parts we carry for the trucks we cover.',
    categories: [],
  },
]

function lineOf(category: OverviewCategory): string {
  if (category.line) return category.line
  const known = PRODUCT_LINES.find((line) => line.categories.includes(category.value))
  return known?.id ?? DEFAULT_PRODUCT_LINE
}

function productLines(categories: OverviewCategory[]) {
  return PRODUCT_LINES.map((line) => {
    const position = (category: OverviewCategory) => {
      const index = line.categories.indexOf(category.value)
      return index < 0 ? line.categories.length : index
    }
    return {
      title: PRODUCT_LINE_OPTIONS.find((option) => option.value === line.id)?.label ?? line.id,
      description: line.description,
      // `sort` es estable: las categorías nuevas conservan el orden del backend.
      items: categories
        .filter((category) => lineOf(category) === line.id)
        .sort((a, b) => position(a) - position(b)),
    }
  }).filter((line) => line.items.length)
}

function distinctBrands(items: OverviewCategory[]): string[] {
  return [...new Set(items.flatMap((item) => item.brands))].sort((a, b) =>
    a.localeCompare(b, 'en'),
  )
}

// Lo que distingue a la tienda, igual para todas las líneas.
const SELLING_POINTS = [
  'Fitment checked by VIN before you pay',
  'Ships to all 50 states',
  'Refundable core charge on rebuildable parts',
]

// Sube al buscador por VIN del hero y deja el cursor en el campo. Un enlace
// `#hero-vin` no sirve: el router no desplaza la página a un ancla.
function focusVinInput() {
  const input = document.getElementById('hero-vin')
  if (!input) return
  input.scrollIntoView({ behavior: 'smooth', block: 'center' })
  input.focus({ preventScroll: true })
}

function partsLabel(count: number): string {
  return count === 1 ? '1 part' : `${count} parts`
}

// Los logos van a color y a la misma altura, en una franja al pie de la
// tarjeta; una marca sin logo se escribe en negrita como su logotipo.
function BrandChip({ brand }: { brand: string }) {
  const logo = brandLogo(brand)
  return (
    <li className="flex h-9 items-center">
      {logo ? (
        <img src={logo} alt={brand} className="h-full max-h-8 w-auto max-w-28 object-contain" />
      ) : (
        <span className="text-sm font-extrabold tracking-tight">{brand}</span>
      )}
    </li>
  )
}

export function HomePage() {
  usePageMeta({
    title: `${SITE_NAME} – Diesel Injectors, Pumps & Parts`,
    fullTitle: true,
    description:
      'Diesel fuel, air and emissions parts for Ford Power Stroke, GM Duramax and RAM Cummins trucks. Fitment checked by VIN. Ships across the US.',
    canonicalPath: '/',
    type: 'website',
  })

  // La portada se arma con lo que hay en el catálogo. Si la consulta falla,
  // las líneas de producto no salen y el resto sigue en pie.
  const overview = useQuery({ queryKey: catalogKeys.overview(), queryFn: getCatalogOverview })
  const lines = productLines(overview.data?.categories ?? [])

  return (
    <main>
      <HomeHero />

      {lines.length ? (
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 md:py-14">
          {lines.map((line) => {
            const total = line.items.reduce((sum, item) => sum + item.count, 0)
            return (
              <section key={line.title} className="overflow-hidden rounded-xl border bg-background">
                <div className="grid gap-8 p-6 md:grid-cols-[1fr_1.15fr] md:p-8">
                  <div className="flex flex-col">
                    <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">
                      {partsLabel(total)}
                    </p>
                    <h2 className="mt-1 text-3xl font-light uppercase tracking-wide md:text-4xl">
                      {line.title}
                    </h2>
                    <p className="mt-4 max-w-md text-muted-foreground">{line.description}</p>
                    <ul className="mt-5 space-y-2 text-sm">
                      {SELLING_POINTS.map((point) => (
                        <li key={point} className="flex items-center gap-2">
                          <Check className="size-4 shrink-0 text-amber-600" aria-hidden="true" />
                          {point}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={focusVinInput}
                      className="mt-6 inline-flex w-fit items-center gap-2 rounded-md bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
                    >
                      Not sure? Find your part by VIN
                      <ArrowUp className="size-4" aria-hidden="true" />
                    </button>
                  </div>

                  <nav aria-label={`${line.title} categories`}>
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {line.items.map((item) => (
                        <li key={item.value}>
                          <Link
                            to={shopPath({ category: item.value })}
                            className="group flex h-full flex-col justify-between gap-4 rounded-lg border bg-muted/40 p-4 transition hover:-translate-y-0.5 hover:border-amber-500 hover:bg-amber-50 hover:shadow-md focus-visible:border-amber-500 focus-visible:outline-none"
                          >
                            <span className="font-semibold leading-snug">
                              {categoryLabel(item.value)}
                            </span>
                            <span className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{partsLabel(item.count)}</span>
                              <span className="flex items-center gap-1 font-medium text-amber-700">
                                Shop
                                <ArrowRight
                                  className="size-4 transition-transform group-hover:translate-x-1"
                                  aria-hidden="true"
                                />
                              </span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>

                <div className="border-t bg-muted/30 px-6 py-4 md:px-8">
                  <ul
                    className="flex flex-wrap items-center gap-x-8 gap-y-3"
                    aria-label={`${line.title} brands`}
                  >
                    {distinctBrands(line.items).map((brand) => (
                      <BrandChip key={brand} brand={brand} />
                    ))}
                  </ul>
                </div>
              </section>
            )
          })}
        </div>
      ) : null}

      <section className="mx-auto max-w-4xl px-4 pb-14 pt-4 text-center" aria-label="About us">
        <p className="flex items-center justify-center gap-3">
          <BrandMark className="h-8 w-auto" />
          <span className="text-2xl font-semibold tracking-[0.12em]">
            TORQUETRACK <span className="font-light text-amber-600">DIESEL</span>
          </span>
        </p>
        <p className="mt-4 text-sm text-muted-foreground md:text-base">
          TorqueTrack Diesel is a diesel parts store based in Sarasota, Florida. We specialize in
          fuel, air and emissions parts for Ford Power Stroke, GM Duramax and RAM Cummins trucks,
          and we ship anywhere in the United States. Not sure which part you need? Send us your
          VIN and we will quote it for you.{' '}
          <Link to="/quote" className="font-medium text-foreground underline-offset-4 hover:underline">
            Request a quote »
          </Link>
        </p>
      </section>
    </main>
  )
}
