import { apiRequest } from '@/lib/api-client'

type ActivityEntry = {
  id: number
  actor: string
  action: string
  entityType: string
  entityId: string
  createdAt: Date
}

// `actorId`, `entityType` y `entityId` pueden venir en null: los eventos de
// sistema (p. ej. el webhook de Stripe) no siempre tienen actor o registro.
type RawActivity = {
  id: number
  actorId: string | null
  action: string
  entityType: string | null
  entityId: string | null
  data: Record<string, unknown>
  createdAt: string
}

export async function listActivity(): Promise<ActivityEntry[]> {
  const rows = await apiRequest<RawActivity[]>('/admin/activity')
  return rows.map((row) => ({
    id: row.id,
    actor: row.actorId ?? '',
    action: row.action,
    entityType: row.entityType ?? '',
    entityId: row.entityId ?? '',
    createdAt: new Date(row.createdAt),
  }))
}
