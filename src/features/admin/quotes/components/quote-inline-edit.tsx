import { Check, Pencil, Trash2, X } from 'lucide-react'
import { useState, type KeyboardEvent, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAdminPermissions } from '@/features/admin/auth/hooks/use-admin-permissions'
import { formatMoney } from '@/lib/money'
import { adminQuoteSchema, type AdminQuoteValues } from '@/lib/validators/admin-quote'

import { useSaveQuote } from '../hooks/use-save-quote'
import { quoteFormValues } from '../quote-form-values'
import type { AdminQuote } from '../types'

// Devuelve el mensaje de error a mostrar junto al campo, o `null` si guardó.
export type SaveChange = (patch: (values: AdminQuoteValues) => AdminQuoteValues) => Promise<string | null>

// Cada lápiz cambia una parte y guarda la cotización completa con el mismo
// POST del editor: el backend reprecia y recalcula el impuesto.
export function useInlineQuoteSave(quote: AdminQuote | undefined): {
  saveChange: SaveChange
  saving: boolean
} {
  const { can } = useAdminPermissions()
  const save = useSaveQuote(quote)

  const saveChange: SaveChange = async (patch) => {
    if (!quote) return 'Quote not found'
    const next = patch(quoteFormValues(quote, can('tax_exemptions.review')))
    const parsed = adminQuoteSchema.safeParse(next)
    if (!parsed.success) return parsed.error.issues[0]?.message ?? 'Check this value'
    try {
      await save.mutateAsync(parsed.data)
      return null
    } catch (error) {
      return error instanceof Error ? error.message : 'Could not save the quote'
    }
  }

  return { saveChange, saving: save.isPending }
}

function PencilButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={`Edit ${label}`}
      title={`Edit ${label}`}
      onClick={onClick}
      className="rounded p-1 text-muted-foreground opacity-60 hover:bg-accent hover:text-foreground hover:opacity-100 focus-visible:opacity-100"
    >
      <Pencil className="size-3.5" aria-hidden="true" />
    </button>
  )
}

function ConfirmButtons({ saving, onCancel }: { saving: boolean; onCancel: () => void }) {
  return (
    <>
      <Button type="submit" size="sm" variant="ghost" className="size-8 p-0" disabled={saving} aria-label="Save">
        <Check className="size-4" aria-hidden="true" />
      </Button>
      <Button type="button" size="sm" variant="ghost" className="size-8 p-0" onClick={onCancel} aria-label="Cancel">
        <X className="size-4" aria-hidden="true" />
      </Button>
    </>
  )
}

const escapeCancels = (cancel: () => void) => (event: KeyboardEvent) => {
  if (event.key === 'Escape') cancel()
}

