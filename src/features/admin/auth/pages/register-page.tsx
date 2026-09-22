import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api-client'
import {
  adminRegisterSchema,
  type AdminRegisterValues,
} from '@/lib/validators/admin-register'

import { loginAdmin, registerAdmin } from '../api'
import { AuthCard } from '../components/auth-card'
import { adminSessionKeys } from '../query-keys'

const REGISTER_FIELDS = [
  { id: 'firstName', label: 'First name', autoComplete: 'given-name' },
  { id: 'lastName', label: 'Last name', autoComplete: 'family-name' },
  { id: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { id: 'password', label: 'Password', type: 'password', autoComplete: 'new-password' },
] as const

export function RegisterPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const form = useForm<AdminRegisterValues>({
    resolver: zodResolver(adminRegisterSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '' },
  })
  const register = useMutation({
    mutationFn: async (values: AdminRegisterValues) => {
      await registerAdmin(values)
      return loginAdmin({ email: values.email, password: values.password })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminSessionKeys.all })
      navigate('/admin', { replace: true })
    },
  })

  return (
    <AuthCard title="Create account" description="Register a TorqueTrack account. The system assigns your role.">
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => register.mutate(values))}
      >
        {REGISTER_FIELDS.map((field) => (
          <FormField
            key={field.id}
            id={field.id}
            label={field.label}
            type={'type' in field ? field.type : undefined}
            autoComplete={field.autoComplete}
            error={form.formState.errors[field.id]?.message}
            {...form.register(field.id)}
          />
        ))}
        {register.error instanceof ApiError ? (
          <p className="text-sm text-destructive">{register.error.message}</p>
        ) : null}
        <Button type="submit" className="w-full" disabled={register.isPending}>
          {register.isPending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/admin/login" className="font-medium text-foreground underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  )
}
