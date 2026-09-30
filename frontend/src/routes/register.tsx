import { createFileRoute, useNavigate } from '@tanstack/react-router'
import RegisterForm from '../components/RegisterForm'

export const Route = createFileRoute('/register')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  return (
    <main className="flex w-full justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        <RegisterForm
          onLogin={() => {
            void navigate({ to: '/' })
          }}
        />
      </div>
    </main>
  )
}
