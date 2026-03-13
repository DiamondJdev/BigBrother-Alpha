import { NavLink } from 'react-router-dom'
import { NAV_LINKS } from '../app/routes'

function activeClassName({ isActive }) {
  return [
    'rounded-lg px-3 py-2 text-sm transition-colors',
    isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-200',
  ].join(' ')
}

export default function PageShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-semibold">BigBrother Electron</h1>
            <p className="text-sm text-slate-500">Electron branch starter layout</p>
          </div>
          <nav className="flex flex-wrap gap-2">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className={activeClassName}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </section>
      </main>
    </div>
  )
}
