import { Link } from 'react-router';
import { useState } from 'react';
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Students', path: '/student/dashboard' },
    { label: 'Alumni', path: '/alumni/dashboard' },
    { label: 'Admin', path: '/admin/dashboard' },
  ];

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">A</div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">College network</p>
            <p className="text-lg font-semibold text-slate-900">Alumni Nexus</p>
          </div>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {navItems.map((item) => (
            <Link key={item.label} to={item.path} className="text-sm font-medium text-slate-600 transition hover:text-indigo-600">
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <button className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700">
            <BellIcon className="h-5 w-5" />
          </button>
          <Link to="/login" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">Login</Link>
          <Link to="/signup" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700">Sign up</Link>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 md:hidden"
          aria-label="Toggle navigation"
        >
          {menuOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
        </button>
      </nav>

      {menuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {navItems.map((item) => (
              <Link key={item.label} onClick={() => setMenuOpen(false)} to={item.path} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600">
                {item.label}
              </Link>
            ))}
            <Link onClick={() => setMenuOpen(false)} to="/login" className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">Login</Link>
            <Link onClick={() => setMenuOpen(false)} to="/signup" className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white">Sign up</Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
