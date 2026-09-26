import { PageHeader } from '@/components/app-shell/page-header'
import { Card, CardContent } from '@/components/ui/card'

import { OrdersPanel } from '../components/orders-panel'

export function PortalOrdersPage() {
  return (
    <section>
      <PageHeader title="Orders" description="Orders placed with this account." />
      <Card>
        <CardContent className="pt-6">
          <OrdersPanel />
        </CardContent>
      </Card>
    </section>
  )
}
