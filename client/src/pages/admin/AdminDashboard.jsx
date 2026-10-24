import DashboardShell from '../../components/DashboardShell';
import StatCard from '../../components/StatCard';
import { adminStats, userTable, opportunityModeration } from '../../data/mockData';

const AdminDashboard = () => (
  <DashboardShell role="admin" pageTitle="Administration overview">
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        {adminStats.map((stat, index) => (
          <StatCard key={stat.label} {...stat} accent={index % 2 === 0 ? 'indigo' : index === 1 ? 'emerald' : 'amber'} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900">User management</h3>
            <button className="text-sm font-medium text-indigo-600">Search users</button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {userTable.map((row) => (
                  <tr key={row.name} className="border-t border-slate-200">
                    <td className="px-4 py-3 text-slate-800">{row.name}</td>
                    <td className="px-4 py-3 text-slate-600">{row.role}</td>
                    <td className="px-4 py-3 text-slate-600">{row.department}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${row.status === 'Verified' ? 'bg-emerald-100 text-emerald-700' : row.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900">Opportunity moderation</h3>
            <button className="text-sm font-medium text-indigo-600">Review queue</button>
          </div>
          <div className="space-y-3">
            {opportunityModeration.map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-800">{item.title}</p>
                    <p className="text-sm text-slate-600">{item.company}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${item.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : item.status === 'Reviewing' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  </DashboardShell>
);

export default AdminDashboard;
