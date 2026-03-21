'use client'

import { ui } from '@surfaice/react'

const mockStats = {
  projects: 3,
  tasks: 12,
  notifications: 5,
}

export default function DashboardPage() {
  return (
    <ui.page
      route="/dashboard"
      name="Dashboard"
      states={['auth-required']}
      capabilities={[
        { id: 'create-project', description: 'User creates a new project', elements: ['create-project'] },
        { id: 'view-tasks', description: 'User views their task list', elements: ['view-tasks'] },
      ]}
    >
      <h1>Dashboard</h1>

      <ui.section name="Overview">
        <h2>Overview</h2>

        <ui.element
          id="projects-count"
          type="badge"
          label="Active Projects"
          shows={mockStats.projects}
        >
          <div style={{ padding: '16px', background: '#f0f9ff', borderRadius: '8px', marginBottom: '12px' }}>
            <strong>{mockStats.projects}</strong> Active Projects
          </div>
        </ui.element>

        <ui.element
          id="tasks-count"
          type="badge"
          label="Pending Tasks"
          shows={mockStats.tasks}
        >
          <div style={{ padding: '16px', background: '#fef9c3', borderRadius: '8px', marginBottom: '12px' }}>
            <strong>{mockStats.tasks}</strong> Pending Tasks
          </div>
        </ui.element>

        <ui.element
          id="notifications-count"
          type="badge"
          label="Unread Notifications"
          shows={mockStats.notifications}
        >
          <div style={{ padding: '16px', background: '#fef2f2', borderRadius: '8px', marginBottom: '12px' }}>
            <strong>{mockStats.notifications}</strong> Unread Notifications
          </div>
        </ui.element>
      </ui.section>

      <ui.section name="Actions">
        <h2>Quick Actions</h2>

        <ui.element
          id="create-project"
          type="button"
          label="Create New Project"
          action="POST /api/projects"
          result="navigates: /projects/new"
        >
          <button
            style={{ padding: '8px 16px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '8px' }}
            onClick={() => alert('Create project (demo)')}
          >
            Create New Project
          </button>
        </ui.element>

        <ui.element
          id="view-tasks"
          type="link"
          label="View All Tasks"
          navigates="/tasks"
        >
          <a href="/tasks" style={{ color: '#0070f3', textDecoration: 'underline' }}>
            View All Tasks →
          </a>
        </ui.element>
      </ui.section>
    </ui.page>
  )
}