// Un dato con su lápiz: al editarlo se vuelve un input; Enter guarda y Escape
// cancela.
export function EditableText({
  label,
  value,
  display,
  type = 'text',
  canEdit,
  onSave,
}: {
  label: string
  value: string
  display?: ReactNode
  type?: 'text' | 'email' | 'tel' | 'number'
  canEdit: boolean
  onSave: (value: string) => Promise<string | null>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const cancel = () => {
    setEditing(false)
    setError(null)
  }

  if (!editing) {
    return (
      <div className="group flex min-w-0 items-center gap-1">
        <div className="min-w-0 break-words">{display ?? (value || <span className="text-muted-foreground">—</span>)}</div>
        {canEdit ? (
          <PencilButton
            label={label}
            onClick={() => {
              setDraft(value)
              setEditing(true)
            }}
          />
        ) : null}
      </div>
    )
  }

  return (
    <form
      className="space-y-1"
      onSubmit={async (event) => {
        event.preventDefault()
        setSaving(true)
        const message = await onSave(draft)
        setSaving(false)
        if (message) setError(message)
        else cancel()
      }}
    >
      <div className="flex items-center gap-1">
        <Input
          aria-label={label}
          autoFocus
          type={type}
          step={type === 'number' ? '0.01' : undefined}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={escapeCancels(cancel)}
          className="h-8"
        />
        <ConfirmButtons saving={saving} onCancel={cancel} />
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </form>
  )
}

// Varios datos que se validan juntos (dirección, vehículo) con un solo lápiz.
export function EditableGroup<K extends string>({
  label,
  fields,
  values,
  children,
  canEdit,
  onSave,
}: {
  label: string
  fields: Array<{ key: K; label: string; className?: string }>
  values: Record<K, string>
  children: ReactNode
  canEdit: boolean
  onSave: (values: Record<K, string>) => Promise<string | null>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(values)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const cancel = () => {
    setEditing(false)
    setError(null)
  }

  if (!editing) {
    return (
      <div className="group flex min-w-0 items-start gap-1">
        <div className="min-w-0 flex-1">{children}</div>
        {canEdit ? (
          <PencilButton
            label={label}
            onClick={() => {
              setDraft(values)
              setEditing(true)
            }}
          />
        ) : null}
      </div>
    )
  }

  return (
    <form
      className="space-y-2"
      onKeyDown={escapeCancels(cancel)}
      onSubmit={async (event) => {
        event.preventDefault()
        setSaving(true)
        const message = await onSave(draft)
        setSaving(false)
        if (message) setError(message)
        else cancel()
      }}
    >
      <div className="grid grid-cols-6 gap-2">
        {fields.map((field, index) => (
          <Input
            key={field.key}
            aria-label={field.label}
            placeholder={field.label}
            autoFocus={index === 0}
            value={draft[field.key]}
            onChange={(event) => setDraft({ ...draft, [field.key]: event.target.value })}
            className={`h-8 ${field.className ?? 'col-span-6'}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between gap-2">
        {error ? <p className="text-xs text-destructive">{error}</p> : <span />}
        <div className="flex">
          <ConfirmButtons saving={saving} onCancel={cancel} />
        </div>
      </div>
    </form>
  )
}

type LineDraft = { quantity: string; unitPrice: string; coreCharge: string }

// Una línea de la tabla: el lápiz abre cantidad, precio y core; la papelera
// la quita (una cotización necesita al menos una línea).
export function EditableItemRow({
  item,
  showCore,
  canEdit,
  onSave,
  onRemove,
}: {
  item: { title: string; partNumber: string; quantity: number; unitPrice: number; coreCharge: number }
  showCore: boolean
  canEdit: boolean
  onSave: (line: { quantity: number; unitPrice: number; coreCharge: number }) => Promise<string | null>
  onRemove: () => Promise<string | null>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<LineDraft>({ quantity: '', unitPrice: '', coreCharge: '' })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const cancel = () => {
    setEditing(false)
    setError(null)
  }
  const run = async (action: () => Promise<string | null>) => {
    setSaving(true)
    const message = await action()
    setSaving(false)
    if (message) setError(message)
    else cancel()
  }
  const numberInput = (key: keyof LineDraft, label: string, step: string) => (
    <Input
      aria-label={label}
      type="number"
      step={step}
      value={draft[key]}
      onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
      onKeyDown={escapeCancels(cancel)}
      onKeyUp={(event) => {
        if (event.key === 'Enter') void submit()
      }}
      className="ml-auto h-8 w-24 text-right"
    />
  )
  const submit = () =>
    run(() =>
      onSave({
        quantity: Number(draft.quantity),
        unitPrice: Number(draft.unitPrice),
        coreCharge: Number(draft.coreCharge || 0),
      }),
    )

  return (
    <>
      <tr className="group border-b last:border-0">
        <td className="py-2 pr-4">
          <div className="font-medium">{item.title || '—'}</div>
          {item.partNumber ? <div className="text-xs text-muted-foreground">{item.partNumber}</div> : null}
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </td>
        <td className="py-2 pr-4 text-right tabular-nums">
          {editing ? numberInput('quantity', 'Quantity', '1') : item.quantity}
        </td>
        <td className="py-2 pr-4 text-right tabular-nums">
          {editing ? numberInput('unitPrice', 'Unit price', '0.01') : formatMoney(item.unitPrice)}
        </td>
        {showCore || editing ? (
          <td className="py-2 pr-4 text-right tabular-nums">
            {editing ? numberInput('coreCharge', 'Core charge', '0.01') : formatMoney(item.coreCharge)}
          </td>
        ) : null}
        {canEdit ? (
          <td className="w-20 py-2 text-right">
            {editing ? (
              <div className="flex justify-end">
                <Button type="button" size="sm" variant="ghost" className="size-8 p-0" disabled={saving} aria-label="Save" onClick={() => void submit()}>
                  <Check className="size-4" aria-hidden="true" />
                </Button>
                <Button type="button" size="sm" variant="ghost" className="size-8 p-0" aria-label="Cancel" onClick={cancel}>
                  <X className="size-4" aria-hidden="true" />
                </Button>
              </div>
            ) : (
              <div className="flex justify-end">
                <PencilButton
                  label={item.title}
                  onClick={() => {
                    setDraft({
                      quantity: String(item.quantity),
                      unitPrice: String(item.unitPrice),
                      coreCharge: String(item.coreCharge),
                    })
                    setEditing(true)
                  }}
                />
                <button
                  type="button"
                  aria-label={`Remove ${item.title}`}
                  title="Remove item"
                  disabled={saving}
                  onClick={() => void run(onRemove)}
                  className="rounded p-1 text-muted-foreground opacity-60 hover:bg-accent hover:text-destructive hover:opacity-100"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            )}
          </td>
        ) : null}
      </tr>
    </>
  )
}
