export type Product = {
  id: string
  // URL legible para la ficha; el backend acepta slug o id en el detalle.
  slug?: string
  title?: string
  category?: string
  type?: string
  make?: string
  model?: string
  yearFrom?: number
  yearTo?: number
  engine?: string
  engineFamily?: string
  engineCode?: string
  fitment?: string
  manufacturer?: string
  condition?: string
  fuelType?: string
  partNumber?: string
  oemPart?: string
  aftermarketPart?: string
  remanPart?: string
  // Ids de `/api/applications/` que el catálogo marcó como compatibles. No
  // todos los productos los traen; sin ellos el fitment se deduce del texto.
  applicationIds?: string[]
  description?: string
  warranty?: string
  stock?: string
  supplier?: string
  price?: number
  compareAt?: number
  coreCharge?: number
  image?: string
  shippingWeight?: number
  packageLength?: number
  packageWidth?: number
  packageHeight?: number
  lengthIn?: number
  widthIn?: number
  heightIn?: number
  weightOz?: number
}

export type VinVehicle = {
  vin: string
  year: string
  make: string
  model: string
  engine: string
}

// Vehículo para filtrar por fitment: el de un VIN, o el elegido por año,
// marca, modelo y motor (ese trae el id de la aplicación y `vin` vacío).
export type FitVehicle = VinVehicle & { applicationId?: string }

export type ShippingRate = {
  id?: string
  // Shipment de EasyPost que cotizó la tarifa; el checkout lo necesita para
  // que el backend verifique el monto.
  shipmentId?: string
  carrier?: string
  service?: string
  rate: number
  deliveryDays?: number | null
  guaranteed?: boolean
}
