import { Mail, MessageCircle, Phone } from 'lucide-react'
import { useId } from 'react'

import { useDismissableMenu } from '@/components/use-dismissable-menu'
import { STORE_EMAIL, STORE_PHONE } from '@/lib/store-contact'

type ContactMenuProps = {
  triggerClassName: string
}

// Muestra el teléfono y el correo de la tienda sin iniciar una llamada: el
// número es texto para que el cliente decida cómo contactar. Mismo patrón de
// disclosure que `UserMenu`.
export function ContactMenu({ triggerClassName }: ContactMenuProps) {
  const { open, toggle, rootRef, triggerRef } = useDismissableMenu()
  const panelId = useId()

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Contact us"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={toggle}
        className={triggerClassName}
      >
        <MessageCircle className="size-5 shrink-0" aria-hidden="true" />
        <span className="max-sm:hidden">Contact</span>
      </button>
      {open ? (
        <div
          id={panelId}
          className="absolute right-0 z-40 mt-2 w-72 max-w-[calc(100vw-2rem)] space-y-3 rounded-md border bg-popover p-4 text-popover-foreground shadow-lg"
        >
          <p className="text-base font-semibold">Contact us</p>
          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="select-all text-base font-medium">{STORE_PHONE.display}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Email</p>
              <a href={`mailto:${STORE_EMAIL}`} className="break-all text-base font-medium text-sky-900 hover:underline">
                {STORE_EMAIL}
              </a>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Open 8:00 AM – 9:00 PM</p>
        </div>
      ) : null}
    </div>
  )
}
