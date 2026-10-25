import DashboardShell from '../../components/DashboardShell';
import StudentNavbar from '../../components/studentNavbar';

const sessions = [
  { id: 1, mentor: 'Rohan S.', topic: 'Career roadmap for product roles', time: 'Today · 6:00 PM', status: 'Confirmed' },
  { id: 2, mentor: 'Aisha P.', topic: 'Resume review and internship prep', time: 'Thu · 11:30 AM', status: 'Scheduled' },
  { id: 3, mentor: 'Nikhil R.', topic: 'Mock interview guidance', time: 'Fri · 3:00 PM', status: 'Requested' },
];

const StudentMentorshipPage = () => (
  <><StudentNavbar/>
  <DashboardShell role="student" pageTitle="Mentorship">
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">Guidance</p>
            <h3 className="mt-2 text-3xl font-semibold text-slate-900">Mentor sessions</h3>
          </div>
          <button className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white">Book a session</button>
        </div>
      </section>

      <div className="space-y-4">
        {sessions.map((session) => (
          <div key={session.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xl font-semibold text-slate-900">{session.topic}</p>
                <p className="mt-1 text-sm text-slate-600">with {session.mentor} · {session.time}</p>
              </div>
              <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">{session.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </DashboardShell>
  </>
);

export default StudentMentorshipPage;
