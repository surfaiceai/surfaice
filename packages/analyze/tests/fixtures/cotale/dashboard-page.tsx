'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslations } from 'next-intl'

export default function DashboardPage() {
  const t = useTranslations('Dashboard')
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  return (
    <div>
      <h1>{t('welcome')}</h1>
      <nav>
        <Link href="/dashboard/settings" id="settings-link">{t('settings')}</Link>
        <Link href="/dashboard/agents" id="agents-link">{t('agents')}</Link>
        <Link href="/dashboard/new" id="new-novel-link">{t('newNovel')}</Link>
      </nav>
    </div>
  )
}
