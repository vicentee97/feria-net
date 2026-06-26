/**
 * App.tsx — FeriaNet
 *
 * Placeholder minimo para la epica 1. La UI real de ferias y
 * atracciones se implementa en TEAMS posteriores por @implementador.
 *
 * Este componente verifica que:
 *  - Vite sirve el modulo correctamente.
 *  - Tailwind v4 + shadcn/ui estan cargados (clases `p-8`, `text-2xl`).
 *  - La ventana Tauri monta el frontend.
 */

function App() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="space-y-2 p-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">FeriaNet</h1>
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    </div>
  );
}

export default App;
