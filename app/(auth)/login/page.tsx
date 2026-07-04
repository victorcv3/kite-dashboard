import { redirect } from 'next/navigation'
import LoginForm from './LoginForm'

export default function LoginPage() {
  if (process.env.SKIP_AUTH === 'true') {
    redirect('/dashboard')
  }

  return <LoginForm />
}
