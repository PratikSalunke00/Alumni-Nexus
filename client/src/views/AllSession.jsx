import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import DashboardShell from "../components/DashboardShell";
import StudentNavbar from "../components/StudentNavbar";
import {
  formatSessionDate,
  getMentorshipConfig,
  getRequestError,
  MENTORSHIP_API,
  sessionDomains,
} from "../utils/mentorship";

const SessionAvatar = ({ person, size = "h-12 w-12" }) =>
  person?.profilePhoto ? (
    <img src={person.profilePhoto} alt={person.name || "Alumni"} className={`${size} rounded-full object-cover`} />
  ) : (
    <div className={`${size} flex shrink-0 items-center justify-center rounded-full bg-sky-100 font-semibold text-sky-700`}>
      {(person?.name || "A").charAt(0).toUpperCase()}
    </div>
  );

const AllSession = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [booking, setBooking] = useState(false);
  const [filters, setFilters] = useState({ search: "", domain: "", minPrice: "", maxPrice: "", date: "", sort: "" });

  useEffect(() => {
    let active = true;
    axios.get(`${MENTORSHIP_API}/api/sessions/all`, getMentorshipConfig())
      .then(({ data }) => { if (active) setSessions(data.data || []); })
      .catch((error) => { if (active) toast.error(getRequestError(error, "Unable to load sessions.")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const visibleSessions = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    return sessions
      .filter((session) => {
        const alumni = session.alumniId || {};
        const matchesSearch = !search ||
          session.title?.toLowerCase().includes(search) ||
          alumni.name?.toLowerCase().includes(search);
        const price = Number(session.price);
        const notPast = session.availableDate > today ||
          (session.availableDate === today && session.availableTime > currentTime);
        return notPast && matchesSearch &&
          (!filters.domain || session.domain === filters.domain) &&
          (!filters.minPrice || price >= Number(filters.minPrice)) &&
          (!filters.maxPrice || price <= Number(filters.maxPrice)) &&
          (!filters.date || session.availableDate === filters.date);
      })
      .sort((a, b) => filters.sort === "low"
        ? Number(a.price) - Number(b.price)
        : filters.sort === "high"
          ? Number(b.price) - Number(a.price)
          : 0);
  }, [filters, sessions]);

  const updateFilter = (event) =>
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));

  const openBooking = (session) => {
    setSelected(session);
    setBookingDate(session.availableDate);
    setBookingTime(session.availableTime);
  };

  const confirmBooking = async (event) => {
    event.preventDefault();
    if (!selected) return;
    setBooking(true);
    try {
      const { data } = await axios.post(
        `${MENTORSHIP_API}/api/bookings/create`,
        {
          sessionId: selected._id,
          bookingDate,
          bookingTime,
        },
        getMentorshipConfig(),
      );
      toast.success(data.message || "Booking request sent.");
      setSelected(null);
    } catch (error) {
      toast.error(getRequestError(error, "Unable to book this session."));
    } finally {
      setBooking(false);
    }
  };

  return (
    <>
      <StudentNavbar />
      <DashboardShell role="student" pageTitle="Explore mentorship sessions">
        <Toaster position="top-right" />
        <div className="space-y-6">
          <section className="rounded-3xl bg-gradient-to-r from-sky-700 to-indigo-700 p-6 text-white sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100">Learn from experience</p>
            <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold sm:text-3xl">Find your next mentor</h1>
                <p className="mt-2 max-w-2xl text-sm text-sky-50">Browse practical, one-to-one sessions led by alumni in your network.</p>
              </div>
              <Link to="/student/bookings" className="w-fit rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/25">My bookings</Link>
            </div>
          </section>

          <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
            <input aria-label="Search title or alumni" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-400" name="search" value={filters.search} onChange={updateFilter} placeholder="Search title or alumni" />
            <select aria-label="Filter domain" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" name="domain" value={filters.domain} onChange={updateFilter}>
              <option value="">All domains</option>
              {[...new Set([...sessionDomains, ...sessions.map((session) => session.domain)])].map((domain) => <option key={domain}>{domain}</option>)}
            </select>
            <div className="flex gap-2">
              <input aria-label="Minimum price" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm" type="number" min="0" name="minPrice" value={filters.minPrice} onChange={updateFilter} placeholder="Min ₹" />
              <input aria-label="Maximum price" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm" type="number" min="0" name="maxPrice" value={filters.maxPrice} onChange={updateFilter} placeholder="Max ₹" />
            </div>
            <input aria-label="Filter available date" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" type="date" name="date" value={filters.date} onChange={updateFilter} />
            <select aria-label="Sort by price" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" name="sort" value={filters.sort} onChange={updateFilter}>
              <option value="">Sort by: Recommended</option>
              <option value="low">Price: Low to high</option>
              <option value="high">Price: High to low</option>
            </select>
            <button type="button" onClick={() => setFilters({ search: "", domain: "", minPrice: "", maxPrice: "", date: "", sort: "" })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Clear filters</button>
          </section>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((item) => <div key={item} className="h-80 animate-pulse rounded-2xl bg-slate-100" />)}
            </div>
          ) : visibleSessions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-16 text-center">
              <p className="text-lg font-semibold text-slate-800">{sessions.length ? "No sessions match those filters" : "No published sessions yet"}</p>
              <p className="mt-2 text-sm text-slate-500">Try another search or check back when alumni publish new sessions.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleSessions.map((session) => {
                const alumni = session.alumniId || {};
                return (
                  <article key={session._id} className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-center gap-3 border-b border-slate-100 p-5">
                      <SessionAvatar person={alumni} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{alumni.name || "Alumni mentor"}</p>
                        <p className="truncate text-xs text-slate-500">{[alumni.jobTitle, alumni.company].filter(Boolean).join(" · ") || "Alumni"}</p>
                      </div>
                      <span className="ml-auto shrink-0 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">{session.domain}</span>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h2 className="text-lg font-bold text-slate-900">{session.title}</h2>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{session.description}</p>
                      {session.topics?.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {session.topics.slice(0, 4).map((topic) => <span key={topic} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{topic}</span>)}
                        </div>
                      )}
                      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm">
                        <div><p className="text-xs text-slate-400">Date & time</p><p className="mt-1 font-medium text-slate-700">{formatSessionDate(session.availableDate)} · {session.availableTime}</p></div>
                        <div><p className="text-xs text-slate-400">Duration</p><p className="mt-1 font-medium text-slate-700">{session.duration} minutes</p></div>
                      </div>
                      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                        <p className="text-xl font-bold text-slate-900">₹{Number(session.price).toLocaleString("en-IN")}<span className="ml-1 text-xs font-normal text-slate-400">informational</span></p>
                        <button onClick={() => openBooking(session)} className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700">Book session</button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </DashboardShell>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !booking) setSelected(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="booking-title" className="my-auto w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-7">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">Session details</p>
                <h2 id="booking-title" className="mt-1 text-xl font-bold text-slate-900">{selected.title}</h2>
              </div>
              <button onClick={() => setSelected(null)} aria-label="Close booking details" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">✕</button>
            </div>
            <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5 sm:p-7">
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                <SessionAvatar person={selected.alumniId} size="h-14 w-14" />
                <div>
                  <p className="font-semibold text-slate-900">{selected.alumniId?.name || "Alumni mentor"}</p>
                  <p className="text-sm text-slate-500">{[selected.alumniId?.jobTitle, selected.alumniId?.company].filter(Boolean).join(" at ")}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">About this session</p>
                <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">{selected.description}</p>
              </div>
              {selected.topics?.length > 0 && <div><p className="text-sm font-semibold text-slate-800">Topics covered</p><div className="mt-2 flex flex-wrap gap-2">{selected.topics.map((topic) => <span key={topic} className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">{topic}</span>)}</div></div>}
              <div className="grid gap-3 rounded-2xl border border-slate-100 p-4 sm:grid-cols-3">
                <div><p className="text-xs text-slate-400">Domain</p><p className="mt-1 text-sm font-medium">{selected.domain}</p></div>
                <div><p className="text-xs text-slate-400">Duration</p><p className="mt-1 text-sm font-medium">{selected.duration} minutes</p></div>
                <div><p className="text-xs text-slate-400">Price</p><p className="mt-1 text-sm font-medium">₹{Number(selected.price).toLocaleString("en-IN")}</p></div>
              </div>
              <form onSubmit={confirmBooking} className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-medium text-slate-700">Select available date<input className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5" type="date" min={selected.availableDate} max={selected.availableDate} value={bookingDate} onChange={(event) => setBookingDate(event.target.value)} required /></label>
                  <label className="text-sm font-medium text-slate-700">Select available time<input className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5" type="time" min={selected.availableTime} max={selected.availableTime} value={bookingTime} onChange={(event) => setBookingTime(event.target.value)} required /></label>
                </div>
                <p className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">Your request will be sent to the alumni for confirmation. The listed price is informational; no payment is collected.</p>
                <button disabled={booking} className="w-full rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60">{booking ? "Sending request..." : "Confirm booking request"}</button>
              </form>
            </div>
          </section>
        </div>
      )}
    </>
  );
};

export default AllSession;