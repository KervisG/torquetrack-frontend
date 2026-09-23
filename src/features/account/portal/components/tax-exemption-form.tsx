import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'

import { FormError } from '@/components/form-error'
import { FormField } from '@/components/form-field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CERTIFICATE_MIME_TYPES,
  taxExemptionSchema,
  type TaxExemptionInput,
  type TaxExemptionValues,
} from '@/lib/validators/tax-exemption'

import { submitTaxExemption } from '../api'
import { accountKeys } from '../query-keys'
import type { AccountProfile } from '../types'

// El backend guarda el certificado como data URL (`data:<mime>;base64,...`)
// dentro del JSON, así que el archivo viaja en el mismo body.
function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the file'))
    reader.readAsDataURL(file)
  })
}

async function toPayload({ certificate, ...values }: TaxExemptionValues) {
  return submitTaxExemption({
    ...values,
    taxState: values.taxState.toUpperCase(),
    certificateName: certificate?.name ?? '',
    certificateData: certificate ? await readAsDataUrl(certificate) : '',
  })
}

export function TaxExemptionForm({ profile }: { profile: AccountProfile }) {
  const queryClient = useQueryClient()
  const form = useForm<TaxExemptionInput, unknown, TaxExemptionValues>({
    resolver: zodResolver(taxExemptionSchema),
    defaultValues: {
      company: profile.company,
      taxId: '',
      taxState: profile.state,
      taxExemptionType: '',
    },
  })
  const submit = useMutation({
    mutationFn: toPayload,
    onSuccess: async () => {
      form.reset({ ...form.getValues(), certificate: undefined })
      await queryClient.invalidateQueries({ queryKey: accountKeys.profile() })
    },
  })
  const errors = form.formState.errors

  return (
    <div className="space-y-4">
      <p className="flex items-center gap-2 text-sm">
        <span className="font-medium">Current status</span>
        <Badge variant="secondary">{profile.taxStatus}</Badge>
      </p>
      <form
        className="space-y-4"
        noValidate
        onSubmit={form.handleSubmit((values) => submit.mutate(values))}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="tax-company"
            label="Company name"
            error={errors.company?.message}
            {...form.register('company')}
          />
          <FormField
            id="tax-id"
            label="Tax ID / EIN"
            error={errors.taxId?.message}
            {...form.register('taxId')}
          />
          <FormField
            id="tax-state"
            label="Tax state"
            maxLength={2}
            error={errors.taxState?.message}
            {...form.register('taxState')}
          />
          <FormField
            id="tax-type"
            label="Exemption type (optional)"
            placeholder="Resale, fleet, government…"
            {...form.register('taxExemptionType')}
          />
        </div>
        <FormField
          id="tax-certificate"
          label="Exemption certificate (optional)"
          type="file"
          accept={CERTIFICATE_MIME_TYPES.join(',')}
          error={errors.certificate?.message}
          hint={<p className="text-xs text-muted-foreground">PDF, PNG or JPEG up to 1.5 MB.</p>}
          {...form.register('certificate')}
        />
        <FormError error={submit.error} />
        {submit.isSuccess ? (
          <p className="text-sm text-muted-foreground">Submitted for review.</p>
        ) : null}
        <Button type="submit" disabled={submit.isPending}>
          {submit.isPending ? 'Submitting…' : 'Submit for review'}
        </Button>
      </form>
    </div>
  )
}
