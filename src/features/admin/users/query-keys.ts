export const adminUserKeys = {
  all: ['admin-users'] as const,
  list: () => [...adminUserKeys.all, 'list'] as const,
  roles: () => [...adminUserKeys.all, 'roles'] as const,
}
