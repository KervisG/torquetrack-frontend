import { useState } from 'react'

import { cn } from '@/lib/utils'

// `steps` muestra un paso a la vez; `single` muestra todas las secciones juntas.
export type FormLayout = 'steps' | 'single'

function readLayout(storageKey: string): FormLayout | null {
  try {
    const stored = window.localStorage.getItem(storageKey)
    return stored === 'steps' || stored === 'single' ? stored : null
  } catch {
    return null
  }
}

function storeLayout(storageKey: string, layout: FormLayout) {
  try {
    window.localStorage.setItem(storageKey, layout)
  } catch {
    // Sin almacenamiento la elección vale solo para esta sesión.
  }
}

// Preferencia de cada navegador por formulario. El acceso puede fallar (modo privado).
export function useFormLayout(storageKey: string) {
  const [layout, setLayout] = useState<FormLayout | null>(() => readLayout(storageKey))

  function chooseLayout(next: FormLayout) {
    storeLayout(storageKey, next)
    setLayout(next)
  }

  return [layout, chooseLayout] as const
}

// Interruptor del encabezado entre los dos modos del formulario.
export function FormLayoutSwitch({
  value,
  onChange,
}: {
  value: FormLayout
  onChange: (layout: FormLayout) => void
}) {
  const options: Array<{ value: FormLayout; label: string }> = [
    { value: 'steps', label: 'Step by step' },
    { value: 'single', label: 'Single form' },
  ]
  return (
    <div role="radiogroup" aria-label="Form layout" className="flex rounded-full border bg-muted p-0.5">
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              active ? 'bg-neutral-950 text-white shadow-sm' : 'text-neutral-600 hover:text-neutral-950',
            )}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

// Enlaces rápidos a cada sección cuando el formulario se muestra completo.
export function FormSectionNav({
  label,
  sections,
  onSelect,
}: {
  label: string
  sections: Array<{ id: string; label: string }>
  onSelect: (id: string) => void
}) {
  return (
    <nav
      aria-label={label}
      className="sticky top-0 z-10 -mx-6 -mt-4 flex flex-wrap gap-2 border-b bg-background/95 px-6 py-3 backdrop-blur"
    >
      {sections.map((section, index) => (
        <button
          key={section.id}
          type="button"
          className="flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-sm transition-colors hover:bg-secondary"
          onClick={() => onSelect(section.id)}
        >
          <span className="grid size-5 place-items-center rounded-full bg-neutral-200 text-xs font-semibold text-neutral-700">
            {index + 1}
          </span>
          {section.label}
        </button>
      ))}
    </nav>
  )
}

export function scrollToElement(id: string) {
  // jsdom no implementa el desplazamiento.
  try {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  } catch {
    // Sin desplazamiento la sección igual está en la página.
  }
}
