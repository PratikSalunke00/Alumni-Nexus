import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const AlumniNavbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const user = (() => {
    try {
      return (
        JSON.parse(localStorage.getItem("userData") || "null") ||
        JSON.parse(localStorage.getItem("user") || "null")
      );
    } catch {
      return null;
    }
  })();

  const name =
    user?.name ||
    user?.fullName ||
    localStorage.getItem("name") ||
    "Alumni";

  const navItems = [
    { label: "Dashboard", path: "/alumni/dashboard" },
    { label: "Community", path: "/community" },
    { label: "Common Posts", path: "/community/posts" },
  ];

  const profilePath = "/alumni/profile";

  const handleSignOut = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("userData");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("name");
    localStorage.removeItem("collegeId");
    localStorage.removeItem("userJwtToken");

    setMenuOpen(false);
    navigate("/");
    window.location.reload();
  };

  const isActive = (path) => {
    if (path === "/community") {
      return location.pathname === "/community";
    }

    return location.pathname === path;
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link
          to="/alumni/dashboard"
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-lg font-bold text-white shadow-sm">
            A
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              College Network
            </p>
            <p className="text-lg font-bold text-slate-900">
              Alumni Nexus
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm font-medium transition ${
                isActive(item.path)
                  ? "text-sky-600"
                  : "text-slate-600 hover:text-sky-600"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link
                to={profilePath}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                  isActive(profilePath)
                    ? "border-sky-200 bg-sky-50 text-sky-700"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                My Profile
              </Link>

              <Link
                to="/community"
                className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
              >
                Create Post
              </Link>

              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-red-50 hover:text-red-600"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              to="/signup"
              className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
            >
              Sign Up
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
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

      {/* Mobile Navigation */}
      {menuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2">

            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive(item.path)
                    ? "bg-sky-50 text-sky-700"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
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
                  My Profile
                </Link>

                <Link
                  to="/community"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white"
                >
                  Create Post
                </Link>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-lg bg-red-600 px-3 py-2 text-left text-sm font-semibold text-white hover:bg-red-700"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/signup"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white"
              >
                Sign Up
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default AlumniNavbar;