import { PageHeader } from '@/components/app-shell/page-header'
import { Card, CardContent } from '@/components/ui/card'

import { TaxExemptionForm } from '../components/tax-exemption-form'
import { useAccount } from '../hooks/use-account'

export function PortalTaxExemptionPage() {
  const account = useAccount()
  if (!account.data) return null

  return (
    <section>
      <PageHeader title="Tax exemption" description="Submit your resale or exemption certificate for review." />
      <Card>
        <CardContent className="pt-6">
          <TaxExemptionForm profile={account.data} />
        </CardContent>
      </Card>
    </section>
  )
}
