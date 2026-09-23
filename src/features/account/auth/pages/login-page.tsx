import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { FormError } from '@/components/form-error'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { loginSchema, type LoginValues } from '@/lib/validators/login'

import { login as loginRequest } from '../api'
import { AuthCard } from '../components/auth-card'
import { useStartSession } from '../hooks/use-start-session'

export function LoginPage() {
  const startSession = useStartSession()
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })
  const login = useMutation({ mutationFn: loginRequest, onSuccess: startSession })

  return (
    <AuthCard
      title="Sign in"
      description="Customers and staff sign in with the same TorqueTrack account."
      footer={
        <p>
          New to TorqueTrack?{' '}
          <Link to="/register" className="underline">
            Create an account
          </Link>
        </p>
      }
    >
      <form
        className="space-y-4"
        noValidate
        onSubmit={form.handleSubmit((values) => login.mutate(values))}
      >
        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="username"
          error={form.formState.errors.email?.message}
          {...form.register('email')}
        />
        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          error={form.formState.errors.password?.message}
          {...form.register('password')}
        />
        <p className="text-right text-sm">
          <Link to="/forgot-password" className="underline">
            Forgot your password?
          </Link>
        </p>
        <FormError error={login.error} />
        <Button type="submit" className="w-full" disabled={login.isPending}>
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthCard>
  )
}
