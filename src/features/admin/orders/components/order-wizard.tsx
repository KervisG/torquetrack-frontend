import { useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type WizardStep = {
  id: string
  label: string
  content: ReactNode
}

// Los pasos se pueden abrir en cualquier orden: un pedido ya existe, así que
// el asistente es para leerlo y actuar, no para completar un formulario.
export function OrderWizard({ steps }: { steps: WizardStep[] }) {
  const [index, setIndex] = useState(0)
  const current = steps[index]

  return (
    <div className="space-y-6">
      <ol aria-label="Order steps" className="grid gap-2 sm:grid-cols-4">
        {steps.map((step, stepIndex) => {
          const active = stepIndex === index
          return (
            <li key={step.id}>
              <button
                type="button"
                aria-current={active ? 'step' : undefined}
                onClick={() => setIndex(stepIndex)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-muted',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium',
                    active ? 'bg-primary-foreground text-primary' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {stepIndex + 1}
                </span>
                {step.label}
              </button>
            </li>
          )
        })}
      </ol>
      <div>{current?.content}</div>
      <div className="flex justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={index === 0}
          onClick={() => setIndex((value) => value - 1)}
        >
          Previous
        </Button>
        <Button
          type="button"
          disabled={index >= steps.length - 1}
          onClick={() => setIndex((value) => value + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
