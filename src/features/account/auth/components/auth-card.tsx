import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'

type AuthCardProps = {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <p className="text-sm font-semibold tracking-wide text-muted-foreground">TorqueTrack</p>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {children}
          <div className="mt-6 space-y-2 text-sm">
            {footer}
            <p>
              <Link to="/" className="text-muted-foreground underline">
                Back to store
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
