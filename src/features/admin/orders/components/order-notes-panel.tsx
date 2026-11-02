import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'

import { FormError } from '@/components/form-error'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { orderNoteSchema, type OrderNoteValues } from '@/lib/validators/admin-order-note'

import { addOrderNote } from '../api'
import { adminOrderKeys } from '../query-keys'
import type { OrderNote } from '../types'

// Con hora: varias notas del mismo día tienen que poder ordenarse a la vista.
const noteDateFormat = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

type OrderNotesPanelProps = {
  orderId: string
  notes: OrderNote[]
  canAdd: boolean
}

// Notas internas del pedido: solo las ve el staff, nunca el cliente. Son de
// solo agregar; la más reciente va arriba para leer primero el último avance.
export function OrderNotesPanel({ orderId, notes, canAdd }: OrderNotesPanelProps) {
  const queryClient = useQueryClient()
  const form = useForm<OrderNoteValues>({
    resolver: zodResolver(orderNoteSchema),
    defaultValues: { body: '' },
  })
  const add = useMutation({
    mutationFn: ({ body }: OrderNoteValues) => addOrderNote(orderId, body),
    onSuccess: async () => {
      form.reset()
      await queryClient.invalidateQueries({ queryKey: adminOrderKeys.all })
    },
  })
  const error = form.formState.errors.body?.message
  const fieldId = `order-note-${orderId}`

  return (
    <div className="space-y-4">
      {canAdd ? (
        <form
          aria-label="Add internal note"
          className="space-y-2"
          noValidate
          onSubmit={form.handleSubmit((values) => add.mutate(values))}
        >
          <Label htmlFor={fieldId}>New note</Label>
          <textarea
            id={fieldId}
            rows={3}
            placeholder="Where it was ordered, PO number, verification, follow-up…"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${fieldId}-error` : undefined}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...form.register('body')}
          />
          {error ? (
            <p id={`${fieldId}-error`} className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={add.isPending}>
            {add.isPending ? 'Saving…' : 'Add note'}
          </Button>
          <FormError error={add.error} />
        </form>
      ) : null}
      {notes.length ? (
        <ul aria-label="Internal notes" className="space-y-3">
          {[...notes].reverse().map((note) => (
            <li key={note.id} className="rounded-md border p-3 text-sm">
              <p className="whitespace-pre-wrap break-words">{note.body}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {note.by} · {noteDateFormat.format(note.at)}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No internal notes yet.</p>
      )}
    </div>
  )
}
