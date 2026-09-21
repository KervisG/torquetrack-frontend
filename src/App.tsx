import { Button } from '@/components/ui/button'

function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
      <h1 className="text-2xl font-semibold">TorqueTrack Diesel</h1>
      <p className="text-muted-foreground">
        Phase 1 scaffold: Vite + React + TypeScript, Tailwind CSS, and shadcn/ui are wired in.
      </p>
      <Button>Scaffold ready</Button>
    </main>
  )
}

export default App
