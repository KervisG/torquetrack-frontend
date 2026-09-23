import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { FormError } from '@/components/form-error'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from '@/lib/validators/forgot-password'

import { requestPasswordReset } from '../api'
import { AuthCard } from '../components/auth-card'

export function ForgotPasswordPage() {
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })
  const request = useMutation({ mutationFn: requestPasswordReset })

  return (
    <AuthCard
      title="Reset your password"
      description="Enter the email of your TorqueTrack account and we will send you a reset link."
      footer={
        <p>
          <Link to="/login" className="underline">
            Back to sign in
          </Link>
        </p>
      }
    >
      {request.isSuccess ? (
        // El backend responde lo mismo exista o no la cuenta; se muestra su
        // mensaje neutro tal cual para no insinuar nada distinto.
        <p role="status" className="text-sm">
          {request.data.message}
        </p>
      ) : (
        <form
          className="space-y-4"
          noValidate
          onSubmit={form.handleSubmit((values) => request.mutate(values))}
        >
          <FormField
            id="email"
            label="Email"
            type="email"
            autoComplete="username"
            error={form.formState.errors.email?.message}
            {...form.register('email')}
          />
          <FormError error={request.error} />
          <Button type="submit" className="w-full" disabled={request.isPending}>
            {request.isPending ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}
    </AuthCard>
  )
}
