import PageShell from '../components/PageShell'

export default function AdminHomePage() {
  return (
    <PageShell
      title="Admin Home Page"
      subtitle="Central dashboard for approvals, testing, and oversight."
    >
      <ul className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
        <li className="rounded-md border border-slate-200 p-4">Pending approvals</li>
        <li className="rounded-md border border-slate-200 p-4">Recent user activity</li>
        <li className="rounded-md border border-slate-200 p-4">Open test sessions</li>
        <li className="rounded-md border border-slate-200 p-4">Flagged submissions</li>
      </ul>
    </PageShell>
  )
}
