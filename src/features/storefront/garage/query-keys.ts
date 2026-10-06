export const garageKeys = {
  all: ['garage'] as const,
  applications: () => [...garageKeys.all, 'applications'] as const,
}
