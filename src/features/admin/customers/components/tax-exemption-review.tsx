import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { FormError } from '@/components/form-error'
import { SelectField } from '@/components/select-field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/format-date'

import { getTaxExemption, updateTaxStatus } from '../api'
import { adminCustomerKeys } from '../query-keys'
import { TAX_STATUSES } from '../types'
import { CertificateLinks } from './certificate-links'

const STATUS_OPTIONS = TAX_STATUSES.map((status) => ({ value: status, label: status }))

export function TaxExemptionReview({ customerId }: { customerId: string }) {
  const queryClient = useQueryClient()
  const exemption = useQuery({
    queryKey: adminCustomerKeys.taxExemption(customerId),
    queryFn: () => getTaxExemption(customerId),
  })
  const [status, setStatus] = useState<string | null>(null)
  const update = useMutation({
    mutationFn: (next: string) => updateTaxStatus(customerId, next),
    onSuccess: async () => {
      setStatus(null)
      // El estado fiscal aparece en el listado y en esta revisión.
      await queryClient.invalidateQueries({ queryKey: adminCustomerKeys.all })
    },
  })

  if (exemption.isPending) {
    return <p className="text-sm text-muted-foreground">Loading tax exemption…</p>
  }
  if (exemption.error) {
    return <FormError error={exemption.error} />
  }

  const { tax } = exemption.data
  const selected = status ?? exemption.data.status

  const submitted = Boolean(
    tax.taxId || tax.company || tax.taxState || tax.taxExemptionType || tax.submittedAt,
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Current status</span>
        <Badge variant="outline">{exemption.data.status}</Badge>
      </div>
      {submitted ? (
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <Detail label="Company" value={tax.company} />
          <Detail label="Tax ID / EIN" value={tax.taxId} />
          <Detail label="State" value={tax.taxState} />
          <Detail label="Exemption type" value={tax.taxExemptionType} />
          <Detail label="Submitted" value={tax.submittedAt ? formatDate(tax.submittedAt) : ''} />
          <Detail label="Reviewed" value={tax.reviewedAt ? formatDate(tax.reviewedAt) : ''} />
          <Detail label="Reviewed by" value={tax.reviewedBy ?? ''} />
        </dl>
      ) : (
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          The customer has not submitted a tax exemption yet.
        </p>
      )}
      {tax.certificateData ? (
        <CertificateLinks name={tax.certificateName} dataUrl={tax.certificateData} />
      ) : submitted ? (
        <p className="text-sm text-muted-foreground">No certificate uploaded.</p>
      ) : null}
      <form
        className="flex flex-wrap items-end gap-3 border-t pt-4"
        onSubmit={(event) => {
          event.preventDefault()
          update.mutate(selected)
        }}
      >
        <div className="min-w-56">
          <SelectField
            id={`tax-status-${customerId}`}
            label="New tax status"
            options={STATUS_OPTIONS}
            value={selected}
            onChange={(event) => setStatus(event.target.value)}
          />
        </div>
        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? 'Saving…' : 'Update tax status'}
        </Button>
      </form>
      <FormError error={update.error} />
      {update.isSuccess ? (
        <p className="text-sm text-muted-foreground">Tax status updated.</p>
      ) : null}
    </div>
  )
}

// Solo se muestran los datos cargados: un campo vacío no ocupa espacio.
function Detail({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="break-words font-medium">{value}</dd>
    </div>
  )
}
