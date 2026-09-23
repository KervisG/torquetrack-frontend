// La verificación se modela como query por token: React Query deduplica el
// request, así el doble montaje de StrictMode no consume el enlace dos veces.
export const emailVerificationKeys = {
  all: ['email-verification'] as const,
  token: (token: string) => [...emailVerificationKeys.all, token] as const,
}

export const sessionKeys = {
  all: ['session'] as const,
  current: () => [...sessionKeys.all, 'current'] as const,
}
