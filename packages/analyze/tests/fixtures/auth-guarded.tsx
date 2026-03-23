'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  return (
    <div>
      <h1>Dashboard</h1>
      <button id="new-novel">Create Novel</button>
      <button id="settings" disabled>Settings</button>
    </div>
  )
}
