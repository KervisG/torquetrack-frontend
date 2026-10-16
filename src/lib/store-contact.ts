// Único lugar con el contacto de la tienda: el footer, el header, la portada
// y las políticas lo leen de aquí. El negocio tiene un solo buzón.
// El teléfono se muestra solo como texto: no hay enlace `tel:` para no iniciar
// llamadas desde la web; el cliente decide cómo contactar.
export const STORE_PHONE = {
  display: '(786) 269-7237',
}

// Mismo número que el teléfono; wa.me exige el número sin "+" ni separadores.
export const STORE_WHATSAPP = {
  display: '+1 (786) 269-7237',
  href: 'https://wa.me/17862697237',
}

export const STORE_EMAIL = 'torquetrackllc@gmail.com'
