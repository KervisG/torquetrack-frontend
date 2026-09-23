// Una URL directa sin permiso muestra el motivo en lugar de una página vacía;
// la página no habilita sus queries, así que no llega a llamar a la API.
export function PermissionNotice({ title, message }: { title: string; message: string }) {
  return (
    <section>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{message}</p>
    </section>
  )
}
