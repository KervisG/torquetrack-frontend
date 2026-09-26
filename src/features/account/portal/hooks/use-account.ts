import { useQuery } from '@tanstack/react-query'

import { getAccount } from '../api'
import { accountKeys } from '../query-keys'

export function useAccount() {
  return useQuery({ queryKey: accountKeys.profile(), queryFn: getAccount })
}
