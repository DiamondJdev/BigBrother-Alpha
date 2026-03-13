import PageShell from '../components/PageShell'

export default function UserProgressPage() {
  return (
    <PageShell
      title="User Progress Page"
      subtitle="Progress and completion metrics for user workflows."
    >
      <div className="space-y-3 text-sm text-slate-700">
        <div className="rounded-md border border-slate-200 p-4">Progress chart placeholder</div>
        <div className="rounded-md border border-slate-200 p-4">Milestone timeline placeholder</div>
      </div>
    </PageShell>
  )
}
