import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { endSession, hasSession, readAccount } from '../lib/account'
import PaymentForm from '../components/PaymentForm'
import type { Account } from '../lib/account'
import BarsSnails from '#/components/BarsSnail'
import { Button } from '../components/ui/button'

export const Route = createFileRoute('/dashboard')({
  component: RouteComponent,
})

function RouteComponent() {
  const [account, setAccount] = useState<Account | null>(null)
  const [message, setMessage] = useState('')
  const [ready, setReady] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    function restore() {
      try {
        const saved = readAccount()
        setAccount(saved && hasSession(saved) ? saved : null)
        setMessage('')
      } catch {
        setAccount(null)
        setMessage(
          'No se pudieron leer los datos locales. Comprueba que el navegador permita LocalStorage.',
        )
      } finally {
        setReady(true)
      }
    }
    restore()
    window.addEventListener('storage', restore)
    return () => window.removeEventListener('storage', restore)
  }, [])

  async function logout() {
    try {
      endSession()
      setAccount(null)
      setMessage('')

      await navigate({ to: '/' })
    } catch {
      setMessage(
        'No se pudo cerrar la sesión local. Revisa los permisos del navegador.',
      )
    }
  }

  if (!ready)
    return (
      <main className="p-4">
        <p role="status">Cargando sesión…</p>
      </main>
    )
  if (!account)
    return (
      <main>
        <p>{message || 'Inicia sesión para acceder al dashboard.'}</p>
        <Link to="/">Ir a iniciar sesión</Link>
      </main>
    )

  return (
    <main className="w-full space-y-4 p-4 sm:p-6">
      <section className="w-full rounded-lg border border-border p-4 shadow-sm">
        <h2>Hola, {account.name}</h2>
        <p className="break-all">{account.email}</p>
        <p>
          <strong>
            Saldo:{' '}
            {account.balance.toLocaleString('es-MX', {
              style: 'currency',
              currency: 'MXN',
            })}
          </strong>
        </p>
        <Button variant="outline" className="mt-3" onClick={logout}>
          Cerrar sesión
        </Button>
        {message && (
          <p role="alert" className="error">
            {message}
          </p>
        )}
      </section>

      <section className="grid w-full grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <PaymentForm account={account} onChange={setAccount} />
        <BarsSnails />
      </section>
    </main>
  )
}
