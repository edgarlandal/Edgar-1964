import { useRef, useState } from 'react'
import type { FormEvent } from 'react'

import { hashPassword, readAccount, startSession } from '../lib/account'

import { useNavigate } from '@tanstack/react-router'

import InputCustom from './InputCustom'
import { Button } from './ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from './ui/card'

export default function LoginForm({ onRegister }: { onRegister: () => void }) {
    const [busy, setBusy] = useState(false)
    const submitting = useRef(false)
    const [message, setMessage] = useState('')

    const navigate = useNavigate()

    async function authenticate(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (submitting.current) return
        const data = new FormData(event.currentTarget)
        const email = String(data.get('email') ?? '')
            .trim()
            .toLowerCase()
        const password = String(data.get('password') ?? '')
        setMessage('')
        submitting.current = true
        setBusy(true)
        try {
            const saved = readAccount()
            if (
                !saved ||
                saved.email !== email ||
                saved.passwordHash !== (await hashPassword(password, saved.salt))
            ) {
                throw new Error('El correo o la contraseña son incorrectos.')
            }
            startSession(saved)
            await navigate({ to: '/dashboard', replace: true })
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : 'No se pudo acceder a la cuenta.',
            )
        } finally {
            submitting.current = false
            setBusy(false)
        }
    }
    return (
        <section>
            <Card className=" shadow-sm">
                <CardHeader>
                    <CardTitle>Iniciar sesión</CardTitle>
                    <CardDescription>
                        Cuenta de demostración guardada únicamente en este navegador.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={authenticate} key="login">
                        <fieldset disabled={busy} className="grid gap-4">
                            <InputCustom
                                label={'Correo electrónico'}
                                name={'email'}
                                type="email"
                            />
                            <InputCustom
                                label={'Contraseña'}
                                name={'password'}
                                type="password"
                                minLength={8}
                            />

                            <p>La contraseña debe tener al menos 8 caracteres.</p>
                            <Button type="submit" disabled={busy}>
                                {busy ? 'Espera…' : 'Entrar'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={busy}
                                onClick={onRegister}
                            >
                                Crear cuenta
                            </Button>
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
