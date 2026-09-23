import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { FormError } from '@/components/form-error'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { adminOrderKeys } from '@/features/admin/orders/query-keys'
import { dashboardKeys } from '@/features/admin/dashboard/query-keys'

import { convertQuote, deleteQuote, getPublicLink, reopenQuote, sendQuote } from '../api'
import { adminQuoteKeys } from '../query-keys'
import type { AdminQuote } from '../types'

type QuoteActionsProps = {
  quote: AdminQuote
  can: (permission: string) => boolean
}

type Confirming = 'convert' | 'delete' | null

// Cada acción se muestra solo con el permiso que exige su endpoint. El error
// del backend (correo sin configurar, cotización vencida) se muestra tal cual.
export function QuoteActions({ quote, can }: QuoteActionsProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState<Confirming>(null)
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: adminQuoteKeys.all }),
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
    ])
  }
  const send = useMutation({ mutationFn: () => sendQuote(quote.id), onSuccess: refresh })
  const link = useMutation({ mutationFn: () => getPublicLink(quote.id) })
  const reopen = useMutation({ mutationFn: () => reopenQuote(quote.id), onSuccess: refresh })
  const convert = useMutation({
    mutationFn: () => convertQuote(quote.id),
    onSuccess: async () => {
      await Promise.all([refresh(), queryClient.invalidateQueries({ queryKey: adminOrderKeys.all })])
    },
  })
  const remove = useMutation({
    mutationFn: () => deleteQuote(quote.id),
    onSuccess: async () => {
      await refresh()
      navigate('/admin/quotes')
    },
  })
  const mutations = [send, link, reopen, convert, remove]
  const busy = mutations.some((mutation) => mutation.isPending)
  const error = mutations.find((mutation) => mutation.error)?.error

  const expired = quote.status === 'EXPIRED'
  const converted = quote.status === 'CONVERTED'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {can('quotes.create') ? (
          <Button asChild variant="outline">
            <Link to={`/admin/quotes/${encodeURIComponent(quote.id)}/edit`}>Edit quote</Link>
          </Button>
        ) : null}
        {can('quotes.send') && quote.customer.email ? (
          <Button type="button" disabled={busy} onClick={() => send.mutate()}>
            {send.isPending ? 'Sending…' : 'Send to customer'}
          </Button>
        ) : null}
        <Button type="button" variant="outline" disabled={busy} onClick={() => link.mutate()}>
          Get public link
        </Button>
        {can('quotes.edit') && expired ? (
          <Button type="button" variant="outline" disabled={busy} onClick={() => reopen.mutate()}>
            Reopen for 30 days
          </Button>
        ) : null}
        {can('quotes.convert') && !expired && !converted ? (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => setConfirming('convert')}
          >
            Convert to order
          </Button>
        ) : null}
        {can('quotes.delete') ? (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => setConfirming('delete')}
          >
            Delete
          </Button>
        ) : null}
      </div>

      {confirming ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border p-3 text-sm">
          <span>
            {confirming === 'convert'
              ? `Create an order from quote ${quote.number}?`
              : quote.orderNumber
                ? `Quote ${quote.number} is linked to order ${quote.orderNumber}; it will be archived.`
                : `Delete quote ${quote.number}? This cannot be undone.`}
          </span>
          <Button
            type="button"
            size="sm"
            variant={confirming === 'delete' ? 'destructive' : 'default'}
            disabled={busy}
            onClick={() => {
              setConfirming(null)
              if (confirming === 'convert') convert.mutate()
              else remove.mutate()
            }}
          >
            {confirming === 'convert' ? 'Confirm convert' : 'Confirm delete'}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setConfirming(null)}>
            Cancel
          </Button>
        </div>
      ) : null}

      <FormError error={error} />
      {send.isSuccess ? (
        <p className="text-sm text-muted-foreground">Quote emailed to {quote.customer.email}.</p>
      ) : null}
      {reopen.isSuccess ? (
        <p className="text-sm text-muted-foreground">Quote reopened for 30 days.</p>
      ) : null}
      {convert.data ? (
        <p className="text-sm">
          <Link
            to={`/admin/orders/${encodeURIComponent(convert.data.order.id)}`}
            className="font-medium underline underline-offset-4"
          >
            Open order {convert.data.order.number}
          </Link>
        </p>
      ) : null}
      {link.data ? (
        <div className="space-y-2">
          <FormField
            id={`public-link-${quote.id}`}
            label="Public quote link"
            readOnly
            value={link.data.url}
            onFocus={(event) => event.currentTarget.select()}
          />
          <a
            href={link.data.url}
            target="_blank"
            rel="noreferrer"
            className="text-sm underline underline-offset-4"
          >
            Open public page
          </a>
        </div>
      ) : null}
    </div>
  )
}
