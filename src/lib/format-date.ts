const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' })

export function formatDate(value: Date | null): string {
  return value ? dateFormat.format(value) : '—'
}
