import { FormError } from '@/components/form-error'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import type { AdminProduct } from '../types'

type DeleteProductDialogProps = {
  product: AdminProduct
  deleting: boolean
  error: unknown
  onConfirm: (product: AdminProduct) => void
  onOpenChange: (open: boolean) => void
}

// Borrar no tiene vuelta atrás: el modal ofrece suspender como alternativa.
export function DeleteProductDialog({
  product,
  deleting,
  error,
  onConfirm,
  onOpenChange,
}: DeleteProductDialogProps) {
  const label = product.title || product.partNumber || product.id

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!deleting) onOpenChange(open)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete product?</DialogTitle>
          <DialogDescription>
            {label} will be permanently removed from the catalog, with its photos and compatible
            vehicles. Past orders and quotes keep their copy of the line. This cannot be undone.
            To hide it from the store instead, set its status to Inactive.
          </DialogDescription>
        </DialogHeader>
        <FormError error={error} />
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={deleting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={deleting}
            onClick={() => onConfirm(product)}
          >
            {deleting ? 'Deleting…' : 'Delete product'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
