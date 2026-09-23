import { useQuery } from '@tanstack/react-query'

import { FormError } from '@/components/form-error'
import { Card, CardContent } from '@/components/ui/card'
import { PermissionNotice } from '@/features/admin/auth/components/permission-notice'
import { useAdminPermissions } from '@/features/admin/auth/hooks/use-admin-permissions'

import { listActivity } from '../api'
import { activityKeys } from '../query-keys'

const timestamp = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' })

export function ActivityPage() {
  const { can } = useAdminPermissions()
  const allowed = can('activity.view')
  const activity = useQuery({
    queryKey: activityKeys.list(),
    queryFn: listActivity,
    enabled: allowed,
  })

  if (!allowed) {
    return (
      <PermissionNotice title="Activity" message="You do not have permission to view activity." />
    )
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Activity</h1>
      <Card>
        <CardContent className="pt-6">
          {activity.isPending ? (
            <p className="text-sm text-muted-foreground">Loading activity…</p>
          ) : activity.error ? (
            <FormError error={activity.error} />
          ) : !activity.data.length ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table aria-label="Activity" className="w-full text-left text-sm">
                <thead className="border-b text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4 font-medium">When</th>
                    <th className="py-2 pr-4 font-medium">Who</th>
                    <th className="py-2 pr-4 font-medium">Action</th>
                    <th className="py-2 font-medium">Record</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.data.map((entry) => (
                    <tr key={entry.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{timestamp.format(entry.createdAt)}</td>
                      <td className="py-2 pr-4">{entry.actor || '—'}</td>
                      <td className="py-2 pr-4">{entry.action}</td>
                      <td className="py-2">
                        {[entry.entityType, entry.entityId].filter(Boolean).join(' · ') || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
