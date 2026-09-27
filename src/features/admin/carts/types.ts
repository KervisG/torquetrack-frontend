export type AdminCartItem = {
  id: string
  title: string
  partNumber: string
  quantity: number
  // Referencia guardada al agregar el producto. No es el precio que se cobra.
  priceAtAdd?: number
}

export type AdminCart = {
  id: string
  status: string
  stage: string
  updatedAt: Date
  items: AdminCartItem[]
  email: string
}
