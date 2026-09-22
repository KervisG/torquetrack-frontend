import type { ReactNode } from 'react'

import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'

type AuthCardProps = {
  title: string
  description: string
  children: ReactNode
}

export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <p className="text-sm font-semibold tracking-wide text-muted-foreground">TorqueTrack</p>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </main>
  )
}
