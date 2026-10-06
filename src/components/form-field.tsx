import { forwardRef, type ComponentProps, type ReactNode } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type FormFieldProps = ComponentProps<typeof Input> & {
  label?: string
  labelClassName?: string
  error?: string
  hint?: ReactNode
  action?: ReactNode
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(function FormField(
  {
    id,
    label,
    labelClassName,
    error,
    hint,
    action,
    className,
    'aria-invalid': ariaInvalid,
    'aria-describedby': ariaDescribedBy,
    ...props
  },
  ref,
) {
  // Con error el campo queda marcado (borde rojo y `aria-invalid`) y el lector
  // de pantalla lee el mensaje al enfocarlo.
  const errorId = error && id ? `${id}-error` : undefined
  const describedBy = [ariaDescribedBy, errorId].filter(Boolean).join(' ') || undefined
  const input = (
    <Input
      id={id}
      ref={ref}
      aria-invalid={error ? true : ariaInvalid}
      aria-describedby={describedBy}
      className={cn(error && 'border-destructive focus-visible:ring-destructive', className)}
      {...props}
    />
  )

  return (
    <div className="space-y-2">
      {label ? (
        props['aria-required'] ? (
          // El asterisco queda fuera del label: el nombre accesible no cambia
          // y `aria-required` ya anuncia que es obligatorio.
          <div className="flex items-center gap-1">
            <Label htmlFor={id} className={labelClassName}>
              {label}
            </Label>
            <span aria-hidden="true" className="text-sm text-destructive">
              *
            </span>
          </div>
        ) : (
          <Label htmlFor={id} className={labelClassName}>
            {label}
          </Label>
        )
      ) : null}
      {action ? (
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">{input}</div>
          {action}
        </div>
      ) : (
        input
      )}
      {error ? (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {hint}
    </div>
  )
})
