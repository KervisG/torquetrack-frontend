import { CircleHelp } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

// Explica cada filtro del catálogo a quien no sabe cómo buscar una pieza.
const TIPS: Array<{ title: string; text: string }> = [
  {
    title: 'My vehicle',
    text: 'Save your truck (year, make, model and engine, or VIN) and the list shows only the parts that fit it. Uncheck "Only show parts that fit" to see everything.',
  },
  {
    title: 'Search',
    text: 'Type a part name, an OEM number or an aftermarket number. Results update as you type.',
  },
  {
    title: 'Brand',
    text: 'Show parts from a single manufacturer, such as Bosch or Cummins.',
  },
  {
    title: 'Category',
    text: 'Pick the type of part you need: injectors, turbos, pumps and more.',
  },
  {
    title: 'Condition',
    text: 'Choose new, remanufactured or other conditions when a part comes in more than one.',
  },
  {
    title: 'Price',
    text: 'Drag the slider or type a minimum and maximum to stay within your budget.',
  },
]

export function FiltersHelp() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-900 hover:underline"
        >
          <CircleHelp className="size-4" aria-hidden="true" />
          How do filters work?
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>How filters work</DialogTitle>
          <DialogDescription>
            Filters combine: every one you set narrows the list a little more.
          </DialogDescription>
        </DialogHeader>
        <dl className="space-y-4">
          {TIPS.map((tip) => (
            <div key={tip.title}>
              <dt className="text-sm font-semibold">{tip.title}</dt>
              <dd className="mt-1 text-sm text-muted-foreground">{tip.text}</dd>
            </div>
          ))}
        </dl>
        <p className="text-sm text-muted-foreground">
          Not sure which part you need? Call or email us and we will help you find it.
        </p>
      </DialogContent>
    </Dialog>
  )
}
