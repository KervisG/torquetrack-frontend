import { forwardRef, type ComponentProps, type ReactNode } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type FormFieldProps = ComponentProps<typeof Input> & {
  label?: string
  labelClassName?: string
  error?: string
  hint?: ReactNode
  action?: ReactNode
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(function FormField(
  { id, label, labelClassName, error, hint, action, className, ...props },
  ref,
) {
  const input = <Input id={id} ref={ref} className={className} {...props} />

  return (
    <div className="space-y-2">
      {label ? (
        <Label htmlFor={id} className={labelClassName}>
          {label}
        </Label>
      ) : null}
      {action ? (
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">{input}</div>
          {action}
        </div>
      ) : (
        input
      )}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {hint}
    </div>
  )
})
