import { useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type FormStep = { id: string; label: string }

// Paso actual de un formulario largo. Al crear se avanza en orden (`reached`
// es el paso más lejano que ya se validó); al editar, `free` deja saltar a
// cualquiera porque el registro ya está completo.
export function useFormSteps(steps: FormStep[], { free = false } = {}) {
  const [current, setCurrent] = useState(0)
  const [reached, setReached] = useState(0)
  const last = steps.length - 1

  function goTo(index: number) {
    const target = Math.min(Math.max(index, 0), last)
    setCurrent(target)
    setReached((previous) => Math.max(previous, target))
  }

  return {
    current,
    isFirst: current === 0,
    isLast: current === last,
    // Hasta dónde se puede saltar desde el indicador.
    reachable: free ? last : reached,
    goTo,
    next: () => goTo(current + 1),
    back: () => goTo(current - 1),
  }
}

type StepIndicatorProps = {
  steps: FormStep[]
  current: number
  reachable: number
  onSelect: (index: number) => void
}

export function StepIndicator({ steps, current, reachable, onSelect }: StepIndicatorProps) {
  return (
    <ol aria-label="Steps" className="flex flex-wrap gap-2">
      {steps.map((step, index) => {
        const active = index === current
        return (
          <li key={step.id}>
            <button
              type="button"
              aria-current={active ? 'step' : undefined}
              disabled={index > reachable}
              onClick={() => onSelect(index)}
              className={cn(
                'flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors',
                active
                  ? 'border-neutral-950 bg-neutral-950 text-white'
                  : 'bg-background hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-background',
              )}
            >
              <span
                className={cn(
                  'grid size-5 place-items-center rounded-full text-xs font-semibold',
                  active ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-200 text-neutral-700',
                )}
              >
                {index + 1}
              </span>
              {step.label}
            </button>
          </li>
        )
      })}
    </ol>
  )
}

// El contenido de un paso. Los que no se ven siguen montados (`hidden`): el
// formulario conserva lo escrito al ir y volver.
export function StepPanel({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <div hidden={!active} className="space-y-8">
      {children}
    </div>
  )
}

type StepNavProps = {
  isFirst: boolean
  isLast: boolean
  submitting: boolean
  saveLabel: string
  onBack: () => void
  // "Next" es el submit del formulario (también con Enter); quien arma el
  // formulario decide si avanza o guarda.
  onSave: () => void
  // Al editar se puede guardar desde cualquier paso.
  saveAnytime?: boolean
  onCancel?: () => void
}

export function StepNav({
  isFirst,
  isLast,
  submitting,
  saveLabel,
  onBack,
  onSave,
  saveAnytime = false,
  onCancel,
}: StepNavProps) {
  const save = (
    <Button type={isLast ? 'submit' : 'button'} disabled={submitting} onClick={isLast ? undefined : onSave}>
      {submitting ? 'Saving…' : saveLabel}
    </Button>
  )
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex gap-2">
        {onCancel ? (
          <Button type="button" variant="outline" disabled={submitting} onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        {isFirst ? null : (
          <Button type="button" variant="outline" disabled={submitting} onClick={onBack}>
            Back
          </Button>
        )}
      </div>
      <div className="flex gap-2">
        {isLast ? null : (
          <Button type="submit" variant={saveAnytime ? 'outline' : 'default'} disabled={submitting}>
            Next
          </Button>
        )}
        {isLast || saveAnytime ? save : null}
      </div>
    </div>
  )
}
