import DashboardShell from '../../components/DashboardShell';

const mentorshipRequests = [
  { id: 1, student: 'Ananya Iyer', topic: 'Resume review', time: 'Today, 6:00 PM', status: 'Confirmed' },
  { id: 2, student: 'Karan Bose', topic: 'Career roadmap', time: 'Thu, 11:30 AM', status: 'Pending' },
  { id: 3, student: 'Meera Singh', topic: 'Mock interview prep', time: 'Fri, 3:00 PM', status: 'Requested' },
];

const AlumniMentorshipPage = () => (
  <DashboardShell role="alumni" pageTitle="Mentorship">
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">Support</p>
            <h3 className="mt-2 text-3xl font-semibold text-slate-900">Mentorship requests</h3>
          </div>
          <button className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white">Manage availability</button>
        </div>
      </section>

      <div className="space-y-4">
        {mentorshipRequests.map((request) => (
          <div key={request.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xl font-semibold text-slate-900">{request.student}</p>
                <p className="text-sm text-slate-600">{request.topic} · {request.time}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">{request.status}</span>
                <button className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">Respond</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </DashboardShell>
);

export default AlumniMentorshipPage;
