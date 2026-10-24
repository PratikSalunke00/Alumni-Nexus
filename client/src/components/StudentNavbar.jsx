
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  Bars3Icon,
  BellIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const StudentNavbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Get logged-in user
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const role = user?.role?.toLowerCase();

  // Dashboard links based on role
  const navItems = [
    { label: 'Home', path: '/', roles: ['student', 'alumni', 'admin'] },
    { label: 'Dashboard', path: '/student/dashboard', roles: ['student'] },
    { label: 'Dashboard', path: '/alumni/dashboard', roles: ['alumni'] },
    { label: 'Dashboard', path: '/admin/dashboard', roles: ['admin'] },
  ];

  const visibleItems = navItems.filter((item) =>
    item.roles.includes(role)
  );

  // Sign out
  const handleSignOut = () => {
    localStorage.removeItem('user');

    // Remove this line if your application doesn't store a token
    localStorage.removeItem('token');

    setMenuOpen(false);
    navigate('/');
    window.location.reload();
  };

  const profilePath =
    role === 'student'
      ? '/student/profile'
      : role === 'alumni'
      ? '/alumni/profile'
      : '/admin/dashboard';

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-lg font-bold text-white">
            A
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              College network
            </p>
            <p className="text-lg font-semibold text-slate-900">
              Alumni Nexus
            </p>
          </div>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-7 md:flex">
          {visibleItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="text-sm font-medium text-slate-600 transition hover:text-sky-600"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Desktop buttons */}
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <button
                type="button"
                aria-label="Notifications"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700"
              >
                <BellIcon className="h-5 w-5" />
              </button>

              <Link
                to={profilePath}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700"
              >
                Profile
              </Link>

              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              
              <Link
                to="/signup"
                className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
              >
                Sign Out
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 md:hidden"
          aria-label="Toggle navigation"
        >
          {menuOpen ? (
            <XMarkIcon className="h-5 w-5" />
          ) : (
            <Bars3Icon className="h-5 w-5" />
          )}
        </button>
      </nav>

      {/* Mobile navigation */}
      {menuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {visibleItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-sky-600"
              >
                {item.label}
              </Link>
            ))}

            {user ? (
              <>
                <Link
                  to={profilePath}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
                >
                  Profile
                </Link>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-lg bg-red-600 px-3 py-2 text-left text-sm font-semibold text-white hover:bg-red-700"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/signOut"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
                >
                  SignOut
                </Link>

                
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default StudentNavbar;
