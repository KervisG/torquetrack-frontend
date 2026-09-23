import { useQuery } from '@tanstack/react-query'

import { getSession } from '../api'
import { sessionKeys } from '../query-keys'

export function useSession() {
  return useQuery({
    queryKey: sessionKeys.current(),
    queryFn: getSession,
    retry: false,
  })
}
