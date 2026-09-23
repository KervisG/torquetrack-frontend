import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { FormError } from '@/components/form-error'
import { accountKeys } from '@/features/account/portal/query-keys'

import { verifyEmail } from '../api'
import { AuthCard } from '../components/auth-card'
import { emailVerificationKeys, sessionKeys } from '../query-keys'
import type { EmailVerification } from '../types'

function plural(count: number, noun: string) {
  return `${count} past ${noun}${count === 1 ? '' : 's'}`
}

function linkedHistory({ linkedOrders, linkedQuotes }: EmailVerification): string | null {
  const parts = [
    linkedOrders ? plural(linkedOrders, 'order') : null,
    linkedQuotes ? plural(linkedQuotes, 'quote') : null,
  ].filter(Boolean)
  return parts.length ? `We added ${parts.join(' and ')} to your account.` : null
}

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const queryClient = useQueryClient()
  // El token es de un solo uso: sin reintentos ni refetch, o el segundo
  // request mostraría "enlace vencido" después de haber verificado.
  const verification = useQuery({
    queryKey: emailVerificationKeys.token(token),
    queryFn: () => verifyEmail(token),
    enabled: Boolean(token),
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
  })

  useEffect(() => {
    if (!verification.isSuccess) return
    // `emailVerified` y el historial del portal cambiaron en el backend.
    void queryClient.invalidateQueries({ queryKey: sessionKeys.all })
    void queryClient.invalidateQueries({ queryKey: accountKeys.all })
  }, [verification.isSuccess, queryClient])

  const history = verification.data ? linkedHistory(verification.data) : null
  const accountLink = (
    <Link to="/account" className="underline">
      Go to my account
    </Link>
  )

  return (
    <AuthCard title="Verify your email" description="Confirm the email of your TorqueTrack account.">
      {!token ? (
        <p className="text-sm text-destructive">This verification link is missing its token.</p>
      ) : verification.isPending ? (
        <p className="text-sm text-muted-foreground">Verifying your email…</p>
      ) : verification.isError ? (
        <div className="space-y-2 text-sm">
          <FormError error={verification.error} />
          {accountLink}
        </div>
      ) : (
        <div role="status" className="space-y-2 text-sm">
          <p>Your email is verified.</p>
          {history ? <p>{history}</p> : null}
          {accountLink}
        </div>
      )}
    </AuthCard>
  )
}
