export class ApiError extends Error {
  readonly status: number
  // Campo (snake_case) que el backend señala como culpable, si lo manda.
  readonly field?: string

  constructor(message: string, status: number, field?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.field = field
  }
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE'])

// Render en el plan gratuito tarda más de 10 s en despertar. Cortar a los 10 s
// aborta la petición que lo está encendiendo y el panel muestra
// "Something went wrong" al cargar o guardar.
const REQUEST_TIMEOUT_MS = 60_000

function withTrailingSlash(path: string): string {
  const [pathname, query] = path.split('?')
  const normalized = pathname.endsWith('/') ? pathname : `${pathname}/`
  return query ? `${normalized}?${query}` : normalized
}

// Django exige el token CSRF en `X-CSRFToken` en todo request autenticado que
// muta. El backend lo devuelve en el body de `/api/session/` (también en el
// 401), login, registro y activación; se guarda en memoria en vez de leer la
// cookie porque su nombre cambia en producción (`__Host-csrftoken`).
let csrfToken: string | null = null
let pendingCsrfToken: Promise<void> | null = null

export function clearCsrfToken(): void {
  csrfToken = null
  pendingCsrfToken = null
}

function rememberCsrfToken(body: unknown): void {
  if (
    body &&
    typeof body === 'object' &&
    'csrfToken' in body &&
    typeof body.csrfToken === 'string' &&
    body.csrfToken
  ) {
    csrfToken = body.csrfToken
  }
}

// Tras recargar la página no hay token en memoria: se pide la sesión una sola
// vez antes del primer request que muta. Si falla, el request sale sin token
// y el backend responde 403 solo cuando hay sesión.
async function ensureCsrfToken(): Promise<string | null> {
  if (csrfToken) return csrfToken
  pendingCsrfToken ??= apiRequest('/session')
    .then(() => undefined, () => undefined)
    .finally(() => {
      pendingCsrfToken = null
    })
  await pendingCsrfToken
  return csrfToken
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? 'GET').toUpperCase()
  const token = SAFE_METHODS.has(method) ? null : await ensureCsrfToken()

  // Sin credentials el navegador no manda la cookie de sesión y el backend
  // responde 401 en cada request. Django no redirige un POST sin slash final
  // sin perder el body.
  const response = await fetch(`/api${withTrailingSlash(path)}`, {
    ...init,
    credentials: 'include',
    // La señal del llamador (cancelar una consulta vieja) no quita el timeout.
    signal: init?.signal
      ? AbortSignal.any([init.signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)])
      : AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'X-CSRFToken': token } : {}),
      ...init?.headers,
    },
  })

  const body: unknown = await response.json().catch(() => null)
  rememberCsrfToken(body)
  if (!response.ok) {
    const message =
      body &&
      typeof body === 'object' &&
      'error' in body &&
      typeof body.error === 'string'
        ? body.error
        : 'Request failed'
    const field =
      body && typeof body === 'object' && 'field' in body && typeof body.field === 'string'
        ? body.field
        : undefined
    throw new ApiError(message, response.status, field)
  }

  return body as T
}
