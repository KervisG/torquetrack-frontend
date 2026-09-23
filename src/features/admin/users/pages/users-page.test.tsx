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
  { id: 1, slug: 'admin', name: 'Admin', fullAccess: true },
  { id: 2, slug: 'sales', name: 'Sales', fullAccess: false },
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

// Backend en memoria: GET lista, POST agrega, PUT reemplaza, DELETE borra.
function usersBackend(initial: Row[]) {
  const users = [...initial]
  const calls: Array<{ method: string; id?: string; body?: unknown }> = []
  const handlers = [
    http.get('/api/admin/users/', () => HttpResponse.json(users)),
    http.get('/api/admin/roles/', () => HttpResponse.json(roles)),
    http.post('/api/admin/users/', async ({ request }) => {
      const body = (await request.json()) as Record<string, string>
      calls.push({ method: 'POST', body })
      const created = row({
        id: 'U_NEW',
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        name: `${body.firstName} ${body.lastName}`,
        isStaff: true,
        role: roles.find((role) => role.slug === body.role) ?? null,
      })
      users.push(created)
      return HttpResponse.json({ ok: true, user: created }, { status: 201 })
    }),
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

  it('creates a staff user with the selected role', async () => {
    const backend = usersBackend([customerRow])
    server.use(authenticatedSession(), ...backend.handlers)
    renderApp('/admin/users')

    const user = userEvent.setup()
    const form = within(await screen.findByRole('form', { name: 'Create user' }))
    await user.type(form.getByLabelText('Email'), 'new@example.com')
    await user.type(form.getByLabelText('Password'), 'diesel-pass-123')
    await user.type(form.getByLabelText('First name'), 'Nia')
    await user.type(form.getByLabelText('Last name'), 'New')
    await user.selectOptions(await form.findByLabelText('Role'), 'sales')
    await user.click(form.getByRole('button', { name: 'Create user' }))

    expect(await screen.findByText('new@example.com')).toBeInTheDocument()
    expect(backend.calls).toContainEqual({
      method: 'POST',
      body: {
        email: 'new@example.com',
        password: 'diesel-pass-123',
        firstName: 'Nia',
        lastName: 'New',
        role: 'sales',
      },
    })
  })

  it('requires a role before creating', async () => {
    const backend = usersBackend([])
    server.use(authenticatedSession(), ...backend.handlers)
    renderApp('/admin/users')

    const user = userEvent.setup()
    const form = within(await screen.findByRole('form', { name: 'Create user' }))
    await user.click(form.getByRole('button', { name: 'Create user' }))

    expect(await form.findByText('Select a role')).toBeInTheDocument()
    expect(backend.calls).toEqual([])
  })

  it('shows the 409 when the email is taken', async () => {
    const backend = usersBackend([])
    server.use(
      authenticatedSession(),
      http.post('/api/admin/users/', () =>
        HttpResponse.json({ error: 'Email already exists' }, { status: 409 }),
      ),
      ...backend.handlers,
    )
    renderApp('/admin/users')

    const user = userEvent.setup()
    const form = within(await screen.findByRole('form', { name: 'Create user' }))
    await user.type(form.getByLabelText('Email'), 'pat@example.com')
    await user.type(form.getByLabelText('Password'), 'diesel-pass-123')
    await user.type(form.getByLabelText('First name'), 'Pat')
    await user.type(form.getByLabelText('Last name'), 'Fleet')
    await user.selectOptions(await form.findByLabelText('Role'), 'sales')
    await user.click(form.getByRole('button', { name: 'Create user' }))

    expect(await form.findByText('Email already exists')).toBeInTheDocument()
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

  it('sends a new password only when one is typed', async () => {
    const backend = usersBackend([staffRow])
    server.use(authenticatedSession(), ...backend.handlers)
    renderApp('/admin/users')

    const user = userEvent.setup()
    await screen.findByText('sam@example.com')
    await user.click(within(rowFor('sam@example.com')).getByRole('button', { name: 'Edit' }))
    const form = within(await screen.findByRole('form', { name: 'Edit sam@example.com' }))
    await user.type(form.getByLabelText('New password (optional)'), 'fresh-pass-456')
    await user.click(form.getByRole('button', { name: 'Save changes' }))

    await screen.findByText('User updated.')
    expect(backend.calls).toContainEqual({
      method: 'PUT',
      id: 'U_SALES',
      body: { role: 'sales', active: true, password: 'fresh-pass-456' },
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
