import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useSearchParams } from 'react-router-dom'

import { FormError } from '@/components/form-error'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { newPasswordSchema, type NewPasswordValues } from '@/lib/validators/new-password'

import { activate as activateRequest } from '../api'
import { AuthCard } from '../components/auth-card'
import { useStartSession } from '../hooks/use-start-session'

export function ActivatePage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const startSession = useStartSession()
  const form = useForm<NewPasswordValues>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })
  const activate = useMutation({ mutationFn: activateRequest, onSuccess: startSession })

  return (
    <AuthCard
      title="Activate your account"
      description="Choose a password to open your TorqueTrack customer portal."
    >
      {token ? (
        <form
          className="space-y-4"
          noValidate
          onSubmit={form.handleSubmit(({ password }) => activate.mutate({ token, password }))}
        >
          <FormField
            id="password"
            label="Password"
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
          <FormError error={activate.error} />
          <Button type="submit" className="w-full" disabled={activate.isPending}>
            {activate.isPending ? 'Activating…' : 'Activate account'}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-destructive">This activation link is missing its token.</p>
      )}
    </AuthCard>
  )
}
