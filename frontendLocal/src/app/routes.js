export const ROUTES = {
  LOGIN: '/login',
  ADMIN_HOME: '/admin-home',
  USER_HOME: '/user-home',
  USER_PROGRESS: '/user-progress',
  ADMIN_TESTING: '/admin-testing',
  ADMIN_APPROVAL: '/admin-approval',
}

export const NAV_LINKS = [
  { to: ROUTES.LOGIN, label: 'Login Page' },
  { to: ROUTES.ADMIN_HOME, label: 'Admin Home Page' },
  { to: ROUTES.USER_HOME, label: 'User Home Page' },
  { to: ROUTES.USER_PROGRESS, label: 'User Progress Page' },
  { to: ROUTES.ADMIN_TESTING, label: 'Admin Testing Page' },
  { to: ROUTES.ADMIN_APPROVAL, label: 'Admin Approval Page' },
]
