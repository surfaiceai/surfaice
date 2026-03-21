'use client'

import { ui } from '@surfaice/react'

// Mock user data — in a real app this comes from your auth/API
const mockUser = {
  name: 'Haosu Wu',
  email: 'haosu@example.com',
  notificationsEnabled: true,
  theme: 'System',
}

export default function SettingsPage() {
  return (
    <ui.page
      route="/settings"
      name="Settings Page"
      states={['auth-required']}
      capabilities={[
        {
          id: 'update-profile',
          description: 'User updates their display name',
          elements: ['name', 'save'],
        },
      ]}
    >
      <h1>Settings</h1>

      <ui.section name="Profile">
        <h2>Profile</h2>

        <ui.element
          id="name"
          type="textbox"
          label="Display Name"
          value={mockUser.name}
          current="{user.name}"
          accepts="string"
          action="PUT /api/profile"
        >
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="name" style={{ display: 'block', marginBottom: '4px' }}>Display Name</label>
            <input
              id="name"
              type="text"
              defaultValue={mockUser.name}
              style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '300px' }}
            />
          </div>
        </ui.element>

        <ui.element
          id="email"
          type="textbox"
          label="Email Address"
          attributes={['readonly']}
          shows={mockUser.email}
        >
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '4px' }}>Email Address</label>
            <input
              id="email"
              type="email"
              value={mockUser.email}
              readOnly
              style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '300px', background: '#f9f9f9' }}
            />
          </div>
        </ui.element>

        <ui.element
          id="save"
          type="button"
          label="Save Changes"
          attributes={['destructive']}
          action="PUT /api/profile"
          result="toast 'Profile updated successfully'"
        >
          <button
            style={{ padding: '8px 16px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            onClick={() => alert('Saved! (demo)')}
          >
            Save Changes
          </button>
        </ui.element>
      </ui.section>

      <ui.section name="Notifications">
        <h2>Notifications</h2>

        <ui.element
          id="notify-email"
          type="toggle"
          label="Email Notifications"
          value={mockUser.notificationsEnabled}
          current="{user.notificationsEnabled}"
          action="PUT /api/settings/notifications"
        >
          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="notify-email"
              defaultChecked={mockUser.notificationsEnabled}
            />
            <label htmlFor="notify-email">Email Notifications</label>
          </div>
        </ui.element>
      </ui.section>

      <ui.section name="Appearance">
        <h2>Appearance</h2>

        <ui.element
          id="theme"
          type="select"
          label="Theme"
          value={mockUser.theme}
          current="{user.theme}"
          options={['Light', 'Dark', 'System']}
          action="PUT /api/settings/theme"
        >
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="theme" style={{ display: 'block', marginBottom: '4px' }}>Theme</label>
            <select
              id="theme"
              defaultValue={mockUser.theme}
              style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            >
              <option>Light</option>
              <option>Dark</option>
              <option>System</option>
            </select>
          </div>
        </ui.element>
      </ui.section>

      <ui.section name="Danger Zone">
        <h2>Danger Zone</h2>

        <ui.element
          id="delete-account"
          type="button"
          label="Delete Account"
          attributes={['destructive']}
          action="DELETE /api/account"
          result="confirms: 'Are you sure? This action cannot be undone.'"
        >
          <button
            style={{ padding: '8px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            onClick={() => confirm('Are you sure? This action cannot be undone.')}
          >
            Delete Account
          </button>
        </ui.element>
      </ui.section>
    </ui.page>
  )
}
