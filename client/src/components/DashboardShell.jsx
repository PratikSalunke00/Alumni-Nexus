import { Link, useLocation } from 'react-router';

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
      { label: 'Community', path: '/community' },
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
      { label: 'Community', path: '/community' },
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
      { label: 'Community', path: '/community' },
    ],
  },
};

/** Derive up-to-2-letter initials from a name string. */
const nameInitials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || '')
    .join('')
    .toUpperCase() || '?';

/** Read the logged-in user from localStorage (stored by Login.jsx saveUserSession). */
const getLocalUser = () => {
  try {
    return JSON.parse(localStorage.getItem('userData') || '{}');
  } catch {
    return {};
  }
};

const DashboardShell = ({ role = 'student', children, pageTitle }) => {
  const config = roleLabels[role] ?? roleLabels.student;
  const { pathname } = useLocation();

  const localUser = getLocalUser();
  const displayName =
    localStorage.getItem('name') || localUser.name || localUser.fullName || '';
  const profilePhoto = localUser.profilePhoto || '';
  const avatarInitials = nameInitials(displayName);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:px-6">

        {/* ── Sidebar ── */}
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
                  pathname === item.path ||
                  (item.path === '/community' && pathname.startsWith('/community/'))
                    ? 'bg-sky-500 text-white'
                    : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{item.label}</span>
                <span>→</span>
              </Link>
            ))}
          </nav>

          {/* Logged-in user chip at the bottom of the sidebar */}
          {displayName && (
            <div className="mt-8 flex items-center gap-3 rounded-2xl bg-slate-800 px-4 py-3">
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt={displayName}
                  className="h-9 w-9 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-500 text-sm font-bold text-white">
                  {avatarInitials}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-100">{displayName}</p>
                <p className="text-xs capitalize text-slate-400">{role}</p>
              </div>
            </div>
          )}
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 rounded-3xl border border-slate-200 bg-white shadow-sm">
          <header className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-600">{config.title}</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900">{pageTitle}</h2>
            </div>

            <div className="flex items-center gap-3">
              {/* Mobile community shortcut */}
              <Link
                to="/community"
                className="rounded-xl bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100 lg:hidden"
              >
                Community
              </Link>

              {/* Display name (desktop only) */}
              {displayName && (
                <span className="hidden text-sm font-medium text-slate-700 lg:block">
                  {displayName}
                </span>
              )}

              {/* Avatar */}
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt={displayName}
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-sky-200"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-600 text-sm font-semibold text-white">
                  {avatarInitials || '?'}
                </div>
              )}
            </div>
          </header>

          <div className="p-5 sm:p-6">{children}</div>
        </main>

      </div>
    </div>
  );
};

export default DashboardShell;
