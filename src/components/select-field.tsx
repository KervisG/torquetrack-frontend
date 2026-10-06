import { forwardRef, type ComponentProps } from 'react'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type SelectFieldProps = ComponentProps<'select'> & {
  id: string
  label: string
  options: ReadonlyArray<{ value: string; label: string }>
  error?: string
}

// `<select>` nativo en lugar del Select de Radix: se registra directo con
// react-hook-form y funciona con teclado y lectores de pantalla sin portal.
export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  {
    id,
    label,
    options,
    error,
    className,
    'aria-invalid': ariaInvalid,
    'aria-describedby': ariaDescribedBy,
    ...props
  },
  ref,
) {
  // Igual que `FormField`: con error queda marcado y describe el mensaje.
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [ariaDescribedBy, errorId].filter(Boolean).join(' ') || undefined
  return (
    <div className="space-y-2">
      {props['aria-required'] ? (
        <div className="flex items-center gap-1">
          <Label htmlFor={id}>{label}</Label>
          <span aria-hidden="true" className="text-sm text-destructive">
            *
          </span>
        </div>
      ) : (
        <Label htmlFor={id}>{label}</Label>
      )}
      <select
        id={id}
        ref={ref}
        aria-invalid={error ? true : ariaInvalid}
        aria-describedby={describedBy}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          error && 'border-destructive focus-visible:ring-destructive',
          className,
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
})
