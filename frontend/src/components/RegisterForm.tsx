import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  hashPassword,
  readAccount,
  saveAccount,
  startSession,
} from '../lib/account'
import InputCustom from './InputCustom'
import { Button } from './ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'

export default function RegisterForm({ onLogin }: { onLogin: () => void }) {
  const [busy, setBusy] = useState(false)
  const submitting = useRef(false)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current) return
    const data = new FormData(event.currentTarget)
    const name = String(data.get('name') ?? '').trim()
    const email = String(data.get('email') ?? '')
      .trim()
      .toLowerCase()
    const password = String(data.get('password') ?? '')
    setMessage('')
    if (!name) return setMessage('El nombre completo es obligatorio.')
    if (password !== data.get('confirmation'))
      return setMessage('La confirmación de contraseña no coincide.')
    submitting.current = true
    setBusy(true)
    try {
      if (readAccount())
        throw new Error(
          'Ya existe un usuario en este navegador. Usa Iniciar sesión.',
        )
      const salt = crypto.randomUUID()
      const saved = {
        id: crypto.randomUUID(),
        name,
        email,
        salt,
        passwordHash: await hashPassword(password, salt),
        balance: 0,
      }
      saveAccount(saved)
      startSession(saved)
      await navigate({ to: '/dashboard', replace: true })
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'No se pudo crear la cuenta.',
      )
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }

  return (
    <section>
      <Card>
        <CardHeader>
          <CardTitle>Crear cuenta</CardTitle>
          <CardDescription>
            Cuenta de demostración guardada únicamente en este navegador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={authenticate}>
            <fieldset disabled={busy} className="grid gap-4">
              <InputCustom label="Nombre completo" name="name" />
              <InputCustom
                label="Correo electrónico"
                name="email"
                type="email"
              />
              <InputCustom
                label="Contraseña"
                name="password"
                type="password"
                minLength={8}
                autoComplete="new-password"
              />
              <InputCustom
                label="Confirmar contraseña"
                name="confirmation"
                type="password"
                minLength={8}
                autoComplete="new-password"
              />
              <p>La contraseña debe tener al menos 8 caracteres.</p>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={busy}>
                  {busy ? 'Espera…' : 'Registrarme'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={onLogin}
                >
                  Ya tengo cuenta
                </Button>
              </div>
            </fieldset>
          </form>
          {message && (
            <p className="error" role="alert">
              {message}
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
