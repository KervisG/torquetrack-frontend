import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api-client'

import { logout as logoutRequest } from '../api'
import { adminSessionKeys } from '../query-keys'
import { displayName, type SessionUser } from '../types'

type AdminShellProps = {
  user: SessionUser
  children: ReactNode
}

export function AdminShell({ user, children }: AdminShellProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const logout = useMutation({
    mutationFn: logoutRequest,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminSessionKeys.all })
      navigate('/admin/login', { replace: true })
    },
  })

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <Link to="/admin" className="font-semibold">
              TorqueTrack Admin
            </Link>
            <p className="text-sm text-muted-foreground">{displayName(user)}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
          >
            Sign out
          </Button>
        </div>
        {logout.error instanceof ApiError ? (
          <p className="px-6 pb-3 text-sm text-destructive">{logout.error.message}</p>
        ) : null}
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  )
}
