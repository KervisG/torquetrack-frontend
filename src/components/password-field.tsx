import { Eye, EyeOff } from 'lucide-react'
import { forwardRef, useState, type ComponentProps } from 'react'

import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'

type PasswordFieldProps = Omit<ComponentProps<typeof FormField>, 'type' | 'trailing'>

// Campo de contraseña con un ojo que alterna mostrar/ocultar; queda activo hasta volver a pulsarlo.
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(function PasswordField(props, ref) {
  const [visible, setVisible] = useState(false)

  return (
    <FormField
      ref={ref}
      {...props}
      type={visible ? 'text' : 'password'}
      trailing={
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      }
    />
  )
})
