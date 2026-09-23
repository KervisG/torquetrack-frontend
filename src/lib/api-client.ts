export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE'])

function withTrailingSlash(path: string): string {
  const [pathname, query] = path.split('?')
  const normalized = pathname.endsWith('/') ? pathname : `${pathname}/`
  return query ? `${normalized}?${query}` : normalized
}

// Django entrega el token en la cookie `csrftoken` (la emite `GET /api/session/`)
// y lo exige en `X-CSRFToken` en todo request autenticado que muta.
function readCsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? 'GET').toUpperCase()
  const csrfToken = SAFE_METHODS.has(method) ? null : readCsrfToken()

  // La sesión es la cookie `tt_session`; sin credentials el backend responde
  // 401 en cada request. Django no redirige un POST sin slash final sin
  // perder el body.
  const response = await fetch(`/api${withTrailingSlash(path)}`, {
    ...init,
    credentials: 'include',
    signal: init?.signal ?? AbortSignal.timeout(10_000),
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
      ...init?.headers,
    },
  })

  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      body &&
      typeof body === 'object' &&
      'error' in body &&
      typeof body.error === 'string'
        ? body.error
        : 'Request failed'
    throw new ApiError(message, response.status)
  }

  return body as T
}
