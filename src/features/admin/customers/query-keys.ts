export const adminCustomerKeys = {
  all: ['admin-customers'] as const,
  list: () => [...adminCustomerKeys.all, 'list'] as const,
  taxExemption: (id: string) => [...adminCustomerKeys.all, 'tax-exemption', id] as const,
}
