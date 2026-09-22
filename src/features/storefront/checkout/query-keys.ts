export const checkoutKeys = {
  all: ['checkout'] as const,
  tax: () => [...checkoutKeys.all, 'tax'] as const,
  shipping: () => [...checkoutKeys.all, 'shipping'] as const,
  fitment: () => [...checkoutKeys.all, 'fitment'] as const,
}
