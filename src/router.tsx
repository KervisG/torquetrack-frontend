import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { appRoutes } from '@/routes'

export function AppRouter() {
  return <RouterProvider router={createBrowserRouter(appRoutes)} />
}
