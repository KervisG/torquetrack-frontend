import { forwardRef, type ComponentProps } from 'react'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

import type { AdminRole } from '../types'

type RoleSelectProps = ComponentProps<'select'> & {
  id: string
  roles: AdminRole[]
  // Texto de la opción vacía: "Select a role" al crear, "Customer" al editar.
  emptyLabel: string
  error?: string
}

// `<select>` nativo en lugar del Select de Radix: se registra directo con
// react-hook-form y funciona con teclado y lectores de pantalla sin portal.
export const RoleSelect = forwardRef<HTMLSelectElement, RoleSelectProps>(function RoleSelect(
  { id, roles, emptyLabel, error, className, ...props },
  ref,
) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Role</Label>
      <select
        id={id}
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
        {...props}
      >
        <option value="">{emptyLabel}</option>
        {roles.map((role) => (
          <option key={role.slug} value={role.slug}>
            {role.fullAccess ? `${role.name} (full access)` : role.name}
          </option>
        ))}
      </select>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
})
