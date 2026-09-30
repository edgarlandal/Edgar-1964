import { createFileRoute, useNavigate } from '@tanstack/react-router'
import LoginForm from '#/components/LoginForm'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const navigate = useNavigate()
  return (
    <main className="flex w-full justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        <LoginForm
          onRegister={() => {
            void navigate({ to: '/register' })
          }}
        />
      </div>
    </main>
  )
}
