import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { ROUTES } from '../app/routes'

export default function LoginPage() {
  return (
    <PageShell
      title="Login Page"
      subtitle="Entry point for administrators and users."
    >
      <form className="grid max-w-md gap-4">
        <label className="grid gap-1 text-sm">
          Email
          <input
            type="email"
            placeholder="name@company.com"
            className="rounded-md border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="grid gap-1 text-sm">
          Password
          <input
            type="password"
            placeholder="********"
            className="rounded-md border border-slate-300 px-3 py-2"
          />
        </label>
        <button
          type="button"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Sign In
        </button>
      </form>
      <div className="mt-4 flex gap-4 text-sm text-slate-700">
        <Link to={ROUTES.ADMIN_HOME} className="underline">
          Continue as admin
        </Link>
        <Link to={ROUTES.USER_HOME} className="underline">
          Continue as user
        </Link>
      </div>
    </PageShell>
  )
}
