import { useInfiniteQuery } from '@tanstack/react-query'

import { FormError } from '@/components/form-error'
import { PageHeader } from '@/components/app-shell/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PermissionNotice } from '@/features/admin/auth/components/permission-notice'
import { useAdminPermissions } from '@/features/admin/auth/hooks/use-admin-permissions'

import { listActivity } from '../api'
import { activityKeys } from '../query-keys'

const timestamp = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' })

export function ActivityPage() {
  const { can } = useAdminPermissions()
  const allowed = can('activity.view')
  const activity = useInfiniteQuery({
    queryKey: activityKeys.list(),
    queryFn: ({ pageParam }) => listActivity(pageParam),
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: allowed,
  })
  const entries = activity.data?.pages.flatMap((page) => page.items) ?? []

  if (!allowed) {
    return (
      <PermissionNotice title="Activity" message="You do not have permission to view activity." />
    )
  }

  return (
    <section className="space-y-6">
      <PageHeader title="Activity" description="Audit trail of changes made in the admin panel." />
      <Card>
        <CardContent className="pt-6">
          {activity.isPending ? (
            <p className="text-sm text-muted-foreground">Loading activity…</p>
          ) : activity.error && !activity.isFetchNextPageError ? (
            <FormError error={activity.error} />
          ) : !entries.length ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <div className="space-y-4 overflow-x-auto">
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
                  {entries.map((entry) => (
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
              {/* Si falla la página siguiente se conservan las filas ya cargadas. */}
              {activity.isFetchNextPageError ? <FormError error={activity.error} /> : null}
              {activity.hasNextPage ? (
                <Button
                  variant="outline"
                  onClick={() => activity.fetchNextPage()}
                  disabled={activity.isFetchingNextPage}
                >
                  {activity.isFetchingNextPage ? 'Loading…' : 'Load more'}
                </Button>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
