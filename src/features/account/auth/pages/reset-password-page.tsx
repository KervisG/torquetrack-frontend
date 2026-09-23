import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'

import { FormError } from '@/components/form-error'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { newPasswordSchema, type NewPasswordValues } from '@/lib/validators/new-password'

import { confirmPasswordReset } from '../api'
import { AuthCard } from '../components/auth-card'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const form = useForm<NewPasswordValues>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })
  const reset = useMutation({ mutationFn: confirmPasswordReset })

  return (
    <AuthCard
      title="Choose a new password"
      description="Your new password replaces the old one and signs you out everywhere."
      footer={
        <p>
          <Link to="/forgot-password" className="underline">
            Request a new link
          </Link>
        </p>
      }
    >
      {!token ? (
        <p className="text-sm text-destructive">This reset link is missing its token.</p>
      ) : reset.isSuccess ? (
        <div role="status" className="space-y-2 text-sm">
          <p>Your password was reset.</p>
          <Link to="/login" className="underline">
            Sign in
          </Link>
        </div>
      ) : (
        <form
          className="space-y-4"
          noValidate
          onSubmit={form.handleSubmit(({ password }) => reset.mutate({ token, password }))}
        >
          <FormField
            id="password"
            label="New password"
            type="password"
            autoComplete="new-password"
            error={form.formState.errors.password?.message}
            {...form.register('password')}
          />
          <FormField
            id="confirmPassword"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            error={form.formState.errors.confirmPassword?.message}
            {...form.register('confirmPassword')}
          />
          <FormError error={reset.error} />
          <Button type="submit" className="w-full" disabled={reset.isPending}>
            {reset.isPending ? 'Saving…' : 'Reset password'}
          </Button>
        </form>
      )}
    </AuthCard>
  )
}
