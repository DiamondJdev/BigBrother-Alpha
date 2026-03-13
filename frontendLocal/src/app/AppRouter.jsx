import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ROUTES } from './routes'
import LoginPage from '../pages/loginPage'
import AdminHomePage from '../pages/adminHomePage'
import UserHomePage from '../pages/userHomePage'
import UserProgressPage from '../pages/userProgressPage'
import AdminTestingPage from '../pages/adminTestingPage'
import AdminApprovalPage from '../pages/adminApprovalPage'

export default function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.ADMIN_HOME} element={<AdminHomePage />} />
        <Route path={ROUTES.USER_HOME} element={<UserHomePage />} />
        <Route path={ROUTES.USER_PROGRESS} element={<UserProgressPage />} />
        <Route path={ROUTES.ADMIN_TESTING} element={<AdminTestingPage />} />
        <Route path={ROUTES.ADMIN_APPROVAL} element={<AdminApprovalPage />} />
        <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
      </Routes>
    </HashRouter>
  )
}
