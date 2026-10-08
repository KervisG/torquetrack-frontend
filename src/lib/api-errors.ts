import { ApiError } from '@/lib/api-client'

// Traduce los mensajes crudos del backend a texto amable para el panel y, si
// se puede, los asocia a un campo del formulario. El `field` del payload gana;
// sin él se deduce del mensaje. Un mensaje desconocido se muestra tal cual.

type Rule = {
  pattern: RegExp
  message: string | ((match: RegExpMatchArray) => string)
  field?: string | ((match: RegExpMatchArray) => string)
}

function humanize(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/(\D)(\d)/g, '$1 $2')
    .toLowerCase()
}

const RULES: Rule[] = [
  { pattern: /^price must be greater than 0$/i, message: 'Enter a price greater than $0.', field: 'price' },
  {
    pattern: /^Changing prices or costs requires pricing\.edit$/i,
    message: 'You do not have permission to change prices or costs.',
  },
  { pattern: /^Title is required$/i, message: 'Enter a product title.', field: 'title' },
  { pattern: /^Part number is required$/i, message: 'Enter a part number.', field: 'partNumber' },
  { pattern: /^Enter a 4-digit year$/i, message: 'Enter the year with 4 digits, like 2004.' },
  {
    pattern: /^Enter a year between (\d{4}) and (\d{4})$/i,
    message: (match) => `Enter a year from ${match[1]} to ${match[2]}.`,
  },
  {
    pattern: /^Year to must be the same as or after year from$/i,
    message: 'The end year cannot be before the start year.',
    field: 'yearTo',
  },
  { pattern: /^Valid email required$/i, message: 'Enter a valid email address.', field: 'email' },
  {
    pattern: /^Phone must have 10 to 15 digits$/i,
    message: 'Enter a phone number with 10 to 15 digits, including the area code.',
    field: 'phone',
  },
  { pattern: /^Street address required$/i, message: 'Enter a street address.', field: 'address1' },
  { pattern: /^City required$/i, message: 'Enter a city.', field: 'city' },
  { pattern: /^active must be a boolean$/i, message: 'Choose whether the product is active.', field: 'active' },
  {
    pattern: /^State must be a valid 2-letter US state code$/i,
    message: 'Select a valid US state.',
    field: 'state',
  },
  {
    pattern: /^Shipping ZIP must be 5 digits or ZIP\+4$/i,
    message: 'Enter a 5-digit ZIP code (or ZIP+4).',
    field: 'zip',
  },
  { pattern: /^ZIP code is not a valid US ZIP code\.?$/i, message: 'That ZIP code does not exist in the US.', field: 'zip' },
  {
    pattern: /^ZIP code does not match the selected state\.?$/i,
    message: 'This ZIP code does not match the selected state.',
    field: 'zip',
  },
  {
    pattern: /^That email already belongs to another customer\.?$/i,
    message: 'Another customer already uses this email.',
    field: 'email',
  },
  {
    pattern: /^(\w+) must be a string$/,
    message: (match) => `Enter a valid ${humanize(match[1])}.`,
    field: (match) => match[1],
  },
  {
    pattern: /^(Customer|Product) not found$/i,
    message: (match) => `This ${match[1].toLowerCase()} no longer exists. Refresh and try again.`,
  },
  { pattern: /^Forbidden$/i, message: 'You do not have permission to do that.' },
  { pattern: /^Unauthorized$/i, message: 'Your session has expired. Sign in again.' },
  { pattern: /^Request failed$/i, message: 'Something went wrong. Try again.' },
]

const GENERIC = 'Something went wrong. Try again.'

function isTimeout(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

function isOffline(error: unknown): boolean {
  return error instanceof TypeError && /failed to fetch|networkerror|load failed/i.test(error.message)
}

// `part_number` → `partNumber`: los formularios usan camelCase.
function toCamelCase(value: string): string {
  return value.replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase())
}

export type FriendlyApiError = { message: string; field?: string }

export function friendlyApiError(error: unknown): FriendlyApiError {
  if (!(error instanceof ApiError)) {
    if (isTimeout(error)) return { message: 'The server took too long to respond. Try again.' }
    if (isOffline(error)) return { message: 'Could not reach the server. Try again.' }
    return { message: GENERIC }
  }
  const raw = error.message.trim()
  for (const rule of RULES) {
    const match = raw.match(rule.pattern)
    if (!match) continue
    const message = typeof rule.message === 'string' ? rule.message : rule.message(match)
    const ruleField = typeof rule.field === 'function' ? rule.field(match) : rule.field
    const field = error.field ?? ruleField
    return { message, field: field ? toCamelCase(field) : undefined }
  }
  return { message: raw || GENERIC, field: error.field ? toCamelCase(error.field) : undefined }
}

export function friendlyApiMessage(error: unknown): string {
  return friendlyApiError(error).message
}
