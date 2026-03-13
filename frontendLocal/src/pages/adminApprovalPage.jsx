import PageShell from '../components/PageShell'

export default function AdminApprovalPage() {
  return (
    <PageShell
      title="Admin Approval Page"
      subtitle="Review and approve pending user submissions."
    >
      <div className="space-y-3 text-sm text-slate-700">
        <div className="rounded-md border border-slate-200 p-4">Submission queue placeholder</div>
        <div className="rounded-md border border-slate-200 p-4">Approval history placeholder</div>
      </div>
    </PageShell>
  )
}
