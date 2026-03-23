'use client'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

export default function HomePage() {
  const t = useTranslations('nav')
  return (
    <div>
      <nav>
        <Link href="/login">{t('signIn')}</Link>
        <Link href="/register">{t('signUp')}</Link>
        <a href="https://example.com" aria-label="External site">Visit</a>
      </nav>
      <input type="search" placeholder="Search novels..." id="search" />
      <select id="genre">
        <option value="fantasy">Fantasy</option>
      </select>
      <textarea id="bio" placeholder="Tell us about yourself" />
      <input type="checkbox" id="remember" />
      <input type="radio" id="public" name="visibility" />
    </div>
  )
}
