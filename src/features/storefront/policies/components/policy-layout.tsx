import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { STORE_EMAIL, STORE_PHONE } from '@/lib/store-contact'

import { POLICY_LAST_UPDATED, POLICY_PAGES } from '../policy-values'

type PolicyLayoutProps = {
  title: string
  intro: ReactNode
  children: ReactNode
}

export function PolicyLayout({ title, intro, children }: PolicyLayoutProps) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Card>
        <CardHeader>
          <p className="text-sm font-semibold tracking-[0.32em] text-amber-500">POLICIES</p>
          <CardTitle className="text-3xl">{title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Last updated <time dateTime={POLICY_LAST_UPDATED.iso}>{POLICY_LAST_UPDATED.label}</time>
          </p>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="text-sm leading-relaxed text-muted-foreground">{intro}</div>
          {children}
          <PolicySection title="Contact Us">
            <p>
              Questions about this policy? Call us at{' '}
              <a className="text-sky-900 hover:underline" href={STORE_PHONE.href}>
                {STORE_PHONE.display}
              </a>{' '}
              or email{' '}
              <a className="text-sky-900 hover:underline" href={`mailto:${STORE_EMAIL}`}>
                {STORE_EMAIL}
              </a>
              .
            </p>
          </PolicySection>
        </CardContent>
      </Card>
      <PolicyNav />
    </main>
  )
}

export function PolicySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 text-sm leading-relaxed text-muted-foreground [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-foreground [&_ul]:space-y-1">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  )
}

function PolicyNav() {
  return (
    <nav aria-label="More policies" className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
      {POLICY_PAGES.map((page) => (
        <Link key={page.to} to={page.to} className="text-sky-900 hover:underline">
          {page.title}
        </Link>
      ))}
    </nav>
  )
}
