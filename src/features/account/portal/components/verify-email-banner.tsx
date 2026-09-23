import { useMutation } from '@tanstack/react-query'

import { FormError } from '@/components/form-error'
import { Button } from '@/components/ui/button'
import { resendVerificationEmail } from '@/features/account/auth/api'

// Sin verificar se puede comprar igual; el aviso existe porque los pedidos
// hechos como invitado con este email solo aparecen después de verificar.
export function VerifyEmailBanner({ email }: { email: string }) {
  const resend = useMutation({ mutationFn: resendVerificationEmail })

  return (
    <section
      aria-label="Email verification"
      className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
    >
      <p className="font-semibold">Verify your email</p>
      <p className="mt-1">
        Open the link we sent to {email} to confirm it. Orders and quotes you placed as a guest
        with this email will then show up here.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={resend.isPending}
          onClick={() => resend.mutate()}
        >
          {resend.isPending ? 'Sending…' : 'Resend email'}
        </Button>
        {resend.isSuccess ? (
          <p role="status">We sent a new verification link to {email}.</p>
        ) : null}
        <FormError error={resend.error} />
      </div>
    </section>
  )
}
