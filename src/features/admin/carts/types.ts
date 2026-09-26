export type AdminCartItem = {
  id: string
  title: string
  partNumber: string
  quantity: number
}

export type AdminCart = {
  id: string
  status: string
  stage: string
  updatedAt: Date
  items: AdminCartItem[]
  email: string
}
