import DashboardShell from '../../components/DashboardShell';

const referralRequests = [
  { id: 1, student: 'Aditi Sharma', role: 'Software Engineer Intern', status: 'Under review' },
  { id: 2, student: 'Mihir Kumar', role: 'Product Analyst', status: 'Approved' },
  { id: 3, student: 'Priya Nair', role: 'Data Analyst', status: 'Pending' },
];

const AlumniReferralsPage = () => (
  <DashboardShell role="alumni" pageTitle="Referrals">
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">Requests</p>
            <h3 className="mt-2 text-3xl font-semibold text-slate-900">Referral review queue</h3>
          </div>
          <button className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white">Review all</button>
        </div>
      </section>

      <div className="space-y-4">
        {referralRequests.map((item) => (
          <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xl font-semibold text-slate-900">{item.student}</p>
                <p className="text-sm text-slate-600">{item.role}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  item.status === 'Approved'
                    ? 'bg-emerald-100 text-emerald-700'
                    : item.status === 'Under review'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-sky-100 text-sky-700'
                }`}>{item.status}</span>
                <button className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">Respond</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </DashboardShell>
);

export default AlumniReferralsPage;
