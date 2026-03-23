'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

export default function LoginPage() {
  const t = useTranslations('auth')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  /** @surfaice action: POST /user/login, fields: [email, password], returns: access_token */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
  }

  return (
    <div>
      <form id="login-form" onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={email} required />

        <label htmlFor="password">Password</label>
        <input id="password" type="password" value={password} required />

        <button type="submit" disabled={loading}>
          {loading ? t('signingIn') : t('signIn')}
        </button>
      </form>
    </div>
  )
}
