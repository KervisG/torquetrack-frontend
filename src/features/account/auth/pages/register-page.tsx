import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { FormError } from '@/components/form-error'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { registerSchema, type RegisterValues } from '@/lib/validators/register'

import { register as registerRequest } from '../api'
import { AuthCard } from '../components/auth-card'

export function RegisterPage() {
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      company: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })
  const register = useMutation({ mutationFn: registerRequest })
  const errors = form.formState.errors

  return (
    <AuthCard
      title="Create account"
      description="Track your orders and quotes, and submit tax exemption documents."
      footer={
        <p>
          Already have an account?{' '}
          <Link to="/login" className="underline">
            Sign in
          </Link>
        </p>
      }
    >
      {register.isSuccess ? (
        // El backend responde lo mismo exista o no la cuenta y no abre sesión:
        // no se asume que la persona quedó dentro.
        <div role="status" className="space-y-2 text-sm">
          <p className="font-medium">Check your email to verify your account.</p>
          <p className="text-muted-foreground">
            Then{' '}
            <Link to="/login" className="underline">
              sign in
            </Link>{' '}
            with your email and password.
          </p>
        </div>
      ) : (
        <form
          className="space-y-4"
          noValidate
          onSubmit={form.handleSubmit(({ name, company, phone, email, password }) =>
            register.mutate({ name, company, phone, email, password }),
          )}
        >
          <FormField
            id="name"
            label="Full name"
            autoComplete="name"
            error={errors.name?.message}
            {...form.register('name')}
          />
          <FormField
            id="company"
            label="Company (optional)"
            autoComplete="organization"
            {...form.register('company')}
          />
          <FormField
            id="phone"
            label="Phone (optional)"
            type="tel"
            autoComplete="tel"
            {...form.register('phone')}
          />
          <FormField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...form.register('email')}
          />
          <FormField
            id="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...form.register('password')}
          />
          <FormField
            id="confirmPassword"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...form.register('confirmPassword')}
          />
          <FormError error={register.error} />
          <Button type="submit" className="w-full" disabled={register.isPending}>
            {register.isPending ? 'Creating account…' : 'Create account'}
          </Button>
        </form>
      )}
    </AuthCard>
  )
}
