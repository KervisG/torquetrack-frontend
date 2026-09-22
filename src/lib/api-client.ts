export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function withTrailingSlash(path: string): string {
  const [pathname, query] = path.split('?')
  const normalized = pathname.endsWith('/') ? pathname : `${pathname}/`
  return query ? `${normalized}?${query}` : normalized
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  // La sesión es la cookie `tt_admin` / `tt_customer`; sin credentials el
  // backend responde 401 en cada request. Django no redirige un POST sin
  // slash final sin perder el body.
  const response = await fetch(`/api${withTrailingSlash(path)}`, {
    ...init,
    credentials: 'include',
    signal: init?.signal ?? AbortSignal.timeout(10_000),
    headers: {
      'Content-Type': 'application/json',
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
