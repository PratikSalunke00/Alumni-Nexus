import { Link } from 'react-router';

const roleLabels = {
  student: {
    title: 'Student dashboard',
    nav: [
      { label: 'Overview', path: '/student/dashboard' },
      { label: 'Profile', path: '/student/profile' },
      { label: 'Opportunities', path: '/student/opportunities' },
      { label: 'Alumni directory', path: '/student/alumni' },
      { label: 'Referrals', path: '/student/referrals' },
      { label: 'Mentorship', path: '/student/mentorship' },
    ],
  },
  alumni: {
    title: 'Alumni dashboard',
    nav: [
      { label: 'Overview', path: '/alumni/dashboard' },
      { label: 'Profile', path: '/alumni/profile' },
      { label: 'Opportunities', path: '/alumni/opportunities' },
      { label: 'Referrals', path: '/alumni/referrals' },
      { label: 'Mentorship', path: '/alumni/mentorship' },
      { label: 'Insights', path: '/alumni/insights' },
    ],
  },
  admin: {
    title: 'Admin dashboard',
    nav: [
      { label: 'Overview', path: '/admin/dashboard' },
      { label: 'Verification queue', path: '/admin/verification-requests' },
      { label: 'Users', path: '/admin/users' },
      { label: 'Opportunities', path: '/admin/opportunities' },
      { label: 'Invitation codes', path: '/admin/invitation-codes' },
      { label: 'Reports', path: '/admin/reports' },
      { label: 'Settings', path: '/admin/settings' },
    ],
  },
};

const DashboardShell = ({ role = 'student', children, pageTitle }) => {
  const config = roleLabels[role] ?? roleLabels.student;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <aside className="hidden w-72 shrink-0 rounded-3xl border border-slate-200 bg-slate-900 p-5 text-slate-100 shadow-sm lg:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500 text-lg font-semibold text-white">
              A
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300">College network</p>
              <h1 className="text-xl font-bold">Alumni Nexus</h1>
            </div>
          </div>

          <nav className="space-y-2">
            {config.nav.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  item.path.endsWith('dashboard')
                    ? 'bg-sky-500 text-white'
                    : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{item.label}</span>
                <span>→</span>
              </Link>
            ))}
          </nav>

          <div className="mt-10 rounded-2xl bg-slate-800 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">This week</p>
            <p className="mt-3 text-2xl font-semibold">14</p>
            <p className="mt-1 text-sm text-slate-300">new opportunities matched</p>
          </div>
        </aside>

        <main className="flex-1 rounded-3xl border border-slate-200 bg-white shadow-sm">
          <header className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-600">{config.title}</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900">{pageTitle}</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 sm:block">
                Search members, roles, companies
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-600 text-sm font-semibold text-white">
                AD
              </div>
            </div>
          </header>

          <div className="p-5 sm:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default DashboardShell;
