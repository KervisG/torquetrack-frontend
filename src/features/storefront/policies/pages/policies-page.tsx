import { Link } from 'react-router-dom'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePageMeta } from '@/lib/page-meta'

import { POLICY_PAGES } from '../policy-values'

export function PoliciesPage() {
  usePageMeta({
    title: 'Store Policies',
    description: 'Shipping, returns, privacy and terms for parts ordered from TorqueTrack Diesel.',
    canonicalPath: '/policies',
  })
  return (
    <main className="mx-auto max-w-xl px-4 py-20">
      <Card>
        <CardHeader>
          <p className="text-sm font-semibold tracking-[0.32em] text-amber-500">POLICIES</p>
          <CardTitle className="text-3xl">Store Policies</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {POLICY_PAGES.map((page) => (
              <li key={page.to}>
                <Link to={page.to} className="block py-3 font-medium text-sky-900 hover:underline">
                  {page.title}
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </main>
  )
}
