import { Link } from 'react-router';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3 lg:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-lg font-bold text-white">A</div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">College network</p>
                <p className="text-lg font-semibold text-white">Alumni Nexus</p>
              </div>
            </div>
            <p className="text-sm leading-6 text-slate-300">
              A verified college network where students discover mentors, internships, referrals, and growth opportunities through alumni support.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Explore</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/" className="hover:text-white">Home</Link></li>
              <li><Link to="/student/dashboard" className="hover:text-white">Student portal</Link></li>
              <li><Link to="/alumni/dashboard" className="hover:text-white">Alumni dashboard</Link></li>
              <li><Link to="/admin/dashboard" className="hover:text-white">Admin overview</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Resources</h3>
            <ul className="space-y-3 text-sm">
              <li>Career guidance</li>
              <li>Placement drives</li>
              <li>Mock interviews</li>
              <li>Resume reviews</li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li>support@alumninexus.edu</li>
              <li>+91 98765 43210</li>
              <li>Placement Cell, College Campus</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800 py-5 text-center text-sm text-slate-400">
        © 2026 Alumni Nexus. Built for campus careers.
      </div>
    </footer>
  );
};

export default Footer;