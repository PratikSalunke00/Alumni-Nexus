import DashboardShell from '../../components/DashboardShell';
import StudentNavbar from '../../components/studentNavbar';

const referrals = [
  { id: 1, company: 'Google', role: 'Software Engineer Intern', status: 'Pending', alumni: 'Rohan S.' },
  { id: 2, company: 'Microsoft', role: 'Product Analyst', status: 'Accepted', alumni: 'Aisha P.' },
  { id: 3, company: 'Amazon', role: 'Data Analyst', status: 'Needs follow-up', alumni: 'Nikhil R.' },
];

const StudentReferralsPage = () => (
  <><StudentNavbar/>
  <DashboardShell role="student" pageTitle="Referrals">
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">Referral tracker</p>
            <h3 className="mt-2 text-3xl font-semibold text-slate-900">Your requests</h3>
          </div>
          <button className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white">Request new referral</button>
        </div>
      </section>

      <div className="space-y-4">
        {referrals.map((item) => (
          <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xl font-semibold text-slate-900">{item.role}</p>
                <p className="text-sm text-slate-600">{item.company} · Alumni: {item.alumni}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                item.status === 'Accepted'
                  ? 'bg-emerald-100 text-emerald-700'
                  : item.status === 'Pending'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-sky-100 text-sky-700'
              }`}>{item.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </DashboardShell>
  </>
);

export default StudentReferralsPage;
