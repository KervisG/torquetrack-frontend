import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'

import type { FitVehicle } from '@/features/storefront/catalog/types'

// `source` dice cómo se eligió: solo un vehículo de VIN puede prellenar el
// paso de VIN del checkout. `engineLabel` es el texto para mostrar; `engine`
// queda en litros ("6.7") porque así lo compara el fitment.
export type SavedVehicle = FitVehicle & {
  source: 'vin' | 'selector'
  engineLabel?: string
}

type VehicleState = {
  vehicle: SavedVehicle | null
  selectorOpen: boolean
  setVehicle: (vehicle: SavedVehicle) => void
  clearVehicle: () => void
  setSelectorOpen: (open: boolean) => void
}

// En una ventana privada o con el almacenamiento bloqueado `localStorage`
// lanza: el vehículo se pierde al recargar, pero la tienda sigue andando.
const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return window.localStorage.getItem(name)
    } catch {
      return null
    }
  },
  setItem: (name, value) => {
    try {
      window.localStorage.setItem(name, value)
    } catch {
      // Sin almacenamiento el vehículo vive solo en memoria.
    }
  },
  removeItem: (name) => {
    try {
      window.localStorage.removeItem(name)
    } catch {
      // Igual que arriba: no hay nada que borrar.
    }
  },
}

function isSavedVehicle(value: unknown): value is SavedVehicle {
  if (!value || typeof value !== 'object') return false
  const vehicle = value as Partial<SavedVehicle>
  return (
    (vehicle.source === 'vin' || vehicle.source === 'selector') &&
    typeof vehicle.year === 'string' &&
    typeof vehicle.make === 'string' &&
    typeof vehicle.model === 'string'
  )
}

export function describeVehicle(vehicle: SavedVehicle): string {
  const engine = vehicle.engineLabel || vehicle.engine
  return [vehicle.year, vehicle.make, vehicle.model, engine].filter(Boolean).join(' ')
}

export const useVehicleStore = create<VehicleState>()(
  persist(
    (set) => ({
      vehicle: null,
      selectorOpen: false,
      setVehicle: (vehicle) => set({ vehicle, selectorOpen: false }),
      clearVehicle: () => set({ vehicle: null }),
      setSelectorOpen: (open) => set({ selectorOpen: open }),
    }),
    {
      name: 'tt-vehicle',
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({ vehicle: state.vehicle }),
      // Un valor guardado a mano o por una versión anterior se descarta.
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<VehicleState>
        return { ...current, vehicle: isSavedVehicle(saved.vehicle) ? saved.vehicle : null }
      },
    },
  ),
)
