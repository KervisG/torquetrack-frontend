import { useEffect, useRef } from 'react'

// Clip corto de Mixkit (licencia libre): camioneta de espaldas en una
// carretera de montaña. La toma no muestra al conductor.
const HERO_VIDEO = '/videos/home-truck.mp4'
const HERO_POSTER = '/videos/home-truck-poster.jpg'

export function HomeHero() {
  const videoRef = useRef<HTMLVideoElement>(null)

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
    <section className="relative isolate -mt-16 min-h-[calc(70vh+4rem)] overflow-hidden bg-neutral-950 text-white">
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
      <div className="relative mx-auto flex min-h-[calc(70vh+4rem)] max-w-6xl flex-col justify-end px-4 pb-12 pt-28">
        <h1 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Find it. Price it.
          <br />
          Ship it fast.
        </h1>
        <p className="mt-4 max-w-lg text-lg text-white/85">
          Diesel parts for the trucks that work.
        </p>
      </div>
    </section>
  )
}
