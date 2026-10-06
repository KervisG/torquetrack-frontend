import { useCallback, useSyncExternalStore } from 'react'

// Sin `matchMedia` (jsdom, navegadores muy viejos) se usa `fallback`, así la
// página siempre elige una de las dos variantes en lugar de no mostrar nada.
export function useMediaQuery(query: string, fallback: boolean) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window.matchMedia !== 'function') return () => {}
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    [query],
  )

  return useSyncExternalStore(subscribe, () =>
    typeof window.matchMedia === 'function' ? window.matchMedia(query).matches : fallback,
  )
}
