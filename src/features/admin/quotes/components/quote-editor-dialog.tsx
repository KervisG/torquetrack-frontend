import { useRef, useState, type ReactNode } from 'react'
import { ListChecks, Rows3 } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAdminPermissions } from '@/features/admin/auth/hooks/use-admin-permissions'
import { cn } from '@/lib/utils'
import type { AdminQuoteValues } from '@/lib/validators/admin-quote'

import { useSaveQuote } from '../hooks/use-save-quote'
import { QuoteForm, type QuoteFormLayout } from './quote-form'

const newQuote: AdminQuoteValues = {
  status: 'ACTIVE',
  customer: { name: '', company: '', email: '', phone: '' },
  vehicle: { year: '', make: '', model: '', engine: '', vin: '' },
  items: [],
  shipping: 0,
  shippingAddress: { address1: '', city: '', state: '', zip: '' },
  tax: 0,
  taxOverride: { enabled: false, reason: '' },
  memo: '',
}

// Preferencia de cada navegador: se elige una vez y se cambia con el
// interruptor del encabezado. El acceso puede fallar (modo privado).
const LAYOUT_KEY = 'torquetrack.quoteFormLayout'

function readLayout(): QuoteFormLayout | null {
  try {
    const stored = window.localStorage.getItem(LAYOUT_KEY)
    return stored === 'steps' || stored === 'single' ? stored : null
  } catch {
    return null
  }
}

function storeLayout(layout: QuoteFormLayout) {
  try {
    window.localStorage.setItem(LAYOUT_KEY, layout)
  } catch {
    // Sin almacenamiento la elección vale solo para esta sesión.
  }
}

const descriptions: Record<QuoteFormLayout, string> = {
  steps: 'One step at a time: customer, vehicle, items and shipping. Totals are calculated when you save.',
  single: 'Every section on one page. Totals are calculated when you save.',
}

type QuoteEditorDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuoteEditorDialog({ open, onOpenChange }: QuoteEditorDialogProps) {
  const { can } = useAdminPermissions()
  const [dirty, setDirty] = useState(false)
  const [layout, setLayout] = useState<QuoteFormLayout | null>(readLayout)
  const allowClose = useRef(false)
  const save = useSaveQuote(undefined, () => {
    allowClose.current = true
    onOpenChange(false)
  })

  function chooseLayout(next: QuoteFormLayout) {
    storeLayout(next)
    setLayout(next)
  }

  function handleOpenChange(next: boolean) {
    if (next) {
      onOpenChange(true)
      return
    }
    if (save.isPending) return
    if (
      !allowClose.current &&
      dirty &&
      !window.confirm('You have unsaved changes. Discard them?')
    ) {
      return
    }
    allowClose.current = false
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="h-[100dvh] max-w-none gap-0 overflow-hidden p-0 sm:h-[calc(100dvh-2rem)] sm:max-w-6xl">
        <DialogHeader className="shrink-0 space-y-1 border-b px-6 py-4 pr-12">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <DialogTitle>New quote</DialogTitle>
            {layout ? <LayoutSwitch value={layout} onChange={chooseLayout} /> : null}
          </div>
          <DialogDescription>
            {layout ? descriptions[layout] : 'Choose how you want to fill in quotes.'}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {!open ? null : layout ? (
            // Cambiar de modo no vuelve a montar el formulario: lo escrito se conserva.
            <QuoteForm
              key="new-quote"
              layout={layout}
              defaultValues={newQuote}
              canSearchCatalog={can('products.view')}
              canOverrideTax={can('tax_exemptions.review')}
              submitting={save.isPending}
              error={save.error}
              onDirtyChange={setDirty}
              // "Cancel" va en la barra de pasos, junto a "Back" y "Next".
              onCancel={() => handleOpenChange(false)}
              onSubmit={(values) => save.mutate(values)}
            />
          ) : (
            <LayoutChooser onChoose={chooseLayout} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Interruptor del encabezado entre los dos modos del formulario.
function LayoutSwitch({
  value,
  onChange,
}: {
  value: QuoteFormLayout
  onChange: (layout: QuoteFormLayout) => void
}) {
  const options: Array<{ value: QuoteFormLayout; label: string }> = [
    { value: 'steps', label: 'Step by step' },
    { value: 'single', label: 'Single form' },
  ]
  return (
    <div role="radiogroup" aria-label="Form layout" className="flex rounded-full border bg-muted p-0.5">
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              active ? 'bg-neutral-950 text-white shadow-sm' : 'text-neutral-600 hover:text-neutral-950',
            )}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

// Se muestra la primera vez: después manda la preferencia guardada.
function LayoutChooser({ onChoose }: { onChoose: (layout: QuoteFormLayout) => void }) {
  return (
    <div className="mx-auto grid max-w-3xl gap-4 py-6 sm:grid-cols-2">
      <LayoutCard
        icon={<ListChecks className="size-6" aria-hidden="true" />}
        title="Step by step"
        description="Guided: customer, vehicle, items, shipping and a final review. Each step is checked before moving on."
        onClick={() => onChoose('steps')}
      />
      <LayoutCard
        icon={<Rows3 className="size-6" aria-hidden="true" />}
        title="Single form"
        description="Every section on one page with quick links. Faster when you already have all the details."
        onClick={() => onChoose('single')}
      />
      <p className="text-center text-xs text-muted-foreground sm:col-span-2">
        You can switch at any time from the top of the form.
      </p>
    </div>
  )
}

function LayoutCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: ReactNode
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className="group flex flex-col items-start gap-3 rounded-xl border bg-background p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={onClick}
    >
      <span className="grid size-11 place-items-center rounded-lg bg-amber-100 text-amber-800 ring-1 ring-amber-200">
        {icon}
      </span>
      <span className="text-base font-semibold">{title}</span>
      <span className="text-sm text-muted-foreground">{description}</span>
    </button>
  )
}
