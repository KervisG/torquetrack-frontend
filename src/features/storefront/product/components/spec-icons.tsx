import type { ReactNode } from 'react'

// Íconos propios de la ficha, dibujados en una grilla de 24px con el mismo
// trazo para que se lean como una familia. Temática diesel, no de stock.
export type SpecIconName =
  | 'years'
  | 'make'
  | 'model'
  | 'engine'
  | 'engineFamily'
  | 'engineCode'
  | 'part'
  | 'reman'
  | 'condition'
  | 'availability'
  | 'warranty'
  | 'manufacturer'
  | 'type'
  | 'fuel'
  | 'weight'

const paths: Record<SpecIconName, ReactNode> = {
  years: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18M8 3v4M16 3v4M7.5 14h2M11 14h2M14.5 14h2M7.5 17.5h2M11 17.5h2" />
    </>
  ),
  make: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="6" />
      <path d="M7.5 10h9M6.5 12h11M7.5 14h9" />
    </>
  ),
  model: (
    <>
      <path d="M4.3 16H2.5v-4.2l3.3-.8L8.2 7H13v4.5h8.5V16h-1.8M8.7 16h6.6" />
      <path d="M9 11l1.1-2.7H12V11z" />
      <circle cx="6.5" cy="16.5" r="2" />
      <circle cx="17.5" cy="16.5" r="2" />
    </>
  ),
  engine: (
    <>
      <path d="M5 9h3l1-2h5l1 2h2v2h2v4h-2v2h-3l-1.5 1.5H8L6.5 17H5z" />
      <path d="M3 11v4M3 13h2M9.5 4.5h4M11.5 4.5V7" />
    </>
  ),
  engineFamily: (
    <>
      <rect x="7" y="3" width="10" height="7" rx="1.5" />
      <path d="M7 6h10M12 10v5.5" />
      <circle cx="12" cy="18" r="2.5" />
    </>
  ),
  engineCode: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M8 10l-2 2 2 2M16 10l2 2-2 2M13 9l-2 6" />
    </>
  ),
  part: (
    <>
      <path d="M3 5.5A1.5 1.5 0 0 1 4.5 4h7.6a1.5 1.5 0 0 1 1.06.44l7.4 7.4a1.5 1.5 0 0 1 0 2.12l-6.62 6.62a1.5 1.5 0 0 1-2.12 0l-7.4-7.4A1.5 1.5 0 0 1 3 12.1z" />
      <circle cx="7.5" cy="8.5" r="1.2" />
      <path d="M11 10.5l3.5 3.5M12.8 8.7l3.5 3.5" />
    </>
  ),
  reman: (
    <>
      <path d="M20 12a8 8 0 0 1-13.7 5.6M4 12a8 8 0 0 1 13.7-5.6" />
      <path d="M17.7 3v3.6h-3.6M6.3 21v-3.6h3.6" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  condition: (
    <>
      <path d="M20 12a8 8 0 0 1-13.7 5.6M4 12a8 8 0 0 1 13.7-5.6" />
      <path d="M17.7 3v3.6h-3.6M6.3 21v-3.6h3.6" />
      <path d="M14 9.4a2.2 2.2 0 0 0-3 2.5l-1.8 1.8a.9.9 0 0 0 1.3 1.3l1.8-1.8a2.2 2.2 0 0 0 2.5-3l-1.1 1.1-1-.3-.3-1z" />
    </>
  ),
  availability: (
    <>
      <path d="M3.5 7.5L12 3.5l8.5 4v9L12 20.5l-8.5-4z" />
      <path d="M3.5 7.5L12 11.5l8.5-4M12 11.5v9" />
    </>
  ),
  warranty: (
    <>
      <path d="M12 3l7 2.8v5.4c0 4.3-2.9 8-7 9.3-4.1-1.3-7-5-7-9.3V5.8z" />
      <path d="M8.8 12.2l2.2 2.2 4.3-4.6" />
    </>
  ),
  manufacturer: (
    <>
      <path d="M3 20V10l5 3v-3l5 3v-3l5 3V5h3v15z" />
      <path d="M3 20h18M7 17h2M12 17h2" />
    </>
  ),
  type: (
    <>
      <path d="M10 2.5h4v3h-4zM9 5.5h6v3H9zM10.5 8.5h3v8h-3zM15 6.5h2.5v1.5" />
      <path d="M11.2 16.5h1.6l-.3 2.5h-1zM10 21l-1 1.2M12 21v1.4M14 21l1 1.2" />
    </>
  ),
  fuel: (
    <>
      <path d="M12 3.5c3 3.6 5.5 6.8 5.5 10a5.5 5.5 0 0 1-11 0c0-3.2 2.5-6.4 5.5-10z" />
      <path d="M9.5 14.5A2.5 2.5 0 0 0 12 17" />
    </>
  ),
  weight: (
    <>
      <path d="M9 8a3 3 0 1 1 6 0" />
      <path d="M6.5 9h11l2 11h-15z" />
      <path d="M10 15h4" />
    </>
  ),
}

export function SpecIcon({ name, className }: { name: SpecIconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className ?? 'size-4'}
    >
      {paths[name]}
    </svg>
  )
}

// Etiqueta de un dato de la ficha: ícono en recuadro ámbar de marca y texto
// en negrita, para que se distinga del valor que va debajo.
export function SpecLabel({ icon, children }: { icon?: SpecIconName; children: ReactNode }) {
  return (
    <span className="flex items-center gap-2">
      {icon ? (
        <span className="grid size-7 shrink-0 place-items-center rounded-md bg-amber-100 text-amber-800 ring-1 ring-amber-200/70">
          <SpecIcon name={icon} />
        </span>
      ) : null}
      <span className="text-xs font-semibold text-neutral-800">{children}</span>
    </span>
  )
}
