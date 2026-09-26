import { PageHeader } from '@/components/app-shell/page-header'
import { Card, CardContent } from '@/components/ui/card'

import { ProfileForm } from '../components/profile-form'
import { useAccount } from '../hooks/use-account'

export function PortalProfilePage() {
  const account = useAccount()
  if (!account.data) return null

  return (
    <section>
      <PageHeader title="Profile" description="Contact and shipping details used on your orders and quotes." />
      <Card>
        <CardContent className="pt-6">
          <ProfileForm profile={account.data} />
        </CardContent>
      </Card>
    </section>
  )
}
