import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { CartPriceNotices } from '@/components/cart-price-notices'
import { FormField } from '@/components/form-field'
import { SelectField } from '@/components/select-field'
import { CartQuantityLimit } from '@/components/cart-quantity-limit'
import { StorefrontButton } from '@/components/storefront-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useSession } from '@/features/account/auth/hooks/use-session'
import { getAccount } from '@/features/account/portal/api'
import { accountKeys } from '@/features/account/portal/query-keys'
import { listProducts } from '@/features/storefront/catalog/api'
import { productPath } from '@/features/storefront/catalog/product-path'
import { catalogKeys } from '@/features/storefront/catalog/query-keys'
import { decodeVin } from '@/features/storefront/vin/api'
import { trackBeginCheckout } from '@/lib/analytics'
import { ApiError } from '@/lib/api-client'
import { friendlyApiError } from '@/lib/api-errors'
import { formatMoney } from '@/lib/money'
import { usePageMeta } from '@/lib/page-meta'
import { isUsStateCode, toUsStateCode, US_STATE_OPTIONS } from '@/lib/us-states'
import {
  checkoutCustomerSchema,
  isPlausiblePhone,
  type CheckoutCustomerValues,
} from '@/lib/validators/checkout-customer'
import { MAX_CART_QUANTITY, useCartStore } from '@/stores/cart-store'
import { describeVehicle, useVehicleStore } from '@/stores/vehicle-store'

import {
  checkFitment,
  createCheckout,
  estimateTax,
  getShippingRates,
  toShippingSelection,
} from '../api'
import type { FitmentResponse, ShippingRate, TaxEstimate, VinVehicle } from '../types'

// `autoComplete` deja que el navegador y los gestores de contraseñas llenen
// la dirección de una vez.
const CUSTOMER_FIELDS = [
  ['name', 'Full name', 'name'],
  ['company', 'Company (optional)', 'organization'],
  ['email', 'Email', 'email'],
  ['phone', 'Phone', 'tel'],
  ['address1', 'Street address', 'address-line1'],
  ['address2', 'Address 2 (optional)', 'address-line2'],
  ['city', 'City', 'address-level2'],
  ['state', 'State', 'address-level1'],
  ['zip', 'ZIP', 'postal-code'],
  ['country', 'Country', 'country'],
] as const

type CustomerField = (typeof CUSTOMER_FIELDS)[number][0]
const CUSTOMER_FIELD_NAMES: readonly string[] = CUSTOMER_FIELDS.map(([field]) => field)

// Dónde se muestra un error del backend: un campo del cliente, el VIN o la
// sección de envío.
type CheckoutErrorTarget = CustomerField | 'vin' | 'shipping'

// Respaldo para respuestas sin `field`: se deduce el campo del mensaje. No se
// copia aquí la tabla de prefijos de USPS; el backend es la única fuente y el
// checkout la vuelve a validar.
const ADDRESS_API_ERRORS: Record<string, 'state' | 'zip'> = {
  'Shipping state is required': 'state',
  'Shipping state must be a valid 2-letter US state code': 'state',
  'ZIP code does not match the selected state.': 'zip',
  'ZIP code is not a valid US ZIP code.': 'zip',
  'Shipping ZIP must be 5 digits or ZIP+4': 'zip',
}
// Errores del backend que se limpian al recalcular el impuesto.
const SERVER_ERROR_FIELDS = ['state', 'zip'] as const

// Respaldo para el VIN sin `field`: formato y fitment del pedido.
function isVinApiMessage(message: string): boolean {
  return message === 'VIN must contain 17 valid characters' || message.startsWith('VIN fitment check failed')
}

// El `field` del payload (ya en camelCase) gana: `vehicle` es el fitment del
// VIN. Sin `field` se cae al texto del mensaje.
function checkoutErrorTarget(failure: ApiError, field: string | undefined): CheckoutErrorTarget | null {
  if (failure.field) {
    if (field === 'vin' || field === 'vehicle') return 'vin'
    if (field === 'shipping') return 'shipping'
    return field && CUSTOMER_FIELD_NAMES.includes(field) ? (field as CustomerField) : null
  }
  if (isVinApiMessage(failure.message)) return 'vin'
  return ADDRESS_API_ERRORS[failure.message] ?? null
}

