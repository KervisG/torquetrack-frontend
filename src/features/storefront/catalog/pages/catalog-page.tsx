import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { FormField } from '@/components/form-field'
import { StorefrontButton } from '@/components/storefront-button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ApiError } from '@/lib/api-client'
import { formatMoney } from '@/lib/money'
import { useCartStore } from '@/stores/cart-store'

import { listProducts } from '../api'
import { BrandPicker, CATALOG_BRANDS } from '../components/brand-picker'
import { CategoryPicker } from '../components/category-picker'
import { filterProducts } from '../filter-products'
import { catalogKeys } from '../query-keys'
import type { VinVehicle } from '../types'
import { decodeVin } from '../../vin/api'

const TRUST_POINTS = [
  { title: 'VIN is optional', body: 'No door sticker? Pick Ford, Chevrolet, GMC or RAM and browse.' },
  { title: 'OEM + aftermarket', body: 'Search the factory number or the aftermarket part number.' },
  { title: 'Ships from the US', body: 'We price the part first. Shipping is quoted at checkout.' },
  { title: 'Fitment at checkout', body: 'Confirm the truck before you pay. Wrong-fit parts do not ship.' },
] as const

export function CatalogPage() {
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState('All')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('featured')
  const [vin, setVin] = useState('')
  const [vehicle, setVehicle] = useState<VinVehicle | null>(null)
  const [vinError, setVinError] = useState('')
  const add = useCartStore((state) => state.add)
  const setDrawerOpen = useCartStore((state) => state.setDrawerOpen)
  const products = useQuery({ queryKey: catalogKeys.products(), queryFn: listProducts })

  const rows = useMemo(() => {
    const filtered = filterProducts(products.data || [], {
      brand,
      category,
      query,
      vehicle,
    })
    if (sort === 'low') return [...filtered].sort((a, b) => Number(a.price) - Number(b.price))
    if (sort === 'high') return [...filtered].sort((a, b) => Number(b.price) - Number(a.price))
    return filtered
  }, [products.data, brand, category, query, vehicle, sort])

  function chooseBrand(name: string) {
    setBrand(name)
    setVehicle(null)
  }

  async function onVinSearch() {
    setVinError('')
    try {
      const result = await decodeVin(vin.trim().toUpperCase())
      setVehicle({ ...result.vehicle, vin: vin.trim().toUpperCase() })
      const detected = CATALOG_BRANDS.find((item) =>
        result.vehicle.make.toLowerCase().includes(item.name.toLowerCase()),
      )
      if (detected) setBrand(detected.name)
    } catch (error) {
      setVehicle(null)
      setVinError(error instanceof ApiError ? error.message : 'VIN lookup failed')
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <section className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div>
          <p className="text-sm font-medium text-muted-foreground">OEM + aftermarket diesel parts</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">
            Find it. Price it.
            <br />
            Ship it fast.
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            A VIN is optional. If you do not have it, pick the truck brand and shop by component.
          </p>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-xl">I have a VIN</CardTitle>
              <p className="text-sm text-muted-foreground">
                17 characters on the driver-door sticker or windshield. We hide parts that do not
                fit.
              </p>
            </CardHeader>
            <CardContent>
              <FormField
                id="vin-lookup"
                label="Truck VIN"
                value={vin}
                onChange={(event) => setVin(event.target.value)}
                maxLength={17}
                placeholder="1FT8W3DT0KEC12345"
                error={vinError}
                action={
                  <StorefrontButton type="button" onClick={() => void onVinSearch()}>
                    Find parts
                  </StorefrontButton>
                }
                hint={
                  vehicle ? (
                    <p className="text-sm">
                      Shopping for {vehicle.year} {vehicle.make} {vehicle.model}
                      {vehicle.engine ? ` · ${vehicle.engine}` : ''}
                    </p>
                  ) : null
                }
              />
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-2xl font-semibold">No VIN? Shop by truck</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose Ford, Chevrolet, GMC or RAM. You can confirm fitment later at checkout.
          </p>
          <div className="mt-4">
            <BrandPicker value={brand} onChange={chooseBrand} />
          </div>
          {!brand ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Select a brand to browse compatible parts.
            </p>
          ) : (
            <p className="mt-4 text-sm">
              Showing {brand} parts{category !== 'All' ? ` in ${category}` : ''}.
              <StorefrontButton
                type="button"
                tone="link"
                className="ml-2 h-auto p-0"
                onClick={() => {
                  setBrand('')
                  setVehicle(null)
                }}
              >
                Change truck
              </StorefrontButton>
            </p>
          )}
        </div>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TRUST_POINTS.map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <CardTitle className="text-base">{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{item.body}</CardContent>
          </Card>
        ))}
      </section>

      {!brand ? (
        <>
          <section className="mt-10">
            <h2 className="text-2xl font-semibold">Shop by component</h2>
            <p className="mt-1 text-muted-foreground">
              Start with the job. Then pick a truck brand to see prices.
            </p>
            <div className="mt-4">
              <CategoryPicker value={category} onChange={setCategory} />
            </div>
          </section>

          <section className="mt-10 grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">1. Tell us the truck</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Use a VIN if you have it. If not, tap the Ford, Chevrolet, GMC or RAM truck.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">2. Choose the part</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Filter by turbo, injector, DPF or search the OEM and aftermarket numbers.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">3. Check out</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Review the cart, confirm fitment and pay on the secure checkout page.
              </CardContent>
            </Card>
          </section>
        </>
      ) : (
        <section className="mt-10 space-y-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <FormField
                id="part-search"
                label="Search these parts"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="OEM #, aftermarket # or part name"
              />
            </div>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-full bg-background md:w-52">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="low">Price: Low to High</SelectItem>
                <SelectItem value="high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <CategoryPicker layout="chips" value={category} onChange={setCategory} />
          <p className="text-sm text-muted-foreground">{rows.length} products</p>

          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No parts match these filters.</p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((product) => (
                <li key={product.id}>
                  <Card className="h-full overflow-hidden">
                    <div className="flex h-44 items-center justify-center bg-muted p-4">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.title}
                          className="h-full w-full object-contain"
                        />
                      ) : null}
                    </div>
                    <CardHeader>
                      <Badge variant="secondary" className="w-fit">
                        {product.category}
                      </Badge>
                      <CardTitle className="text-base leading-snug">{product.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{product.fitment}</p>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      <p>OEM: {product.oemPart || '—'}</p>
                      <p>Part #: {product.partNumber || '—'}</p>
                      <p className="mt-3 text-2xl font-semibold text-foreground">
                        {formatMoney(product.price)}
                      </p>
                    </CardContent>
                    <CardFooter className="gap-2">
                      <StorefrontButton
                        type="button"
                        onClick={() => {
                          add(product.id)
                          setDrawerOpen(true)
                        }}
                      >
                        Add to Cart
                      </StorefrontButton>
                      <StorefrontButton asChild tone="outline">
                        <Link to={`/product/${product.id}`}>View Details</Link>
                      </StorefrontButton>
                    </CardFooter>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {products.error ? (
        <p className="mt-6 text-sm text-destructive">
          {products.error instanceof ApiError ? products.error.message : 'Could not load products.'}
        </p>
      ) : null}
    </main>
  )
}
