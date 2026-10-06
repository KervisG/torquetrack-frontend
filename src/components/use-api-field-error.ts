import { useEffect } from 'react'
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form'

import { friendlyApiError } from '@/lib/api-errors'

// Lleva el error del backend al campo culpable (borde rojo, mensaje y foco).
// Devuelve el mensaje que queda para el aviso general: `null` si se mostró en
// un campo del formulario.
export function useApiFieldError<T extends FieldValues>(
  form: UseFormReturn<T>,
  error: unknown,
): string | null {
  const friendly = error ? friendlyApiError(error) : null
  const field =
    friendly?.field && friendly.field in form.getValues() ? (friendly.field as Path<T>) : null
  const message = friendly?.message

  useEffect(() => {
    if (field && message) form.setError(field, { type: 'server', message }, { shouldFocus: true })
  }, [form, field, message, error])

  if (!friendly) return null
  return field ? null : friendly.message
}
