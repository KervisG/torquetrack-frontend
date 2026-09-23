import { useQuery } from '@tanstack/react-query'

import { getSession } from '../api'
import { adminSessionKeys } from '../query-keys'

export function useAdminSession() {
  return useQuery({
    queryKey: adminSessionKeys.current(),
    queryFn: getSession,
    retry: false,
  })
}
