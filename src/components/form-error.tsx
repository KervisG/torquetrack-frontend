import { ApiError } from '@/lib/api-client'
import { friendlyApiMessage } from '@/lib/api-errors'

// Muestra el `{error}` del backend tal cual; un fallo de red no trae un
// mensaje útil, así que se reemplaza por uno genérico. Con `friendly` pasa por
// la capa de traducción de `lib/api-errors`.
export function FormError({ error, friendly = false }: { error: unknown; friendly?: boolean }) {
  if (!error) return null
  const message = friendly
    ? friendlyApiMessage(error)
    : error instanceof ApiError
      ? error.message
      : 'Something went wrong. Try again.'
  return (
    <p role="alert" className="text-sm text-destructive">
      {message}
    </p>
  )
}