const FIX_FIELDS_MESSAGE = 'Check the highlighted fields.'

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

// Campos que cambian la cotización de envío. Mismo patrón de ZIP que el
// schema del formulario: no se cotiza una dirección que no pasaría el pago.
const ADDRESS_FIELDS = ['name', 'phone', 'address1', 'address2', 'city', 'state', 'zip', 'country'] as const
const ZIP_PATTERN = /^\d{5}(-\d{4})?$/

// Espera a que el cliente deje de tipear antes de pedir tarifas a EasyPost.
const RATES_DEBOUNCE_MS = 500

type RateOption = { label: string; rate: ShippingRate | null }

type TaxInput = {
  state: string
  zip: string
  city: string
  address1: string
  parts: number
  cores: number
  ship: number
}

type KeyedResult<T> = { key: string; error?: string } & Partial<T>

function requestTax(input: TaxInput, signal?: AbortSignal): Promise<TaxEstimate> {
  return estimateTax(
    {
      amount: input.parts,
      core: input.cores,
      shipping: input.ship,
      subtotal: input.parts + input.cores,
      state: input.state.toUpperCase(),
      zip: input.zip,
      city: input.city,
      address1: input.address1,
    },
    signal,
  )
}

function taxErrorMessage(taxFailure: unknown): string {
  return taxFailure instanceof ApiError ? taxFailure.message : 'Tax calculation failed'
}

function cheapestRate(options: RateOption[]): RateOption | undefined {
  return options
    .filter((option) => option.rate)
    .sort((a, b) => Number(a.rate?.rate) - Number(b.rate?.rate))[0]
}

