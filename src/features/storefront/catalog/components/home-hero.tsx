import { useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { VinForm } from '@/features/storefront/vin/components/vin-form'
import { describeVehicle, useVehicleStore } from '@/stores/vehicle-store'

import { SHOP_PATH } from '../product-path'

// Clip de Pexels (video 7568439, licencia libre): manos armando piezas de
// motor en un banco de taller. Reescalado a 1080p y sin audio.
const HERO_VIDEO = '/videos/home-engine.mp4'
const HERO_POSTER = '/videos/home-engine-poster.jpg'

export function HomeHero() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const navigate = useNavigate()
  const vehicle = useVehicleStore((state) => state.vehicle)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // autoPlay del elemento arranca el clip; aquí solo se frena si el
    // visitante pidió menos movimiento. play() en jsdom no devuelve promesa.
    if (reduceMotion) video.pause()
  }, [])

  return (
    // El header mide h-16 y es sticky. El margen negativo mete el video
    // debajo de esa barra para que la toma llegue al borde de la ventana.
    // En el teléfono el hero se ajusta a su contenido para que el resto de la
    // portada aparezca pronto; desde md recupera la toma alta.
    <section className="relative isolate -mt-16 overflow-hidden bg-neutral-950 text-white md:min-h-[calc(70vh+4rem)]">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        poster={HERO_POSTER}
        aria-hidden="true"
      >
        <source src={HERO_VIDEO} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/55" />
      <div className="relative mx-auto flex max-w-6xl flex-col justify-end px-4 pb-6 pt-24 md:min-h-[calc(70vh+4rem)] md:pb-12 md:pt-28">
        <h1 className="max-w-xl text-3xl font-semibold tracking-tight sm:text-5xl">
          Find it. Price it.
          <br />
          Ship it fast.
        </h1>
        <p className="mt-2 max-w-lg text-base text-white/85 md:mt-4 md:text-lg">
          Diesel parts for the trucks that work.
        </p>
        {/* La búsqueda por VIN es la acción principal: guarda el vehículo y
            abre el catálogo, que muestra solo lo que le va. */}
        <div className="mt-4 max-w-lg md:mt-6">
          <VinForm
            id="hero-vin"
            label="Shop by VIN"
            submitLabel="Find parts"
            layout="inline"
            initialVin={vehicle?.vin ?? ''}
            labelClassName="text-white"
            errorClassName="font-medium text-red-300"
            onDecoded={() => navigate(SHOP_PATH)}
          />
          {vehicle ? (
            <p role="status" className="mt-2 text-sm text-white/85">
              Saved vehicle: {describeVehicle(vehicle)}
            </p>
          ) : null}
          <Link
            to={SHOP_PATH}
            className="mt-3 inline-block text-sm font-medium text-amber-400 underline-offset-4 hover:underline"
          >
            Or browse all parts →
          </Link>
        </div>
      </div>
    </section>
  )
}
