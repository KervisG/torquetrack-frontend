import { useEffect, useRef, useState } from 'react'

// Estado de un panel desplegable (patrón de disclosure) que se cierra al hacer
// pointerdown fuera de `rootRef` o con Escape, devolviendo el foco al disparador.
// `resetKey` (por ejemplo el pathname) cierra el panel cuando cambia.
export function useDismissableMenu(resetKey?: string) {
  const [open, setOpen] = useState(false)
  const [lastKey, setLastKey] = useState(resetKey)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Ajuste durante el render en lugar de un efecto: evita pintar un frame con
  // el panel abierto en la ruta nueva.
  if (lastKey !== resetKey) {
    setLastKey(resetKey)
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return {
    open,
    toggle: () => setOpen((value) => !value),
    close: () => setOpen(false),
    rootRef,
    triggerRef,
  }
}
