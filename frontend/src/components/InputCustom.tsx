import { Input } from '@/components/ui/input'
import type { ComponentProps } from 'react'
import { Label } from './ui/label'

export type PropsInutCustom = ComponentProps<'input'> & {
  label: string
  name: string
  error?: string
}

export default function InputCustom({
  label,
  name,
  id = name,
  type = 'text',
  required = type !== 'checkbox',
  autoComplete,
  error,
  'aria-describedby': describedBy,
  'aria-invalid': invalid,
  ...props
}: PropsInutCustom) {
  const errorId = `${id}-error`
  const inputProps = {
    ...props,
    id,
    name,
    type,
    required,
    autoComplete:
      autoComplete ??
      (name === 'confirmation'
        ? 'new-password'
        : name === 'password'
          ? 'current-password'
          : name),
    'aria-invalid': error ? true : invalid,
    'aria-describedby':
      [describedBy, error ? errorId : undefined].filter(Boolean).join(' ') ||
      undefined,
  }

  return (
    <div className="grid gap-2">
      {type === 'checkbox' ? (
        <div className="flex items-center gap-2">
          <input {...inputProps} />
          <Label htmlFor={id}>{label}</Label>
        </div>
      ) : (
        <>
          <Label htmlFor={id}>{label}</Label>
          <Input {...inputProps} />
        </>
      )}
      {error && (
        <span className="error" id={errorId}>
          {error}
        </span>
      )}
    </div>
  )
}
