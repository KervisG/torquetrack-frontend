import { PageHeader } from '@/components/app-shell/page-header'
import { Card, CardContent } from '@/components/ui/card'

import { QuotesPanel } from '../components/quotes-panel'

export function PortalQuotesPage() {
  return (
    <section>
      <PageHeader title="Quotes" description="Quotes prepared for you by the TorqueTrack team." />
      <Card>
        <CardContent className="pt-6">
          <QuotesPanel />
        </CardContent>
      </Card>
    </section>
  )
}
