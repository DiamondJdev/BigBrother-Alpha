import PageShell from '../components/PageShell'

export default function UserHomePage() {
  return (
    <PageShell
      title="User Home Page"
      subtitle="Landing page for a signed-in user."
    >
      <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
        <div className="rounded-md border border-slate-200 p-4">Assigned modules</div>
        <div className="rounded-md border border-slate-200 p-4">Upcoming deadlines</div>
      </div>
    </PageShell>
  )
}
