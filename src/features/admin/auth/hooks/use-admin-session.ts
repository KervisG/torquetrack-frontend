import { useQuery } from '@tanstack/react-query'

import { getAdminSession } from '../api'
import { adminSessionKeys } from '../query-keys'

export function useAdminSession() {
  return useQuery({
    queryKey: adminSessionKeys.current(),
    queryFn: getAdminSession,
    retry: false,
  })
}
