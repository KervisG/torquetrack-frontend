import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const tones = {
  primary: '',
  outline: '',
  selected: 'border-foreground bg-secondary',
  link: '',
  danger: 'text-destructive',
} as const

type StorefrontButtonProps = ButtonProps & {
  tone?: keyof typeof tones
}

export function StorefrontButton({
  tone = 'primary',
  className,
  variant,
  ...props
}: StorefrontButtonProps) {
  const resolvedVariant =
    variant ??
    (tone === 'outline' || tone === 'selected'
      ? 'outline'
      : tone === 'link' || tone === 'danger'
        ? 'link'
        : 'default')

  return <Button variant={resolvedVariant} className={cn(tones[tone], className)} {...props} />
}
