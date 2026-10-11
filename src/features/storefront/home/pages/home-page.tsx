import { useQuery } from '@tanstack/react-query'
import { Mail, Phone, RotateCcw, ScanLine, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { getCatalogOverview } from '@/features/storefront/catalog/api'
import { HomeHero } from '@/features/storefront/catalog/components/home-hero'
import { SHOP_PATH, shopPath } from '@/features/storefront/catalog/product-path'
import { catalogKeys } from '@/features/storefront/catalog/query-keys'
import { SITE_NAME, usePageMeta } from '@/lib/page-meta'
import { STORE_EMAIL, STORE_PHONE } from '@/lib/store-contact'

// Qué es cada pieza, en una línea. La clave es la categoría canónica del
// catálogo; una categoría nueva sale sin descripción hasta que se sume aquí.
const CATEGORY_BLURBS: Record<string, string> = {
  INJECTOR: 'Fuel injectors matched to your engine, new and remanufactured.',
  TURBO: 'Complete turbochargers to bring boost and towing power back.',
  'TURBO ACTUATOR': 'Electronic actuators that control the turbo vanes.',
  HPFP: 'High-pressure fuel pumps that feed the common rail.',
  HPOP: 'High-pressure oil pumps that fire HEUI injectors.',
  'FUEL RAIL': 'Fuel rails and pressure sensors for the high-pressure side.',
  'CONTAMINATION KIT': 'Everything to replace after a fuel pump failure, in one kit.',
  DPF: 'Diesel particulate filters that trap soot from the exhaust.',
  DOC: 'Diesel oxidation catalysts for the front of the aftertreatment system.',
  SCR: 'Selective catalytic reduction units that cut NOx with DEF.',
  EGR: 'EGR coolers and valves for the exhaust gas recirculation loop.',
}

const REASONS = [
  {
    icon: ScanLine,
    title: 'Fitment checked by VIN',
    text: 'Enter your VIN and see only the parts that fit your truck.',
  },
  {
    icon: Truck,
    title: 'Shipping across the US',
    text: 'Orders ship from Florida to all 50 states.',
  },
  {
    icon: RotateCcw,
    title: 'Refundable core charge',
    text: 'Send your old part back and get the core charge refunded.',
  },
]

const sectionClass = 'mx-auto max-w-6xl px-4 py-10 md:py-14'
const headingClass = 'text-2xl font-semibold tracking-tight md:text-3xl'
const cardClass =
  'rounded-lg border bg-background p-5 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

function partsLabel(count: number): string {
  return count === 1 ? '1 part' : `${count} parts`
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
  // las secciones que dependen de ella no salen y el resto sigue en pie.
  const overview = useQuery({ queryKey: catalogKeys.overview(), queryFn: getCatalogOverview })
  const makes = overview.data?.makes ?? []
  const categories = overview.data?.categories ?? []

  return (
    <main>
      <HomeHero />

      {makes.length ? (
        <section className={sectionClass} aria-labelledby="home-trucks">
          <h2 id="home-trucks" className={headingClass}>
            Shop by truck
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {makes.map((make) => (
              <Link key={make.name} to={shopPath({ q: make.name })} className={cardClass}>
                <span className="block text-lg font-semibold">{make.name}</span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {partsLabel(make.count)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {categories.length ? (
        <section className="bg-background">
          <div className={sectionClass}>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className={headingClass}>What we sell</h2>
              <Link
                to={SHOP_PATH}
                className="text-sm font-medium underline-offset-4 hover:underline"
              >
                Shop all parts →
              </Link>
            </div>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <li key={category.value} className="flex flex-col rounded-lg border p-5">
                  <h3 className="text-lg font-semibold">{category.label}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {CATEGORY_BLURBS[category.value] ?? ''}
                  </p>
                  {category.brands.length ? (
                    <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">
                      {category.brands.join(' · ')}
                    </p>
                  ) : null}
                  <Link
                    to={shopPath({ category: category.value })}
                    className="mt-auto pt-4 text-sm font-medium underline-offset-4 hover:underline"
                    aria-label={`Shop ${category.label}, ${partsLabel(category.count)}`}
                  >
                    Shop {partsLabel(category.count)} →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className={sectionClass} aria-labelledby="home-about">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 id="home-about" className={headingClass}>
              About TorqueTrack Diesel
            </h2>
            <p className="mt-4 text-muted-foreground">
              TorqueTrack Diesel is a diesel parts store based in Sarasota, Florida. We sell fuel,
              air and emissions parts for Ford Power Stroke, GM Duramax and RAM Cummins trucks, and
              we ship anywhere in the United States.
            </p>
            <p className="mt-3 text-muted-foreground">
              Every listing shows the part numbers and the trucks it fits, so you can match it
              before you order. Not sure which part you need? Send us your VIN and we will quote
              it for you.
            </p>
          </div>
          <ul className="space-y-5">
            {REASONS.map((reason) => (
              <li key={reason.title} className="flex gap-4">
                <reason.icon className="mt-0.5 size-6 shrink-0 text-amber-500" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold">{reason.title}</h3>
                  <p className="text-sm text-muted-foreground">{reason.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-neutral-950 text-white" aria-labelledby="home-contact">
        <div className={`${sectionClass} flex flex-col gap-6 md:flex-row md:items-center md:justify-between`}>
          <div>
            <h2 id="home-contact" className={headingClass}>
              Need help finding a part?
            </h2>
            <p className="mt-2 text-white/75">Call or write, or ask for a quote with your VIN.</p>
            <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <a href={STORE_PHONE.href} className="inline-flex items-center gap-2 hover:underline">
                <Phone className="size-4" aria-hidden="true" />
                {STORE_PHONE.display}
              </a>
              <a
                href={`mailto:${STORE_EMAIL}`}
                className="inline-flex items-center gap-2 hover:underline"
              >
                <Mail className="size-4" aria-hidden="true" />
                {STORE_EMAIL}
              </a>
            </p>
          </div>
          <Button asChild size="lg" className="bg-amber-400 text-neutral-950 hover:bg-amber-300">
            <Link to="/quote">Request a quote</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
