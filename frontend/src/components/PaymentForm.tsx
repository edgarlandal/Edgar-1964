import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { applyApprovedPayment } from '../lib/account'
import type { Account } from '../lib/account'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card'
import InputCustom from './InputCustom'
import { Button } from './ui/button'

type Field =
  | 'card_number'
  | 'expiration_date'
  | 'cvv'
  | 'cardholder_name'
  | 'transaction_amount'
const fields: Array<{ name: Field; label: string; placeholder: string }> = [
  {
    name: 'card_number',
    label: 'Número de tarjeta ficticia',
    placeholder: '1234123412341234',
  },
  {
    name: 'expiration_date',
    label: 'Vencimiento (MM/AA)',
    placeholder: '12/26',
  },
  { name: 'cvv', label: 'CVV ficticio', placeholder: '543' },
  {
    name: 'cardholder_name',
    label: 'Nombre completo del titular',
    placeholder: 'Usuario de prueba',
  },
  {
    name: 'transaction_amount',
    label: 'Monto de la recarga',
    placeholder: '100',
  },
]

export default function PaymentForm({
  account,
  onChange,
}: {
  account: Account
  onChange: (account: Account) => void
}) {
  const [busy, setBusy] = useState(false)
  const sending = useRef(false)
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [approved, setApproved] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sending.current) return
    const form = new FormData(event.currentTarget)
    const amountText = String(form.get('transaction_amount') ?? '')
    const amount = Number(amountText)
    if (
      Number.isFinite(amount) &&
      amount > 0 &&
      Math.abs(amount * 100 - Math.round(amount * 100)) > 0.000001
    ) {
      setApproved(false)
      setErrors({
        transaction_amount: 'El monto debe tener como máximo 2 decimales.',
      })
      setMessage('Revisa el monto de la recarga.')
      return
    }
    const body = {
      card_number: form.get('card_number'),
      expiration_date: form.get('expiration_date'),
      cvv: form.get('cvv'),
      cardholder_name: form.get('cardholder_name'),
      transaction_amount: amountText.trim() ? amount : null,
      payer_id: account.id,
      payer_email: account.email,
    }
    sending.current = true
    setBusy(true)
    setMessage('')
    setErrors({})
    setApproved(false)
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 10000)
    try {
      const response = await fetch(
        '/api/snailpay/payments' +
          (form.has('simulate_error') ? '?simulate_error=true' : ''),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        },
      )
      const result = await response.json()
      if (
        !result ||
        typeof result.status_detail !== 'string' ||
        !Array.isArray(result.errors)
      ) {
        throw new Error(
          'La API devolvió una respuesta no válida. El saldo no cambió.',
        )
      }
      const fieldErrors: Record<string, string> = {}
      for (const error of result.errors) {
        if (
          typeof error.field === 'string' &&
          typeof error.message === 'string'
        ) {
          fieldErrors[error.field] = error.message
        }
      }
      setErrors(fieldErrors)
      if (!response.ok || result.status !== 'approved') {
        setMessage(result.status_detail)
        return
      }
      // Solo una aprobación completa permite sumar saldo; errores y timeout nunca lo modifican.
      if (
        !Number.isFinite(amount) ||
        amount <= 0 ||
        result.transaction_amount !== amount ||
        result.payer_id !== account.id ||
        result.payer_email !== account.email ||
        typeof result.id !== 'string' ||
        !result.id ||
        typeof result.authorization_code !== 'string' ||
        !result.authorization_code ||
        result.card_number !== body.card_number ||
        result.cvv !== body.cvv
      ) {
        throw new Error(
          'La aprobación no coincide con la recarga solicitada. El saldo no cambió.',
        )
      }
      const updated = applyApprovedPayment(account, result)
      onChange(updated)
      setApproved(true)
      setMessage(result.status_detail)
    } catch (error) {
      setMessage(
        controller.signal.aborted
          ? 'SnailPay tardó demasiado. El saldo no cambió.'
          : error instanceof TypeError
            ? 'No se pudo conectar con SnailPay. Comprueba que el backend esté iniciado. El saldo no cambió.'
            : error instanceof Error
              ? error.message
              : 'No se pudo procesar la recarga.',
      )
    } finally {
      window.clearTimeout(timeout)
      sending.current = false
      setBusy(false)
    }
  }

  return (
    <Card className="w-full min-w-0">
      <CardHeader>
        <CardTitle>Cargar saldo con SnailPay</CardTitle>

        <CardDescription>
          <p>
            Solo datos ficticios. Tarjeta aprobada:{' '}
            <code>1234123412341234</code>, vencimiento <code>12/26</code>, CVV{' '}
            <code>543</code>.
          </p>
          <p>
            Para probar un rechazo, usa CVV <code>000</code>.
          </p>
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={submit} noValidate>
          <fieldset disabled={busy} className="grid gap-4">
            {fields.map((field) => (
              <InputCustom
                key={field.name}
                label={field.label}
                id={field.name}
                name={field.name}
                type={field.name === 'transaction_amount' ? 'number' : 'text'}
                step={field.name === 'transaction_amount' ? '0.01' : undefined}
                inputMode={
                  field.name === 'card_number' || field.name === 'cvv'
                    ? 'numeric'
                    : undefined
                }
                placeholder={field.placeholder}
                defaultValue={
                  field.name === 'cardholder_name' ? account.name : ''
                }
                autoComplete="off"
                error={errors[field.name]}
              />
            ))}
            <InputCustom
              type="checkbox"
              name="simulate_error"
              label="Simular caída de SnailPay"
            />
            <Button type="submit" disabled={busy}>
              {busy ? 'Procesando…' : 'Recargar saldo'}
            </Button>
          </fieldset>
        </form>
      </CardContent>

      <CardFooter>
        {message && (
          <p
            role={approved ? 'status' : 'alert'}
            className={approved ? 'success' : 'error'}
          >
            {message}
          </p>
        )}
      </CardFooter>
    </Card>
  )
}