export function CheckoutPage() {
  const items = useCartStore((state) => state.items)
  const priceChanges = useCartStore((state) => state.priceChanges)
  const shipping = useCartStore((state) => state.shipping)
  const setShipping = useCartStore((state) => state.setShipping)
  const setQty = useCartStore((state) => state.setQty)
  const remove = useCartStore((state) => state.remove)
  const savedVehicle = useVehicleStore((state) => state.vehicle)
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
      // Un estado guardado fuera de la lista no tiene opción en el select.
      const value = field === 'state' ? toUsStateCode(profile.state) : profile[field]
      // Un teléfono guardado que ya no pasa la validación queda vacío: el campo
      // es opcional y el cliente no debe toparse con un error que no causó.
      if (field === 'phone' && value && !isPlausiblePhone(value)) continue
      if (value && !form.getValues(field)) form.setValue(field, value)
    }
  }, [account.data, form])

  // Un vehículo guardado por VIN en "My vehicle" prellena este paso; uno
  // elegido por año y modelo no tiene VIN que verificar.
  const [vin, setVin] = useState(savedVehicle?.source === 'vin' ? savedVehicle.vin : '')
  const pendingSavedVehicle = useRef(savedVehicle?.source === 'vin' ? savedVehicle : null)
  const vinInputRef = useRef<HTMLInputElement>(null)
  const shippingHeadingRef = useRef<HTMLHeadingElement>(null)
  const [vinError, setVinError] = useState('')
  const [vehicle, setVehicle] = useState<VinVehicle | null>(null)
  const [fitment, setFitment] = useState<FitmentResponse | null>(null)
  // Cada resultado guarda la clave (dirección, ítems, tarifa, intento) con la
  // que se pidió: si la clave actual es otra, el resultado no vale y la
  // pantalla muestra "cargando" sin tener que borrarlo a mano.
  const [taxResult, setTaxResult] = useState<KeyedResult<{ estimate: TaxEstimate }> | null>(null)
  const [taxAttempt, setTaxAttempt] = useState(0)
  const [ratesResult, setRatesResult] = useState<KeyedResult<{ options: RateOption[] }> | null>(null)
  const [ratesAttempt, setRatesAttempt] = useState(0)
  // El servicio que eligió el cliente (Ground, 2nd Day…) se conserva al
  // recotizar si sigue disponible; si no, se toma el más barato.
  const preferredTier = useRef('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [paying, setPaying] = useState(false)

  const rows = items
    .map((item) => {
      const product = products.data?.find((row) => row.id === item.id)
      return product ? { ...product, qty: item.qty } : undefined
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
  usePageMeta({ title: 'Checkout', noindex: true })

  // Una sola vez por visita, cuando el carrito ya tiene líneas con producto.
  const checkoutTracked = useRef(false)
  useEffect(() => {
    if (checkoutTracked.current || !rows.length) return
    checkoutTracked.current = true
    trackBeginCheckout(rows.map((row) => ({ product: row, quantity: row.qty })))
  }, [rows])

  const parts = rows.reduce((sum, row) => sum + Number(row.price || 0) * row.qty, 0)
  const cores = rows.reduce((sum, row) => sum + Number(row.coreCharge || 0) * row.qty, 0)
  const ship = Number(shipping?.rate || 0)
  const invalidPrice = rows.some((row) => !Number.isFinite(Number(row.price)) || Number(row.price) <= 0)
  const fitmentApproved = Boolean(fitment?.compatible)
  // El VIN es opcional; si se escribió uno, tiene que estar verificado (el
  // mismo que se decodificó) y con fitment aprobado antes de pagar.
  const typedVin = vin.trim().toUpperCase()
  const vinReady = !typedVin || (vehicle?.vin === typedVin && fitmentApproved)
  const cartItems = rows.map((row) => ({ id: row.id, qty: row.qty }))
  const itemsKey = JSON.stringify(cartItems)

  const address = useWatch({ control: form.control, name: ADDRESS_FIELDS })
  const [name, , address1, , city, state, zip] = address
  const addressComplete =
    Boolean(name?.trim() && address1?.trim() && city?.trim()) &&
    isUsStateCode(state) &&
    ZIP_PATTERN.test(zip?.trim() ?? '')
  const quoteKey = addressComplete && cartItems.length ? JSON.stringify([address, cartItems]) : ''
  const ratesKey = quoteKey ? `${ratesAttempt}|${quoteKey}` : ''
  const currentRates = ratesResult?.key === ratesKey ? ratesResult : null
  const ratesStatus = !ratesKey ? 'idle' : !currentRates ? 'loading' : currentRates.error ? 'error' : 'idle'
  const rates = currentRates?.options ?? []
  // El id de la tarifa entra en la clave aunque `requestTax` no lo use:
  // otra tarifa con el mismo monto igual pide el impuesto de nuevo.
  const taxInput =
    shipping?.id && addressComplete
      ? JSON.stringify({ state, zip, city, address1, parts, cores, ship, rateId: shipping.id })
      : ''
  const taxKey = taxInput ? `${taxAttempt}|${taxInput}` : ''
  const currentTax = taxResult?.key === taxKey ? taxResult : null
  const taxStatus = !taxKey ? 'idle' : !currentTax ? 'loading' : currentTax.error ? 'error' : 'idle'
  const tax = currentTax?.estimate ?? null
  const taxAmount = Number(tax?.tax || 0)

  async function verifyVehicle(nextVehicle: VinVehicle) {
    setVehicle(nextVehicle)
    setStatus('Checking fitment for your vehicle…')
    const result = await checkFitment({
      vehicle: nextVehicle,
      items: rows.map((row) => ({ id: row.id })),
    })
    setFitment(result)
    setStatus(result.compatible ? 'Fitment confirmed for every part.' : 'Fitment problem found.')
  }

  function showVinError(message: string) {
    setVinError(message)
    vinInputRef.current?.focus()
  }

  async function onVerifyVin() {
    setError('')
    setVinError('')
    try {
      const decoded = await decodeVin(typedVin)
      await verifyVehicle({ ...decoded.vehicle, vin: typedVin })
    } catch (verifyError) {
      setVehicle(null)
      setFitment(null)
      setStatus('')
      showVinError(verifyError instanceof ApiError ? verifyError.message : 'VIN verification failed')
    }
  }

  // El VIN guardado ya se decodificó al elegirlo: falta solo el fitment, que
  // depende del carrito y por eso espera a que carguen los productos. Corre
  // una sola vez; después el cliente verifica a mano.
  useEffect(() => {
    const saved = pendingSavedVehicle.current
    const cart = JSON.parse(itemsKey) as Array<{ id: string }>
    if (!saved || !cart.length) return
    pendingSavedVehicle.current = null
    const nextVehicle = {
      vin: saved.vin,
      year: saved.year,
      make: saved.make,
      model: saved.model,
      engine: saved.engine,
    }
    setVehicle(nextVehicle)
    setStatus('Checking fitment for your vehicle…')
    checkFitment({ vehicle: nextVehicle, items: cart.map(({ id }) => ({ id })) })
      .then((result) => {
        setFitment(result)
        setStatus(result.compatible ? 'Fitment confirmed for every part.' : 'Fitment problem found.')
      })
      .catch((verifyError: unknown) => {
        setVehicle(null)
        setFitment(null)
        setStatus('')
        // Sin foco: el cliente todavía no hizo nada en esta pantalla.
        setVinError(verifyError instanceof ApiError ? verifyError.message : 'VIN verification failed')
      })
  }, [itemsKey])

  // Cotiza solo cuando la dirección está completa, con espera entre teclas.
  // La tarifa elegida era para la dirección o los ítems anteriores y el
  // backend la rechazaría, así que se descarta antes de recotizar.
  // `ratesAttempt` es el reintento.
  useEffect(() => {
    setShipping(null)
    if (!ratesKey) return
    let cancelled = false
    // Abortar corta la consulta en vuelo cuando la dirección o el carrito cambian.
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      const values = form.getValues()
      try {
        const response = await getShippingRates(
          {
            to: {
              name: values.name,
              phone: values.phone || '',
              street1: values.address1,
              street2: values.address2 || '',
              city: values.city,
              state: values.state.toUpperCase(),
              zip: values.zip.trim(),
              country: values.country || 'US',
            },
            items: JSON.parse(itemsKey) as Array<{ id: string; qty: number }>,
          },
          controller.signal,
        )
        if (cancelled) return
        // `200` con `configured: false`: EasyPost no está configurado.
        if (!response.configured) {
          setRatesResult({ key: ratesKey, error: response.message || 'Shipping provider is not configured' })
          return
        }
        const options: RateOption[] = [
          { label: 'Ground', rate: response.ground ?? null },
          { label: '2nd Day', rate: response.secondDay ?? null },
          { label: 'Overnight', rate: response.overnight ?? null },
        ]
        const preferred = options.find((option) => option.label === preferredTier.current && option.rate)
        const picked = preferred ?? cheapestRate(options)
        setRatesResult({
          key: ratesKey,
          options,
          ...(picked?.rate ? {} : { error: 'No shipping service is available for this address.' }),
        })
        if (picked?.rate) setShipping(picked.rate)
      } catch (ratesFailure) {
        if (cancelled) return
        setRatesResult({
          key: ratesKey,
          error: ratesFailure instanceof ApiError ? ratesFailure.message : 'Could not get shipping rates',
        })
      }
    }, RATES_DEBOUNCE_MS)
    return () => {
      cancelled = true
      clearTimeout(timer)
      controller.abort()
    }
  }, [ratesKey, itemsKey, form, setShipping])

  // Lleva el error al lugar culpable y devuelve dónde quedó (`null` si no
  // corresponde a ninguno). `shouldFocus` solo al pagar: el cálculo
  // automático no le quita el foco a quien está tipeando.
  const showFieldError = useCallback(
    (failure: unknown, shouldFocus = false): { target: CheckoutErrorTarget; message: string } | null => {
      if (!(failure instanceof ApiError)) return null
      const friendly = friendlyApiError(failure)
      const target = checkoutErrorTarget(failure, friendly.field)
      if (!target) return null
      const message = friendly.message
      if (target === 'vin') {
        setVinError(message)
        if (shouldFocus) vinInputRef.current?.focus()
      } else if (target === 'shipping') {
        if (shouldFocus) shippingHeadingRef.current?.focus()
      } else {
        form.setError(target, { type: 'server', message }, { shouldFocus })
      }
      return { target, message }
    },
    [form],
  )

  // Solo los errores que puso el backend: los del schema siguen hasta que el
  // cliente corrija el campo.
  const clearServerErrors = useCallback(() => {
    for (const field of SERVER_ERROR_FIELDS) {
      if (form.getFieldState(field).error?.type === 'server') form.clearErrors(field)
    }
  }, [form])

  // El impuesto depende del envío elegido: se calcula solo cuando hay
  // dirección y tarifa, y de nuevo si cambia cualquiera de las dos. Una
  // respuesta vieja no pisa una más nueva: la limpieza del efecto la descarta.
  useEffect(() => {
    if (!taxKey) return
    let cancelled = false
    const controller = new AbortController()
    clearServerErrors()
    requestTax(JSON.parse(taxInput) as TaxInput, controller.signal).then(
      (estimate) => {
        if (!cancelled) setTaxResult({ key: taxKey, estimate })
      },
      (taxFailure: unknown) => {
        if (cancelled) return
        showFieldError(taxFailure)
        setTaxResult({ key: taxKey, error: taxErrorMessage(taxFailure) })
      },
    )
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [taxKey, taxInput, showFieldError, clearServerErrors])

  async function onPay(values: CheckoutCustomerValues) {
    setError('')
    if (!rows.length || invalidPrice) return
    if (!vinReady) {
      showVinError('Verify the VIN you entered, or clear it, before payment.')
      return
    }
    if (!shipping) {
      setError(
        ratesStatus === 'loading'
          ? 'Wait for shipping rates to finish loading.'
          : 'Choose a shipping method before payment.',
      )
      return
    }
    const selection = toShippingSelection(shipping)
    if (!selection) {
      // Tarifa guardada en una visita anterior, sin shipment que verificar.
      setShipping(null)
      setRatesAttempt((attempt) => attempt + 1)
      setError('Shipping rates expired. Choose a shipping method again.')
      return
    }
    setPaying(true)
    try {
      // Se recalcula justo antes de pagar con lo que el formulario validó.
      clearServerErrors()
      try {
        const estimate = await requestTax({
          state: values.state,
          zip: values.zip,
          city: values.city,
          address1: values.address1,
          parts,
          cores,
          ship,
        })
        setTaxResult({ key: taxKey, estimate })
      } catch (taxFailure) {
        showFieldError(taxFailure, true)
        setTaxResult({ key: taxKey, error: taxErrorMessage(taxFailure) })
        throw new Error('Tax must be calculated before payment.')
      }
      const result = await createCheckout({
        items: cartItems,
        shipping: selection,
        ...(typedVin && vehicle ? { vehicle } : {}),
        customer: {
          ...values,
          state: values.state.toUpperCase(),
          country: (values.country || 'US').toUpperCase(),
        },
      })
      if (!result.url) throw new Error('Secure payment URL was not returned.')
      window.location.assign(result.url)
    } catch (payError) {
      setPaying(false)
      // Un error de un campo se muestra en el campo; el resumen solo avisa.
      // El envío no tiene campo propio: su mensaje va en el resumen.
      const shown = showFieldError(payError, true)
      if (shown) {
        setError(shown.target === 'shipping' ? shown.message : FIX_FIELDS_MESSAGE)
        return
      }
      setError(payError instanceof ApiError ? payError.message : String((payError as Error).message))
    }
  }

  // Un solo texto de progreso para el lector de pantalla: lo más reciente gana.
  const liveStatus =
    ratesStatus === 'loading'
      ? 'Getting live carrier rates…'
      : taxStatus === 'loading'
        ? 'Calculating tax…'
        : status

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <StorefrontButton asChild tone="link" className="px-0">
        <Link to="/">← Back to TorqueTrack</Link>
      </StorefrontButton>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Cart & Secure Checkout</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Review your parts, optionally verify your VIN, enter your shipping address, then continue to the
        payment provider&apos;s secure page. Shipping and tax update automatically.
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
        // react-hook-form enfoca el primer campo inválido; el resumen avisa
        // junto al botón, que queda lejos de los campos.
        onSubmit={(event) =>
          void form.handleSubmit(
            (values) => onPay(values),
            () => setError(FIX_FIELDS_MESSAGE),
          )(event)
        }
      >
        <div className="space-y-4">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base">1. Your Cart</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <CartPriceNotices />
              {rows.length ? (
                <ul className="divide-y">
                  {rows.map((row) => (
                    <li key={row.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                      <Link
                        to={productPath(row)}
                        className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-md bg-muted"
                      >
                        {row.image ? (
                          <img src={row.image} alt="" className="max-h-full max-w-full object-contain" />
                        ) : null}
                      </Link>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium leading-snug">{row.title}</p>
                            <p className="text-sm text-muted-foreground">Part # {row.partNumber}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            {priceChanges[row.id] != null ? (
                              <p className="text-xs text-muted-foreground line-through">
                                {formatMoney(priceChanges[row.id])}
                              </p>
                            ) : null}
                            <p className="font-semibold">
                              {formatMoney((Number(row.price) + Number(row.coreCharge || 0)) * row.qty)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <StorefrontButton
                            type="button"
                            size="sm"
                            tone="outline"
                            className="size-8 px-0"
                            aria-label={`Decrease ${row.title}`}
                            onClick={() => setQty(row.id, row.qty - 1)}
                          >
                            −
                          </StorefrontButton>
                          <span className="w-6 text-center text-sm">{row.qty}</span>
                          <StorefrontButton
                            type="button"
                            size="sm"
                            tone="outline"
                            className="size-8 px-0"
                            aria-label={`Increase ${row.title}`}
                            disabled={row.qty >= MAX_CART_QUANTITY}
                            onClick={() => setQty(row.id, row.qty + 1)}
                          >
                            +
                          </StorefrontButton>
                          <StorefrontButton
                            type="button"
                            tone="danger"
                            className="ml-auto h-auto p-0 text-sm"
                            onClick={() => remove(row.id)}
                          >
                            Remove
                          </StorefrontButton>
                        </div>
                        <CartQuantityLimit qty={row.qty} />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground">Your cart is empty.</p>
                  <Link to="/" className="mt-2 inline-block text-sm font-medium text-sky-900 hover:underline">
                    Continue shopping
                  </Link>
                </div>
              )}
              {invalidPrice ? (
                <p className="mt-3 text-sm text-destructive">
                  Checkout blocked: one or more products still have a missing or $0.00 price.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base">2. Vehicle / VIN Verification (optional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-2">
              {/* El botón va debajo: al lado recortaba los 17 caracteres. */}
              <FormField
                ref={vinInputRef}
                id="checkout-vin"
                label="VIN (optional)"
                value={vin}
                error={vinError}
                onChange={(event) => {
                  setVin(event.target.value.toUpperCase())
                  setVinError('')
                }}
                hint={
                  <p className="text-xs text-muted-foreground">
                    {/* Un vehículo elegido por año y modelo no trae VIN: se
                        recuerda cuál es para que no lo vuelva a buscar. */}
                    {savedVehicle?.source === 'selector' && !vin
                      ? `Your vehicle: ${describeVehicle(savedVehicle)}. Add its VIN to verify fitment before your parts ship.`
                      : 'Adding your VIN lets us verify fitment before your parts ship.'}
                  </p>
                }
                maxLength={17}
                placeholder="17-character VIN"
                spellCheck={false}
                autoComplete="off"
                className="h-11 font-mono text-base tracking-wide md:text-base"
              />
              <div className="flex flex-wrap gap-2">
                <StorefrontButton type="button" disabled={!typedVin} onClick={() => void onVerifyVin()}>
                  Verify VIN
                </StorefrontButton>
                {vin ? (
                  <StorefrontButton
                    type="button"
                    tone="outline"
                    onClick={() => {
                      setVin('')
                      setVinError('')
                      setVehicle(null)
                      setFitment(null)
                      setStatus('')
                      setError('')
                    }}
                  >
                    Clear VIN
                  </StorefrontButton>
                ) : null}
              </div>
              {typedVin && vehicle?.vin !== typedVin ? (
                <p className="text-sm text-muted-foreground">
                  Verify this VIN to continue, or clear it to check out without one.
                </p>
              ) : null}
              {vehicle ? (
                <p className="text-sm">
                  VIN verified: {vehicle.year} {vehicle.make} {vehicle.model}
                </p>
              ) : null}
              {fitment ? (
                <div>
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
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base">3. Customer & Shipping</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="grid gap-3 md:grid-cols-2">
                {CUSTOMER_FIELDS.map(([field, label, autoComplete]) =>
                  // Un select y no texto libre: el backend solo acepta códigos de
                  // la lista y el estado decide si se cobra impuesto.
                  field === 'state' ? (
                    <SelectField
                      key={field}
                      id={field}
                      label={label}
                      options={US_STATE_OPTIONS}
                      autoComplete={autoComplete}
                      error={form.formState.errors.state?.message}
                      {...form.register(field)}
                    />
                  ) : (
                    <FormField
                      key={field}
                      id={field}
                      label={label}
                      autoComplete={autoComplete}
                      readOnly={field === 'email' && Boolean(accountEmail)}
                      error={form.formState.errors[field]?.message}
                      {...form.register(field)}
                    />
                  ),
                )}
              </div>

              {/* `tabIndex={-1}`: recibe el foco cuando el backend rechaza el envío. */}
              <h2 ref={shippingHeadingRef} tabIndex={-1} className="mt-6 text-base font-semibold outline-none">
                Shipping Method
              </h2>
              {!addressComplete && rows.length ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Enter your name, street, city, state and ZIP to see live shipping rates.
                </p>
              ) : null}
              {ratesStatus === 'loading' ? (
                <p className="mt-2 text-sm text-muted-foreground">Getting live carrier rates…</p>
              ) : null}
              {ratesStatus === 'error' ? (
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <p role="alert" className="text-sm text-destructive">
                    {currentRates?.error}
                  </p>
                  <StorefrontButton
                    type="button"
                    tone="outline"
                    size="sm"
                    onClick={() => setRatesAttempt((attempt) => attempt + 1)}
                  >
                    Retry shipping rates
                  </StorefrontButton>
                </div>
              ) : null}
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {rates.map((option) => {
                  const selected = Boolean(shipping?.id && shipping.id === option.rate?.id)
                  return (
                    <Card
                      key={option.label}
                      className={selected ? 'border-amber-400 ring-1 ring-amber-400' : undefined}
                    >
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
                              tone={selected ? 'selected' : 'outline'}
                              className="mt-2 w-full"
                              aria-pressed={selected}
                              onClick={() => {
                                preferredTier.current = option.label
                                setShipping(option.rate)
                              }}
                            >
                              {selected ? 'Selected' : 'Use this rate'}
                            </StorefrontButton>
                          </>
                        ) : (
                          <p>Unavailable</p>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit lg:sticky lg:top-24">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
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
                <dd>{tax ? formatMoney(taxAmount) : taxStatus === 'loading' ? 'Calculating…' : '—'}</dd>
              </div>
              {tax && (tax.source || tax.label) ? (
                <p className="text-xs text-muted-foreground">{tax.source || tax.label}</p>
              ) : null}
              <Separator />
              <div className="flex justify-between text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatMoney(parts + cores + ship + taxAmount)}</dd>
              </div>
            </dl>
            {/* La región existe siempre: un lector de pantalla solo anuncia los
                cambios de una región que ya estaba en la página. */}
            <p aria-live="polite" className="mt-3 text-sm text-muted-foreground empty:hidden">
              {liveStatus}
            </p>
            {taxStatus === 'error' ? (
              <div className="mt-3 space-y-2">
                <p role="alert" className="text-sm text-destructive">
                  {currentTax?.error}
                </p>
                {taxKey ? (
                  <StorefrontButton
                    type="button"
                    tone="outline"
                    size="sm"
                    onClick={() => setTaxAttempt((attempt) => attempt + 1)}
                  >
                    Retry tax
                  </StorefrontButton>
                ) : null}
              </div>
            ) : null}
            {error ? (
              <p role="alert" className="mt-3 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <div className="mt-4 flex flex-col gap-2">
              <StorefrontButton
                type="submit"
                className="rounded-full bg-amber-400 text-neutral-950 hover:bg-amber-500"
                // Sin envío o con el VIN sin verificar se puede enviar igual: el
                // envío marca lo que falta en vez de dejar un botón muerto.
                disabled={!rows.length || invalidPrice || paying}
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
