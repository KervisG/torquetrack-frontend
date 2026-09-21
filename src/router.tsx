import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import App from './App'

// Minimal placeholder route proving React Router is wired in (Phase 1). Real
// feature routes land in Phase 8 (task 8.1) once the backend endpoints they
// call exist.
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
