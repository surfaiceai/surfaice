'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslations } from 'next-intl'

export default function SettingsPage() {
  const t = useTranslations('Settings')
  const { user, loading } = useAuth()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  /** @surfaice action: PUT /api/profile, fields: [username, bio] */
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <div>
      <Link href="/dashboard" id="back-link">{t('back')}</Link>

      <form id="profile-form" onSubmit={handleUpdate}>
        <label htmlFor="email">{t('email')}</label>
        <input
          id="email"
          type="email"
          value={user?.email ?? ''}
          disabled
          readOnly
        />

        <label htmlFor="username">{t('username')}</label>
        <input
          id="username"
          type="text"
          value={username}
          required
        />

        <label htmlFor="bio">{t('bio')}</label>
        <textarea id="bio" value={bio} />

        <button type="submit" id="save">{t('save')}</button>
      </form>
    </div>
  )
}
