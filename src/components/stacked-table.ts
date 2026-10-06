// Debajo de `md` una tabla ancha se corta en el teléfono: se apila y cada fila
// queda como tarjeta. Cada celda muestra su encabezado desde `data-label`; el
// `thead` sigue disponible para lectores de pantalla.
export const STACKED_TABLE = [
  'max-md:block',
  'max-md:[&_thead]:sr-only',
  'max-md:[&_tbody]:block',
  'max-md:[&_tr]:block',
  'max-md:[&_tr]:py-2',
  'max-md:[&_td]:flex',
  'max-md:[&_td]:items-start',
  'max-md:[&_td]:justify-between',
  'max-md:[&_td]:gap-4',
  'max-md:[&_td]:px-4',
  'max-md:[&_td]:py-1.5',
  'max-md:[&_td]:text-right',
  'max-md:[&_td]:before:shrink-0',
  'max-md:[&_td]:before:text-left',
  'max-md:[&_td]:before:font-medium',
  'max-md:[&_td]:before:text-muted-foreground',
  'max-md:[&_td]:before:content-[attr(data-label)]',
].join(' ')
