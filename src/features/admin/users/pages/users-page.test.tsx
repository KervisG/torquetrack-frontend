import { http, HttpResponse } from 'msw'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { authenticatedSession, sessionUser, unauthorizedSession } from '@/test/admin-handlers'
import { server } from '@/test/msw-server'
import { renderApp } from '@/test/render-app'

type Row = {
  id: string
  email: string
  firstName: string
  lastName: string
  name: string
  active: boolean
  isStaff: boolean
  role: { slug: string; name: string; fullAccess: boolean } | null
  permissions: string[]
  createdAt: string
}

const roles = [
  { id: 1, slug: 'admin', name: 'Admin', fullAccess: true, permissions: ['users.manage'] },
  { id: 2, slug: 'sales', name: 'Sales', fullAccess: false, permissions: ['orders.view'] },
]

function row(overrides: Partial<Row>): Row {
  return {
    id: 'U1',
    email: 'u1@example.com',
    firstName: 'Una',
    lastName: 'User',
    name: 'Una User',
    active: true,
    isStaff: false,
    role: null,
    permissions: [],
    createdAt: '2026-09-01T00:00:00Z',
    ...overrides,
  }
}

// Backend en memoria: GET lista, PUT reemplaza, DELETE borra. El panel no
// crea cuentas, así que no hay POST.
function usersBackend(initial: Row[]) {
  const users = [...initial]
  const calls: Array<{ method: string; id?: string; body?: unknown }> = []
  const handlers = [
    http.get('/api/admin/users/', () => HttpResponse.json(users)),
    http.get('/api/admin/roles/', () => HttpResponse.json(roles)),
    http.put('/api/admin/users/:id/', async ({ params, request }) => {
      const body = (await request.json()) as { role?: string | null; active?: boolean }
      calls.push({ method: 'PUT', id: String(params.id), body })
      const index = users.findIndex((user) => user.id === params.id)
      users[index] = {
        ...users[index],
        active: body.active ?? users[index].active,
        role:
          body.role === undefined
            ? users[index].role
            : (roles.find((role) => role.slug === body.role) ?? null),
      }
      return HttpResponse.json({ ok: true, user: users[index] })
    }),
    http.delete('/api/admin/users/:id/', ({ params }) => {
      calls.push({ method: 'DELETE', id: String(params.id) })
      users.splice(
        users.findIndex((user) => user.id === params.id),
        1,
      )
      return HttpResponse.json({ ok: true })
    }),
  ]
  return { handlers, calls }
}

const staffRow = row({
  id: 'U_SALES',
  email: 'sam@example.com',
  firstName: 'Sam',
  lastName: 'Sales',
  name: 'Sam Sales',
  isStaff: true,
  role: { slug: 'sales', name: 'Sales', fullAccess: false },
})
const customerRow = row({
  id: 'U_PAT',
  email: 'pat@example.com',
  firstName: 'Pat',
  lastName: 'Fleet',
  name: 'Pat Fleet',
})

function rowFor(email: string) {
  return screen.getByText(email).closest('tr') as HTMLElement
}

