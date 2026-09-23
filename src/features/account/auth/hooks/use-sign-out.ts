import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { logout } from '../api'

export function useSignOut(redirectTo = '/') {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      navigate(redirectTo, { replace: true })
      // Se descarta todo el cache: pedidos, perfil o usuarios de la cuenta
      // anterior no deben verse si otra persona entra en el mismo navegador.
      await queryClient.resetQueries()
    },
  })
}
