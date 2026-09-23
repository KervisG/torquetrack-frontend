import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { sessionKeys } from '../query-keys'
import { homePathFor, type Session } from '../types'

// Login, registro y activación devuelven la sesión nueva: se escribe en cache
// antes de navegar para que el guard de destino no la vea vacía y rebote.
export function useStartSession() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return (session: Session) => {
    queryClient.setQueryData(sessionKeys.current(), session)
    navigate(homePathFor(session.user), { replace: true })
  }
}
