export type Product = {
  id: string
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
