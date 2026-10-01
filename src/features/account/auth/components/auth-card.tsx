import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { BrandMark } from '@/components/brand-mark'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'

type AuthCardProps = {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    // 75 % foto a la izquierda y 25 % el formulario a la derecha.
    // Imagen fija: en el login el movimiento compite con el formulario.
    <main className="lg:grid lg:min-h-screen lg:grid-cols-[3fr_1fr] lg:items-stretch">
      <section className="relative isolate h-[42vh] overflow-hidden bg-neutral-950 lg:sticky lg:top-0 lg:h-screen">
        <img
          src="/images/auth-truck.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/10 to-black/25" />
      </section>
      <div className="flex items-center bg-background px-4 py-8">
        <Card className="w-full border-0 shadow-none">
          <CardHeader>
            <p className="flex items-center gap-2 text-sm font-semibold tracking-wide text-muted-foreground">
              <BrandMark variant="small" className="h-[18px] w-8 text-neutral-950" />
              TorqueTrack
            </p>
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
      </div>
    </main>
  )
}
