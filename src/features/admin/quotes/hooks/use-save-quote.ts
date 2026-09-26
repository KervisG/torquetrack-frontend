import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAdminPermissions } from '@/features/admin/auth/hooks/use-admin-permissions'
import { saveCustomer } from '@/features/admin/customers/api'
import { adminCustomerKeys } from '@/features/admin/customers/query-keys'
import { dashboardKeys } from '@/features/admin/dashboard/query-keys'
import type { AdminQuoteValues } from '@/lib/validators/admin-quote'

import { saveQuote } from '../api'
import { adminQuoteKeys } from '../query-keys'
import type { AdminQuote } from '../types'

type SavedQuote = { updated: boolean; quote: { id: string; number: string } }

// Alta y edición comparten el POST: el cliente se persiste solo con
// `customers.edit`; si no, la cotización guarda el snapshot.
export function useSaveQuote(
  existing: AdminQuote | undefined,
  onSaved?: (result: SavedQuote) => void,
) {
  const { can } = useAdminPermissions()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: AdminQuoteValues) => {
      let customerId = existing?.customerId ?? null
      if (can('customers.edit')) {
        const customer = await saveCustomer({ id: customerId, ...values.customer })
        customerId = customer.id
      }
      return saveQuote({ ...values, id: existing?.id ?? null, customerId })
    },
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminQuoteKeys.all }),
        queryClient.invalidateQueries({ queryKey: adminCustomerKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
      ])
      onSaved?.(result)
    },
  })
}
