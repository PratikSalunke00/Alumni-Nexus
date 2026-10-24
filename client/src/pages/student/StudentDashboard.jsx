import DashboardShell from '../../components/DashboardShell';
import StatCard from '../../components/StatCard';
import { studentStats, featuredOpportunities, alumniRecommendations, recentUpdates } from '../../data/mockData';

const StudentDashboard = () => (
  <DashboardShell role="student" pageTitle="Welcome back, Aditi">
    <div className="space-y-6">
      <section className="rounded-3xl border border-sky-100 bg-sky-50 p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">Profile completeness</p>
            <h3 className="mt-2 text-3xl font-semibold text-slate-900">78% complete</h3>
            <p className="mt-2 max-w-xl text-slate-600">Add your portfolio, projects, and certifications to unlock stronger alumni referrals and personalized opportunities.</p>
          </div>
          <button className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700">Complete profile</button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {studentStats.map((stat, index) => (
          <StatCard key={stat.label} {...stat} accent={index % 2 === 0 ? 'indigo' : index === 1 ? 'emerald' : 'amber'} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900">Recommended opportunities</h3>
            <button className="text-sm font-medium text-sky-600">View all</button>
          </div>

          <div className="space-y-4">
            {featuredOpportunities.map((item) => (
              <div key={item.title} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{item.title}</p>
                  <p className="text-sm text-slate-600">{item.company} · {item.type} · {item.location}</p>
                </div>
                <div className="text-right">
                  <div className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">{item.match}</div>
                  <button className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">Apply</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900">Recent status updates</h3>
            <button className="text-sm font-medium text-indigo-600">Track</button>
          </div>
          <div className="space-y-3">
            {recentUpdates.map((item) => (
              <div key={item.title} className="rounded-2xl bg-slate-50 p-3">
                <p className="font-medium text-slate-800">{item.title}</p>
                <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                  <span>{item.company}</span>
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900">Verified alumni</h3>
            <button className="text-sm font-medium text-sky-600">Explore</button>
          </div>
          <div className="space-y-4">
            {alumniRecommendations.map((alumni) => (
              <div key={alumni.name} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div>
                  <p className="font-semibold text-slate-900">{alumni.name}</p>
                  <p className="text-sm text-slate-600">{alumni.role} · {alumni.company}</p>
                </div>
                <button className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700">Connect</button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900">Quick actions</h3>
            <button className="text-sm font-medium text-sky-600">Open alumni hub</button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {['Find alumni', 'Browse internships', 'Request referral'].map((action) => (
              <button key={action} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left text-sm font-medium text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700">
                {action}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  </DashboardShell>
);

export default StudentDashboard;
