import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { FormError } from '@/components/form-error'
import { FormField } from '@/components/form-field'
import { StorefrontButton } from '@/components/storefront-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useSession } from '@/features/account/auth/hooks/use-session'
import { getAccount } from '@/features/account/portal/api'
import { accountKeys } from '@/features/account/portal/query-keys'
import { listProducts } from '@/features/storefront/catalog/api'
import { catalogKeys } from '@/features/storefront/catalog/query-keys'
import { quoteRequestSchema, type QuoteRequestValues } from '@/lib/validators/quote-request'
import { useCartStore } from '@/stores/cart-store'

import { requestQuote } from '../api'

export function RequestQuotePage() {
  const items = useCartStore((state) => state.items)
  const products = useQuery({ queryKey: catalogKeys.products(), queryFn: listProducts })
  const form = useForm<QuoteRequestValues>({
    resolver: zodResolver(quoteRequestSchema),
    defaultValues: { name: '', email: '', phone: '' },
  })
  const session = useSession()
  // Igual que en el checkout: solo un cliente (sin Role) tiene perfil, y el
  // backend usa el email de la cuenta, así que se muestra bloqueado.
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
    const name = profile.name || profile.company
    if (name && !form.getValues('name')) form.setValue('name', name)
    if (profile.phone && !form.getValues('phone')) form.setValue('phone', profile.phone)
  }, [account.data, form])

  const rows = items
    .map((item) => {
      const product = products.data?.find((row) => row.id === item.id)
      return product ? { ...product, qty: item.qty } : undefined
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row))

  const submit = useMutation({
    mutationFn: (values: QuoteRequestValues) =>
      requestQuote({
        customer: { name: values.name, email: values.email, phone: values.phone },
        items: rows.map((row) => ({ productId: row.id, quantity: row.qty })),
      }),
  })

  if (submit.data) {
    const email = form.getValues('email')
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>
              <h1 className="text-2xl font-semibold">Quote {submit.data.quoteNumber} received</h1>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              A TorqueTrack representative will contact you to confirm fitment, availability,
              pricing, shipping and tax. Keep your reference number{' '}
              <strong>{submit.data.quoteNumber}</strong> handy.
            </p>
            {email ? (
              <p className="text-muted-foreground">
                {submit.data.email.customer
                  ? `A confirmation was sent to ${email}.`
                  : 'We could not email a confirmation right now, but your request was saved.'}
              </p>
            ) : null}
            {accountEmail ? (
              <p className="text-muted-foreground">
                You can follow this quote from{' '}
                <Link to="/account" className="underline underline-offset-4">
                  your account
                </Link>
                .
              </p>
            ) : null}
            <StorefrontButton asChild tone="outline">
              <Link to="/">Keep shopping</Link>
            </StorefrontButton>
          </CardContent>
        </Card>
      </main>
    )
  }

  const errors = form.formState.errors

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <StorefrontButton asChild tone="link" className="px-0">
        <Link to="/checkout">← Back to checkout</Link>
      </StorefrontButton>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">Request a Quote</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Send your cart to our diesel parts team. We&apos;ll review fitment, availability and
        shipping before finalizing the quote.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <CardHeader>
            <CardTitle>Your details</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              aria-label="Request a quote"
              className="space-y-4"
              noValidate
              onSubmit={form.handleSubmit((values) => submit.mutate(values))}
            >
              <FormField
                id="quote-request-name"
                label="Name or company"
                autoComplete="name"
                error={errors.name?.message}
                {...form.register('name')}
              />
              <FormField
                id="quote-request-email"
                label="Email"
                type="email"
                autoComplete="email"
                readOnly={Boolean(accountEmail)}
                error={errors.email?.message}
                {...form.register('email')}
              />
              <FormField
                id="quote-request-phone"
                label="Phone"
                type="tel"
                autoComplete="tel"
                {...form.register('phone')}
              />
              <FormError error={submit.error} />
              {rows.length ? (
                <StorefrontButton type="submit" className="w-full" disabled={submit.isPending}>
                  {submit.isPending ? 'Submitting…' : 'Submit quote request'}
                </StorefrontButton>
              ) : null}
            </form>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Parts in this quote</CardTitle>
          </CardHeader>
          <CardContent>
            {products.isPending ? (
              <p className="text-sm text-muted-foreground">Loading cart…</p>
            ) : rows.length ? (
              <ul className="space-y-3">
                {rows.map((row) => (
                  <li key={row.id} className="space-y-3">
                    <div>
                      <p className="font-semibold">{row.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {row.partNumber ? `${row.partNumber} · ` : ''}Qty {row.qty}
                      </p>
                    </div>
                    <Separator />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="space-y-3">
                <p className="text-destructive">Your cart is empty.</p>
                <StorefrontButton asChild tone="outline">
                  <Link to="/">Find parts</Link>
                </StorefrontButton>
              </div>
            )}
            <p className="mt-4 text-sm text-muted-foreground">
              Pricing, core charges, shipping and tax are confirmed in the final quote.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