describe('UsersPage', () => {
  it('sends an anonymous visitor to sign in', async () => {
    server.use(unauthorizedSession())
    renderApp('/admin/users')

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('blocks staff without users.manage and never calls the API', async () => {
    server.use(
      authenticatedSession({
        ...sessionUser,
        role: { slug: 'sales', name: 'Sales', fullAccess: false },
        permissions: ['dashboard.view'],
      }),
    )
    renderApp('/admin/users')

    expect(
      await screen.findByText('You do not have permission to manage users.'),
    ).toBeInTheDocument()
  })

  it('lists staff and customers', async () => {
    const backend = usersBackend([staffRow, customerRow])
    server.use(authenticatedSession(), ...backend.handlers)
    renderApp('/admin/users')

    expect(await screen.findByRole('heading', { name: 'Users' })).toBeInTheDocument()
    await screen.findByText('sam@example.com')
    expect(within(rowFor('sam@example.com')).getByText('Sales')).toBeInTheDocument()
    expect(within(rowFor('pat@example.com')).getByText('Customer')).toBeInTheDocument()
    expect(within(rowFor('pat@example.com')).getByText('Active')).toBeInTheDocument()
  })

  it('removes panel access and deactivates a user', async () => {
    const backend = usersBackend([staffRow])
    server.use(authenticatedSession(), ...backend.handlers)
    renderApp('/admin/users')

    const user = userEvent.setup()
    await screen.findByText('sam@example.com')
    await user.click(within(rowFor('sam@example.com')).getByRole('button', { name: 'Edit' }))
    const form = within(await screen.findByRole('form', { name: 'Edit sam@example.com' }))
    await user.selectOptions(await form.findByLabelText('Role'), '')
    await user.click(form.getByLabelText('Active'))
    await user.click(form.getByRole('button', { name: 'Save changes' }))

    expect(await within(rowFor('sam@example.com')).findByText('Inactive')).toBeInTheDocument()
    expect(within(rowFor('sam@example.com')).getByText('Customer')).toBeInTheDocument()
    expect(backend.calls).toContainEqual({
      method: 'PUT',
      id: 'U_SALES',
      body: { role: null, active: false },
    })
  })

  it('shows the 403 when granting full access is not allowed', async () => {
    const backend = usersBackend([staffRow])
    server.use(
      authenticatedSession(),
      http.put('/api/admin/users/:id/', () =>
        HttpResponse.json(
          { error: 'Only a full access user can grant full access' },
          { status: 403 },
        ),
      ),
      ...backend.handlers,
    )
    renderApp('/admin/users')

    const user = userEvent.setup()
    await screen.findByText('sam@example.com')
    await user.click(within(rowFor('sam@example.com')).getByRole('button', { name: 'Edit' }))
    const form = within(await screen.findByRole('form', { name: 'Edit sam@example.com' }))
    await user.selectOptions(await form.findByLabelText('Role'), 'admin')
    await user.click(form.getByRole('button', { name: 'Save changes' }))

    expect(
      await form.findByText('Only a full access user can grant full access'),
    ).toBeInTheDocument()
  })

  it('deletes a user only after confirmation', async () => {
    const backend = usersBackend([staffRow, customerRow])
    server.use(authenticatedSession(), ...backend.handlers)
    renderApp('/admin/users')

    const user = userEvent.setup()
    await screen.findByText('pat@example.com')
    await user.click(within(rowFor('pat@example.com')).getByRole('button', { name: 'Delete' }))
    expect(backend.calls).toEqual([])

    await user.click(within(rowFor('pat@example.com')).getByRole('button', { name: 'Cancel' }))
    await user.click(within(rowFor('pat@example.com')).getByRole('button', { name: 'Delete' }))
    await user.click(
      within(rowFor('pat@example.com')).getByRole('button', { name: 'Confirm delete' }),
    )

    await screen.findByText('sam@example.com')
    await expect.poll(() => screen.queryByText('pat@example.com')).toBeNull()
    expect(backend.calls).toEqual([{ method: 'DELETE', id: 'U_PAT' }])
  })

  it('shows the delete error', async () => {
    const backend = usersBackend([staffRow])
    server.use(
      authenticatedSession(),
      http.delete('/api/admin/users/:id/', () =>
        HttpResponse.json({ error: 'A full access account cannot be deleted' }, { status: 403 }),
      ),
      ...backend.handlers,
    )
    renderApp('/admin/users')

    const user = userEvent.setup()
    await screen.findByText('sam@example.com')
    await user.click(within(rowFor('sam@example.com')).getByRole('button', { name: 'Delete' }))
    await user.click(
      within(rowFor('sam@example.com')).getByRole('button', { name: 'Confirm delete' }),
    )

    expect(await screen.findByText('A full access account cannot be deleted')).toBeInTheDocument()
  })
})
