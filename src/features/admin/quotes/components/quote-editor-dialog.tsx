import { useRef, useState } from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAdminPermissions } from '@/features/admin/auth/hooks/use-admin-permissions'
import type { AdminQuoteValues } from '@/lib/validators/admin-quote'

import { useSaveQuote } from '../hooks/use-save-quote'
import { QuoteForm } from './quote-form'

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

type QuoteEditorDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuoteEditorDialog({ open, onOpenChange }: QuoteEditorDialogProps) {
  const { can } = useAdminPermissions()
  const [dirty, setDirty] = useState(false)
  const allowClose = useRef(false)
  const save = useSaveQuote(undefined, () => {
    allowClose.current = true
    onOpenChange(false)
  })

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
          <DialogTitle>New quote</DialogTitle>
          <DialogDescription>
            One step at a time: customer, vehicle, items and shipping. Totals are calculated when
            you save.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {open ? (
            <QuoteForm
              key="new-quote"
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
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
