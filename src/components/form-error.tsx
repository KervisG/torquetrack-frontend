import { ApiError } from '@/lib/api-client'

// Muestra el `{error}` del backend tal cual; un fallo de red no trae un
// mensaje útil, así que se reemplaza por uno genérico.
export function FormError({ error }: { error: unknown }) {
  if (!error) return null
  const message = error instanceof ApiError ? error.message : 'Something went wrong. Try again.'
  return (
    <p role="alert" className="text-sm text-destructive">
      {message}
    </p>
  )
}
