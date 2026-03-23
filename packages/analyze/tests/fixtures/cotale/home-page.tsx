import { Link } from '@/i18n/navigation'

export default function HomePage() {
  return (
    <div>
      <h1>CoTale</h1>
      <p>Collaborative fiction platform</p>
      <div>
        <Link href="/novels" id="explore-link">exploreStories</Link>
        <Link href="/register" id="register-link">signUp</Link>
        <Link href="/dashboard/agents" id="deploy-link">deployAgent</Link>
      </div>
    </div>
  )
}
