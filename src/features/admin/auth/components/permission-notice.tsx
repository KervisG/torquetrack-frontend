import { PageHeader } from '@/components/app-shell/page-header'
import { Card, CardContent } from '@/components/ui/card'

// Una URL directa sin permiso muestra el motivo en lugar de una página vacía;
// la página no habilita sus queries, así que no llega a llamar a la API.
export function PermissionNotice({ title, message }: { title: string; message: string }) {
  return (
    <section>
      <PageHeader title={title} />
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    </section>
  )
}
