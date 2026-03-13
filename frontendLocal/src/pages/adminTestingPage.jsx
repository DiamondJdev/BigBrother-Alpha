import PageShell from '../components/PageShell'

export default function AdminTestingPage() {
  return (
    <PageShell
      title="Admin Testing Page"
      subtitle="Test assignment and review workflows for administrators."
    >
      <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
        <div className="rounded-md border border-slate-200 p-4">Create test run</div>
        <div className="rounded-md border border-slate-200 p-4">Monitor active test</div>
      </div>
    </PageShell>
  )
}
