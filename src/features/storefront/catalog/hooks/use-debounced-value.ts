import { useEffect, useState } from 'react'

// El valor, una vez que deja de cambiar durante `delayMs`: lo que se tipea o
// se arrastra no dispara una consulta por tecla.
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}
