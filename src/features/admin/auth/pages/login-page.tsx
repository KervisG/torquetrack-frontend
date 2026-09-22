import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api-client'
import {
  adminLoginSchema,
  type AdminLoginValues,
} from '@/lib/validators/admin-login'

import { loginAdmin } from '../api'
import { AuthCard } from '../components/auth-card'
import { adminSessionKeys } from '../query-keys'

export function LoginPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const form = useForm<AdminLoginValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: '', password: '' },
  })
  const login = useMutation({
    mutationFn: loginAdmin,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminSessionKeys.all })
      navigate('/admin', { replace: true })
    },
  })

  return (
    <AuthCard title="Login" description="Sign in with your TorqueTrack account.">
      <form
        className="space-y-4"
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
        {login.error instanceof ApiError ? (
          <p className="text-sm text-destructive">{login.error.message}</p>
        ) : null}
        <Button type="submit" className="w-full" disabled={login.isPending}>
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted-foreground">
        Need an account?{' '}
        <Link to="/admin/register" className="font-medium text-foreground underline">
          Create account
        </Link>
      </p>
      <p className="mt-3 text-sm">
        <Link to="/" className="text-muted-foreground underline">
          Back to store
        </Link>
      </p>
    </AuthCard>
  )
}
