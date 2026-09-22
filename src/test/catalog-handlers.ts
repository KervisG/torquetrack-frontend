import { http, HttpResponse } from 'msw'

export const sampleProduct = {
  id: 'gm-65-injection-pump',
  title: '6.5L Turbo Diesel Fuel Injection Pump',
  category: 'HPFP',
  type: 'Pump',
  make: 'Chevrolet / GMC',
  model: 'C/K 2500 / 3500',
  yearFrom: 1994,
  yearTo: 2000,
  engine: '6.5',
  fitment: '1994-2000 Chevrolet / GMC 6.5L',
  manufacturer: 'Dorman',
  partNumber: '502-550',
  oemPart: '12561204',
  price: 189.99,
  coreCharge: 25,
  image: '/images/products/pump.png',
}

export function productsOk() {
  return http.get('/api/products/', () => HttpResponse.json([sampleProduct]))
}
