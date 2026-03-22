import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { serialize } from '@surfaice/format'
import type { SurfaicePage } from '@surfaice/format'

const PAGE_MANIFESTS: Record<string, SurfaicePage> = {
  '/settings': {
    version: 'v1',
    route: '/settings',
    name: 'Settings Page',
    states: ['auth-required'],
    capabilities: [
      { id: 'update-profile', description: 'User updates their display name', elements: ['name', 'save'] },
    ],
    sections: [
      {
        name: 'Profile',
        elements: [
          { id: 'name', type: 'textbox', label: 'Display Name', current: '{user.name}', accepts: 'string', action: 'PUT /api/profile' },
          { id: 'email', type: 'textbox', label: 'Email Address', attributes: ['readonly'], shows: '{user.email}' },
          { id: 'save', type: 'button', label: 'Save Changes', attributes: ['destructive'], action: 'PUT /api/profile', result: "toast 'Profile updated successfully'" },
        ],
      },
      {
        name: 'Notifications',
        elements: [
          { id: 'notify-email', type: 'toggle', label: 'Email Notifications', current: '{user.notificationsEnabled}', action: 'PUT /api/settings/notifications' },
        ],
      },
      {
        name: 'Appearance',
        elements: [
          { id: 'theme', type: 'select', label: 'Theme', current: '{user.theme}', options: ['Light', 'Dark', 'System'], action: 'PUT /api/settings/theme' },
        ],
      },
      {
        name: 'Danger Zone',
        elements: [
          { id: 'delete-account', type: 'button', label: 'Delete Account', attributes: ['destructive'], action: 'DELETE /api/account', result: "confirms: 'Are you sure? This action cannot be undone.'" },
        ],
      },
    ],
  },
  '/dashboard': {
    version: 'v1',
    route: '/dashboard',
    name: 'Dashboard',
    states: ['auth-required'],
    capabilities: [
      { id: 'create-project', description: 'User creates a new project', elements: ['create-project'] },
      { id: 'view-tasks', description: 'User views their task list', elements: ['view-tasks'] },
    ],
    sections: [
      {
        name: 'Overview',
        elements: [
          { id: 'projects-count', type: 'badge', label: 'Active Projects', shows: '{stats.projects}' },
          { id: 'tasks-count', type: 'badge', label: 'Pending Tasks', shows: '{stats.tasks}' },
          { id: 'notifications-count', type: 'badge', label: 'Unread Notifications', shows: '{stats.notifications}' },
        ],
      },
      {
        name: 'Actions',
        elements: [
          { id: 'create-project', type: 'button', label: 'Create New Project', action: 'POST /api/projects', result: 'navigates: /projects/new' },
          { id: 'view-tasks', type: 'link', label: 'View All Tasks', navigates: '/tasks' },
        ],
      },
    ],
  },
}

export async function GET(request: NextRequest) {
  // 'r' param is the route without leading slash (e.g. 'settings', 'dashboard')
  const r = request.nextUrl.searchParams.get('r') ?? ''
  const route = r === 'index' || r === '' ? '/' : `/${r}`
  const page = PAGE_MANIFESTS[route]

  if (!page) {
    return new NextResponse(`No Surfaice manifest found for route: ${route}`, {
      status: 404,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  const markdown = serialize(page)
  return new NextResponse(markdown, {
    status: 200,
    headers: { 'Content-Type': 'text/surfaice; charset=utf-8', 'X-Surfaice-Route': route },
  })
}
