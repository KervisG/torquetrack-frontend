import { http, HttpResponse } from 'msw'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { authenticatedSession, customerUser } from '@/test/admin-handlers'
import { accountOk, sampleProfile } from '@/test/account-handlers'
import { productsOk } from '@/test/catalog-handlers'
import { server } from '@/test/msw-server'
import { renderApp } from '@/test/render-app'

async function fillTaxForm(file?: File) {
  // `applyAccept: false` deja subir un tipo inválido para probar el mensaje.
  const user = userEvent.setup({ applyAccept: false })
  await user.type(await screen.findByLabelText('Tax ID / EIN'), '12-3456789')
  const state = screen.getByLabelText('Tax state')
  await user.clear(state)
  await user.type(state, 'fl')
  if (file) {
    await user.upload(screen.getByLabelText('Exemption certificate (optional)'), file)
  }
  await user.click(screen.getByRole('button', { name: 'Submit for review' }))
}

describe('TaxExemptionForm', () => {
  it('uploads the certificate as a base64 data URL and shows the new status', async () => {
    let sent: Record<string, string> | undefined
    let status = 'NOT SUBMITTED'
    server.use(
      authenticatedSession(customerUser),
      productsOk(),
      http.get('/api/account/', () =>
        HttpResponse.json({ customer: { ...sampleProfile, taxStatus: status } }),
      ),
      http.post('/api/account/tax-exemption/', async ({ request }) => {
        sent = (await request.json()) as Record<string, string>
        status = 'PENDING VERIFICATION'
        return HttpResponse.json({
          ok: true,
          status: 'PENDING VERIFICATION',
          submittedAt: '2026-09-23T10:00:00Z',
        })
      }),
    )
    renderApp('/account?tab=tax-exemption')

    await fillTaxForm(new File(['%PDF-1.4'], 'cert.pdf', { type: 'application/pdf' }))

    expect(await screen.findByText('Submitted for review.')).toBeInTheDocument()
    expect(await screen.findByText('PENDING VERIFICATION')).toBeInTheDocument()
    expect(sent).toMatchObject({
      company: 'Fleet LLC',
      taxId: '12-3456789',
      taxState: 'FL',
      certificateName: 'cert.pdf',
      certificateData: `data:application/pdf;base64,${btoa('%PDF-1.4')}`,
    })
  })

  it('rejects a file type the backend does not accept', async () => {
    server.use(
      authenticatedSession(customerUser),
      productsOk(),
      accountOk(),
      http.post('/api/account/tax-exemption/', () => {
        throw new Error('must not submit')
      }),
    )
    renderApp('/account?tab=tax-exemption')

    await fillTaxForm(new File(['hello'], 'notes.txt', { type: 'text/plain' }))

    expect(
      await screen.findByText('Certificate must be a PDF, PNG or JPEG file'),
    ).toBeInTheDocument()
  })

  it('rejects a certificate over the size limit', async () => {
    server.use(authenticatedSession(customerUser), productsOk(), accountOk())
    renderApp('/account?tab=tax-exemption')

    const big = new File([new Uint8Array(1_500_001)], 'big.pdf', { type: 'application/pdf' })
    await fillTaxForm(big)

    expect(await screen.findByText('Certificate must be 1.5 MB or smaller')).toBeInTheDocument()
  })

  it('shows the backend error', async () => {
    server.use(
      authenticatedSession(customerUser),
      productsOk(),
      accountOk(),
      http.post('/api/account/tax-exemption/', () =>
        HttpResponse.json({ error: 'Certificate file is too large' }, { status: 413 }),
      ),
    )
    renderApp('/account?tab=tax-exemption')

    await fillTaxForm()

    expect(await screen.findByText('Certificate file is too large')).toBeInTheDocument()
  })
})
