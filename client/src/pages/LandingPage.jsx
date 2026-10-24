import { Link } from 'react-router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';

const featureCards = [
  { title: 'Verified alumni access', text: 'Connect with graduates working at top companies and access career guidance from trusted mentors.' },
  { title: 'Referral workflows', text: 'Track referral requests, application outcomes, and mentor follow-ups in one organized place.' },
  { title: 'Career readiness', text: 'Discover internships, mock interviews, resume feedback, and placement updates built for your college community.' },
];

const roleCards = [
  { role: 'Student', blurb: 'Find referrals, apply to opportunities, and build a stronger profile with alumni help.' },
  { role: 'Alumni', blurb: 'Share openings, support students, and contribute through mentoring and endorsement.' },
  { role: 'Admin', blurb: 'Moderate opportunities, verify members, and manage your college network with insight.' },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main>
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                College-exclusive network
              </span>
              <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Build your next career move with your college community.
              </h1>
              <p className="mt-5 max-w-xl text-lg text-slate-600">
                Alumni Nexus helps students discover verified alumni, request referrals, track opportunities, and get mentorship without leaving the college network.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link to="/signup">
                  <Button title="Join as student" size="lg" varient="primary" />
                </Link>
                <Link to="/alumni/dashboard">
                  <Button title="View alumni dashboard" size="lg" varient="outline" />
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap gap-8 text-sm text-slate-700">
                <div>
                  <div className="text-3xl font-bold text-slate-900">12K+</div>
                  <div>student profiles</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-slate-900">480+</div>
                  <div>verified alumni</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-slate-900">9.4/10</div>
                  <div>mentor satisfaction</div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Opportunity match</p>
                    <p className="mt-2 text-4xl font-bold text-slate-900">92%</p>
                  </div>
                  <div className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">Strong fit</div>
                </div>

                <div className="mt-8 space-y-4">
                  {['Software Engineer Intern', 'Product Analyst', 'Data Analyst'].map((item, index) => (
                    <div key={item} className="flex items-center justify-between rounded-xl bg-white p-3 ring-1 ring-slate-200">
                      <div>
                        <p className="font-semibold text-slate-800">{item}</p>
                        <p className="text-sm text-slate-500">{index === 0 ? 'Google' : index === 1 ? 'Microsoft' : 'Amazon'}</p>
                      </div>
                      <span className="rounded-full bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700">
                        {index === 0 ? 'Remote' : 'Bengaluru'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Why alumni nexus</p>
              <h2 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">Career support built for one college community.</h2>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {featureCards.map((card) => (
                <div key={card.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-lg text-sky-700">✦</div>
                  <h3 className="text-xl font-semibold text-slate-900">{card.title}</h3>
                  <p className="mt-3 text-slate-600">{card.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">User roles</p>
            <h2 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">A platform designed for every member.</h2>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {roleCards.map((card) => (
              <div key={card.role} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 inline-flex rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-700">{card.role}</div>
                <p className="text-slate-600">{card.blurb}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;
