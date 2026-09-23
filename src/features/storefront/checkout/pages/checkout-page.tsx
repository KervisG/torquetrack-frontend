import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { FormField } from '@/components/form-field'
import { StorefrontButton } from '@/components/storefront-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useSession } from '@/features/account/auth/hooks/use-session'
import { getAccount } from '@/features/account/portal/api'
import { accountKeys } from '@/features/account/portal/query-keys'
import { listProducts } from '@/features/storefront/catalog/api'
import { catalogKeys } from '@/features/storefront/catalog/query-keys'
import { decodeVin } from '@/features/storefront/vin/api'
import { ApiError } from '@/lib/api-client'
import { formatMoney } from '@/lib/money'
import {
  checkoutCustomerSchema,
  type CheckoutCustomerValues,
} from '@/lib/validators/checkout-customer'
import { useCartStore } from '@/stores/cart-store'

import {
  checkFitment,
  createCheckout,
  estimateTax,
  getShippingRates,
  toShippingSelection,
} from '../api'
import type { FitmentResponse, ShippingRate, TaxEstimate, VinVehicle } from '../types'

const CUSTOMER_FIELDS = [
  ['name', 'Full name'],
  ['company', 'Company (optional)'],
  ['email', 'Email'],
  ['phone', 'Phone'],
  ['address1', 'Street address'],
  ['address2', 'Address 2 (optional)'],
  ['city', 'City'],
  ['state', 'State (FL)'],
  ['zip', 'ZIP'],
  ['country', 'Country'],
] as const

const PREFILL_FIELDS = [
  'name',
  'company',
  'phone',
  'address1',
  'address2',
  'city',
  'state',
  'zip',
  'country',
] as const

