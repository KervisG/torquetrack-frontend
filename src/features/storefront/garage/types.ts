// Una fila de `/api/applications/`: un rango de años de una marca con un motor
// y los modelos que lo montan. El catálogo la referencia en `applicationIds`.
export type VehicleApplication = {
  id: string
  make: string
  models: string[]
  yearFrom: number
  yearTo: number
  engine: string
  engineFamily?: string
  engineCode?: string
}
