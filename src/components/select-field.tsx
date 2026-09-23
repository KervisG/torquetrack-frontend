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
  { id, label, options, error, className, ...props },
  ref,
) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
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
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
})
