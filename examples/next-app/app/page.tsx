export default function Home() {
  return (
    <div>
      <h1>Surfaice Example App</h1>
      <p>This app demonstrates Surfaice UI annotations. Try requesting any page with:</p>
      <pre style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
        curl -H "Accept: text/surfaice" http://localhost:3000/settings
      </pre>
      <ul>
        <li><a href="/dashboard">Dashboard</a> — annotated dashboard page</li>
        <li><a href="/settings">Settings</a> — annotated settings page with form elements</li>
      </ul>
    </div>
  )
}
