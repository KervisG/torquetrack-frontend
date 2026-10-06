import { Truck } from 'lucide-react'

import { StorefrontButton } from '@/components/storefront-button'
import { describeVehicle, useVehicleStore } from '@/stores/vehicle-store'

// Acceso al vehículo guardado desde cualquier página de la tienda; el diálogo
// ofrece cambiarlo o borrarlo.
export function VehicleHeaderButton() {
  const vehicle = useVehicleStore((state) => state.vehicle)
  const setSelectorOpen = useVehicleStore((state) => state.setSelectorOpen)
  const label = vehicle ? describeVehicle(vehicle) : ''

  return (
    <StorefrontButton
      type="button"
      tone="outline"
      className="h-9 max-w-56 border-white/15 bg-white/10 px-3 text-white hover:bg-white/15 hover:text-white"
      aria-label={vehicle ? `My vehicle: ${label}. Change` : 'Select your vehicle'}
      onClick={() => setSelectorOpen(true)}
    >
      <Truck className="size-4 shrink-0" />
      <span className="truncate max-md:sr-only">{vehicle ? label : 'My vehicle'}</span>
    </StorefrontButton>
  )
}
