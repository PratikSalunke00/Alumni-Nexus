import DashboardShell from '../../components/DashboardShell';
import StatCard from '../../components/StatCard';
import { alumniStats, mentorshipRequests } from '../../data/mockData';

const AlumniDashboard = () => (
  <DashboardShell role="alumni" pageTitle="Welcome back, Rohan">
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">Verification status</p>
            <h3 className="mt-2 text-3xl font-semibold text-slate-900">Verified alumni</h3>
            <p className="mt-2 max-w-xl text-slate-600">Your profile is active and visible to current students seeking mentorship, referrals, and career guidance.</p>
          </div>
          <button className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">Post opportunity</button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {alumniStats.map((stat, index) => (
          <StatCard key={stat.label} {...stat} accent={index % 2 === 0 ? 'emerald' : index === 1 ? 'sky' : 'amber'} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900">Pending referral requests</h3>
            <button className="text-sm font-medium text-emerald-600">Review all</button>
          </div>
          <div className="space-y-3">
            {['Aditi Sharma', 'Mihir Kumar', 'Priya Nair'].map((person, index) => (
              <div key={person} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-800">{person}</p>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Under review</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">Requested referral for {index === 0 ? 'Software Engineer Intern' : index === 1 ? 'Product Analyst' : 'Data Analyst'}.</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900">Mentorship requests</h3>
            <button className="text-sm font-medium text-emerald-600">Manage slots</button>
          </div>
          <div className="space-y-3">
            {mentorshipRequests.map((request) => (
              <div key={request.student} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-800">{request.student}</p>
                  <span className="text-xs font-medium text-slate-500">{request.time}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{request.topic}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  </DashboardShell>
);

export default AlumniDashboard;
