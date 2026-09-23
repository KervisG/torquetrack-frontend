import { useSession } from '@/features/account/auth/hooks/use-session'

import { hasAdminPermission } from '../types'

// La sesión ya la resolvió `AdminAuthGuard`; las páginas solo preguntan por
// permisos para decidir qué mostrar y si habilitan sus queries.
export function useAdminPermissions() {
  const session = useSession()
  const user = session.data?.user
  return {
    user,
    can: (permission: string) => (user ? hasAdminPermission(user, permission) : false),
  }
}
