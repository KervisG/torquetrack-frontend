import { apiRequest } from '@/lib/api-client'

import type { AdminCart, AdminCartItem } from './types'

function text(value: unknown): string {
  return value === null || value === undefined ? '' : String(value)
}

function toItem(item: Record<string, unknown>): AdminCartItem {
  const quantity = Number(item.quantity ?? item.qty)
  const price = Number(item.priceAtAdd)
  return {
    id: text(item.id ?? item.productId),
    title: text(item.title),
    partNumber: text(item.partNumber),
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    priceAtAdd: Number.isFinite(price) && price > 0 ? price : undefined,
  }
}

function toCart(row: Record<string, unknown>): AdminCart {
  const items = Array.isArray(row.items) ? row.items : []
  const updated = row.updatedAt
  return {
    id: text(row.id),
    status: text(row.status),
    stage: text(row.stage),
    updatedAt: updated ? new Date(String(updated)) : new Date(0),
    items: items.filter((item) => item && typeof item === 'object').map((item) => toItem(item as Record<string, unknown>)),
    email: text(row.email),
  }
}

export async function listAdminCarts(): Promise<AdminCart[]> {
  const rows = await apiRequest<Record<string, unknown>[]>('/admin/carts')
  return rows.map(toCart)
}
