'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslations } from 'next-intl'

export default function LoginPage() {
  const t = useTranslations('Auth')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  /** @surfaice action: POST /user/login, fields: [email, password], returns: access_token */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <form id="login-form" onSubmit={handleSubmit}>
        <label htmlFor="email">{t('email')}</label>
        <input
          id="email"
          type="email"
          value={email}
          required
        />

        <label htmlFor="password">{t('password')}</label>
        <input
          id="password"
          type="password"
          value={password}
          required
        />

        <button type="submit" id="submit" disabled={loading}>
          {loading ? t('signingIn') : t('signIn')}
        </button>
      </form>

      <Link href="/register" id="register-link">{t('signUp')}</Link>
    </div>
  )
}
