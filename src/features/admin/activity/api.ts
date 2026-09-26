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

type ActivityPage = {
  items: ActivityEntry[]
  nextCursor: number | null
}

// `before` es el `nextCursor` de la página anterior; sin él llega la primera.
export async function listActivity(before: number | null): Promise<ActivityPage> {
  const query = before === null ? '' : `?before=${before}`
  const page = await apiRequest<{ items: RawActivity[]; nextCursor: number | null }>(
    `/admin/activity${query}`,
  )
  return {
    items: page.items.map((row) => ({
      id: row.id,
      actor: row.actorId ?? '',
      action: row.action,
      entityType: row.entityType ?? '',
      entityId: row.entityId ?? '',
      createdAt: new Date(row.createdAt),
    })),
    nextCursor: page.nextCursor,
  }
}
