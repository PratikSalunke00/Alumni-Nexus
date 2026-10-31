import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Bars3Icon, BellIcon, XMarkIcon } from "@heroicons/react/24/outline";

const StudentNavbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Get logged-in user safely
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
  const role = (localStorage.getItem("role") || user?.role || "student").toLowerCase();

  const dashboardPath =
    role === "alumni"
      ? "/alumni/dashboard"
      : role === "admin"
        ? "/admin/dashboard"
        : "/student/dashboard";

  const profilePath =
    role === "student"
      ? "/student/profile"
      : role === "alumni"
        ? "/alumni/profile"
        : "/admin/dashboard";

  // Navigation items
  const navItems = [
    { label: "Dashboard", path: dashboardPath },
    { label: "Update Post", path: "/community" },
    { label: "Common Posts", path: "/community/posts" },
  ];

  // Sign out
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

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-xs">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to={dashboardPath} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-lg font-bold text-white shadow-xs">
            A
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">
              College network
            </p>
            <p className="text-lg font-bold text-slate-900">Alumni Nexus</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="text-sm font-medium text-slate-600 transition hover:text-sky-600"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Desktop Buttons */}
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              {/* Profile */}
              <Link
                to={profilePath}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Profile
              </Link>

              {/* Update Post button */}
              <Link
                to="/community"
                className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-sky-700"
              >
                Update Post
              </Link>

              {/* Sign out */}
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-red-50 hover:text-red-600"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              to="/signup"
              className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              Sign Up
            </Link>
          )}
        </div>

        {/* Mobile menu trigger */}
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

                <Link
                  to="/community"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                >
                  Update Post
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

export default StudentNavbar;