export function CheckoutPage() {
  const items = useCartStore((state) => state.items)
  const shipping = useCartStore((state) => state.shipping)
  const setShipping = useCartStore((state) => state.setShipping)
  const setQty = useCartStore((state) => state.setQty)
  const remove = useCartStore((state) => state.remove)
  const products = useQuery({ queryKey: catalogKeys.products(), queryFn: listProducts })
  const form = useForm<CheckoutCustomerValues>({
    resolver: zodResolver(checkoutCustomerSchema),
    defaultValues: {
      name: '',
      company: '',
      email: '',
      phone: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zip: '',
      country: 'US',
    },
  })
  const session = useSession()
  // Solo un cliente (sin Role) tiene perfil: el backend fija el email de la
  // cuenta en el pedido, así que se muestra bloqueado. El staff sigue el flujo
  // de invitado.
  const accountEmail =
    session.data && !session.data.user.isStaff ? session.data.user.email : null
  const account = useQuery({
    queryKey: accountKeys.profile(),
    queryFn: getAccount,
    enabled: Boolean(accountEmail),
    retry: false,
  })

  useEffect(() => {
    if (accountEmail) form.setValue('email', accountEmail)
  }, [accountEmail, form])

  useEffect(() => {
    const profile = account.data
    if (!profile) return
    // No se pisa lo que el cliente ya escribió antes de que llegara el perfil.
    for (const field of PREFILL_FIELDS) {
      if (profile[field] && !form.getValues(field)) form.setValue(field, profile[field])
    }
  }, [account.data, form])

  const [vin, setVin] = useState('')
  const [vehicle, setVehicle] = useState<VinVehicle | null>(null)
  const [fitment, setFitment] = useState<FitmentResponse | null>(null)
  const [tax, setTax] = useState<TaxEstimate | null>(null)
  // Las opciones valen solo para los ítems con los que se cotizaron: si el
  // carrito cambia se ocultan y hay que volver a pedir tarifas.
  const [quoted, setQuoted] = useState<{
    itemsKey: string
    options: Array<{ label: string; rate: ShippingRate | null }>
  } | null>(null)
  const [message, setMessage] = useState('')
  const [paying, setPaying] = useState(false)

  const rows = items
    .map((item) => {
      const product = products.data?.find((row) => row.id === item.id)
      return product ? { ...product, qty: item.qty } : undefined
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
  const parts = rows.reduce((sum, row) => sum + Number(row.price || 0) * row.qty, 0)
  const cores = rows.reduce((sum, row) => sum + Number(row.coreCharge || 0) * row.qty, 0)
  const ship = Number(shipping?.rate || 0)
  const taxAmount = Number(tax?.tax || 0)
  const invalidPrice = rows.some((row) => !Number.isFinite(Number(row.price)) || Number(row.price) <= 0)
  const fitmentApproved = Boolean(fitment?.compatible)
  const cartItems = rows.map((row) => ({ id: row.id, qty: row.qty }))
  const itemsKey = JSON.stringify(cartItems)
  const rates = quoted?.itemsKey === itemsKey ? quoted.options : []

  async function onVerifyVin() {
    setMessage('')
    try {
      const decoded = await decodeVin(vin.trim().toUpperCase())
      const nextVehicle = { ...decoded.vehicle, vin: vin.trim().toUpperCase() }
      setVehicle(nextVehicle)
      const result = await checkFitment({
        vehicle: nextVehicle,
        items: rows.map((row) => ({ id: row.id })),
      })
      setFitment(result)
    } catch (error) {
      setVehicle(null)
      setFitment(null)
      setMessage(error instanceof ApiError ? error.message : 'VIN verification failed')
    }
  }

  async function onRates() {
    const values = form.getValues()
    if (!values.name || !values.address1 || !values.city || !values.state || !values.zip) {
      setMessage('Complete name, street, city, state and ZIP first.')
      return
    }
    setMessage('Getting live carrier rates...')
    try {
      const response = await getShippingRates({
        to: {
          name: values.name,
          phone: values.phone || '',
          street1: values.address1,
          street2: values.address2 || '',
          city: values.city,
          state: values.state.toUpperCase(),
          zip: values.zip,
          country: values.country || 'US',
        },
        items: cartItems,
      })
      if (!response.configured) {
        setMessage(response.message || 'Shipping provider is not configured')
        return
      }
      setQuoted({
        itemsKey,
        options: [
          { label: 'Ground', rate: response.ground ?? null },
          { label: '2nd Day', rate: response.secondDay ?? null },
          { label: 'Overnight', rate: response.overnight ?? null },
        ],
      })
      setMessage('Choose one shipping method to continue.')
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'Could not get shipping rates')
    }
  }

  async function onTax(): Promise<boolean> {
    const values = form.getValues()
    if (!values.state || !values.zip) {
      setMessage('Enter State and ZIP first.')
      return false
    }
    try {
      const result = await estimateTax({
        amount: parts,
        core: cores,
        shipping: ship,
        subtotal: parts + cores,
        state: values.state.toUpperCase(),
        zip: values.zip,
        city: values.city,
        address1: values.address1,
      })
      setTax(result)
      setMessage(result.source || result.label || 'Tax calculated')
      return true
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'Tax calculation failed')
      return false
    }
  }

  async function onPay(values: CheckoutCustomerValues) {
    if (!rows.length || invalidPrice || !shipping || !vehicle || !fitmentApproved) {
      setMessage('Verify VIN, fitment and shipping before payment.')
      return
    }
    const selection = toShippingSelection(shipping)
    if (!selection) {
      // Tarifa guardada en una visita anterior, sin shipment que verificar.
      setShipping(null)
      setMessage('Get shipping rates again before payment.')
      return
    }
    setPaying(true)
    try {
      const taxed = await onTax()
      if (!taxed) throw new Error('Tax must be calculated before payment.')
      const result = await createCheckout({
        items: cartItems,
        shipping: selection,
        vehicle,
        customer: {
          ...values,
          state: values.state.toUpperCase(),
          country: (values.country || 'US').toUpperCase(),
        },
      })
      if (!result.url) throw new Error('Secure payment URL was not returned.')
      window.location.assign(result.url)
    } catch (error) {
      setPaying(false)
      setMessage(error instanceof ApiError ? error.message : String((error as Error).message))
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <StorefrontButton asChild tone="link" className="px-0">
        <Link to="/">← Back to TorqueTrack</Link>
      </StorefrontButton>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">Cart & Secure Checkout</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Review your parts, verify the VIN, confirm shipping and tax, then continue to the payment
        provider&apos;s secure page.
      </p>
      {rows.length ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Need fitment confirmed or a fleet price first?{' '}
          <Link to="/quote" className="font-medium text-foreground underline underline-offset-4">
            Request a quote instead
          </Link>
        </p>
      ) : null}

      <form
        className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"
        onSubmit={form.handleSubmit((values) => void onPay(values))}
      >
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Your Cart</CardTitle>
            </CardHeader>
            <CardContent>
              {rows.length ? (
                <ul className="space-y-3">
                  {rows.map((row) => (
                    <li key={row.id} className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">{row.title}</p>
                          <p className="text-sm text-muted-foreground">{row.partNumber}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StorefrontButton
                            type="button"
                            size="sm"
                            tone="outline"
                            onClick={() => setQty(row.id, row.qty - 1)}
                          >
                            −
                          </StorefrontButton>
                          <span className="w-6 text-center">{row.qty}</span>
                          <StorefrontButton
                            type="button"
                            size="sm"
                            tone="outline"
                            onClick={() => setQty(row.id, row.qty + 1)}
                          >
                            +
                          </StorefrontButton>
                          <strong>
                            {formatMoney((Number(row.price) + Number(row.coreCharge || 0)) * row.qty)}
                          </strong>
                          <StorefrontButton type="button" tone="danger" onClick={() => remove(row.id)}>
                            Remove
                          </StorefrontButton>
                        </div>
                      </div>
                      <Separator />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-destructive">Your cart is empty.</p>
              )}
              {invalidPrice ? (
                <p className="mt-3 text-sm text-destructive">
                  Checkout blocked: one or more products still have a missing or $0.00 price.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Vehicle / VIN Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                id="checkout-vin"
                label="VIN"
                value={vin}
                onChange={(event) => setVin(event.target.value)}
                maxLength={17}
                placeholder="Enter 17-character VIN"
                action={
                  <StorefrontButton type="button" onClick={() => void onVerifyVin()}>
                    Verify VIN
                  </StorefrontButton>
                }
              />
              {vehicle ? (
                <p className="mt-3 text-sm">
                  VIN verified: {vehicle.year} {vehicle.make} {vehicle.model}
                </p>
              ) : null}
              {fitment ? (
                <div className="mt-3">
                  <p className={fitment.compatible ? 'text-foreground' : 'text-destructive'}>
                    {fitment.compatible
                      ? 'All cart items match this VIN'
                      : 'VIN / part fitment problem'}
                  </p>
                  {fitment.results.map((result) => (
                    <p key={result.id} className="text-sm text-muted-foreground">
                      {result.partNumber || result.title || result.id} —{' '}
                      {result.compatible ? 'Compatible' : (result.reasons || []).join('; ')}
                    </p>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Customer & Shipping</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {CUSTOMER_FIELDS.map(([field, label]) => (
                  <FormField
                    key={field}
                    id={field}
                    label={label}
                    placeholder={label}
                    readOnly={field === 'email' && Boolean(accountEmail)}
                    {...form.register(field)}
                  />
                ))}
              </div>

              <h2 className="mt-8 text-lg font-semibold">Shipping Method</h2>
              <StorefrontButton type="button" className="mt-3" onClick={() => void onRates()}>
                Get Shipping Rates
              </StorefrontButton>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {rates.map((option) => (
                  <Card key={option.label}>
                    <CardContent className="p-3">
                      <p className="text-sm text-muted-foreground">{option.label}</p>
                      {option.rate ? (
                        <>
                          <p className="text-xl font-semibold">{formatMoney(option.rate.rate)}</p>
                          <p className="text-sm text-muted-foreground">
                            {option.rate.carrier} · {option.rate.service}
                          </p>
                          <StorefrontButton
                            type="button"
                            tone="outline"
                            className="mt-2 w-full"
                            onClick={() => {
                              setShipping(option.rate)
                              setTax(null)
                            }}
                          >
                            Use this rate
                          </StorefrontButton>
                        </>
                      ) : (
                        <p>Unavailable</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Parts</dt>
                <dd>{formatMoney(parts)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Core charges</dt>
                <dd>{formatMoney(cores)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd>{shipping ? formatMoney(ship) : 'Not selected'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Estimated tax</dt>
                <dd>{tax ? formatMoney(taxAmount) : '—'}</dd>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatMoney(parts + cores + ship + taxAmount)}</dd>
              </div>
            </dl>
            {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
            <div className="mt-4 flex flex-col gap-2">
              <StorefrontButton type="button" tone="outline" onClick={() => void onTax()}>
                Calculate Tax
              </StorefrontButton>
              <StorefrontButton
                type="submit"
                disabled={!rows.length || invalidPrice || !shipping || !fitmentApproved || paying}
              >
                {paying ? 'Preparing payment…' : 'Continue to Secure Card Payment'}
              </StorefrontButton>
            </div>
          </CardContent>
        </Card>
      </form>
    </main>
  )
}
