import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import DashboardShell from "../../components/DashboardShell";
import AluminiNavbar from "../../components/AluminiNavbar";
import {
  formatSessionDate,
  getMentorshipConfig,
  getRequestError,
  MENTORSHIP_API,
} from "../../utils/mentorship";

const MySessions = () => {
  const [sessions, setSessions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState("");

  const load = useCallback(async () => {
    try {
      const [sessionResponse, bookingResponse] = await Promise.all([
        axios.get(`${MENTORSHIP_API}/api/sessions/my-sessions`, getMentorshipConfig()),
        axios.get(`${MENTORSHIP_API}/api/bookings/alumni-bookings`, getMentorshipConfig()),
      ]);
      setSessions(sessionResponse.data.data || []);
      setBookings(bookingResponse.data.data || []);
    } catch (error) {
      toast.error(getRequestError(error, "Unable to load your sessions."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (session) => {
    setWorking(session._id);
    const status = session.status === "Published" ? "Unpublished" : "Published";
    try {
      const { data } = await axios.patch(
        `${MENTORSHIP_API}/api/sessions/${session._id}/status`,
        { status },
        getMentorshipConfig(),
      );
      setSessions((current) => current.map((item) => item._id === session._id ? { ...item, status: data.data.status } : item));
      toast.success(`Session ${status.toLowerCase()}.`);
    } catch (error) {
      toast.error(getRequestError(error, "Unable to change session visibility."));
    } finally {
      setWorking("");
    }
  };

  const removeSession = async (session) => {
    if (!window.confirm(`Delete "${session.title}"? Sessions with booking history cannot be deleted.`)) return;
    setWorking(session._id);
    try {
      await axios.delete(`${MENTORSHIP_API}/api/sessions/${session._id}`, getMentorshipConfig());
      setSessions((current) => current.filter((item) => item._id !== session._id));
      setBookings((current) => current.filter((booking) => booking.sessionId?._id !== session._id));
      toast.success("Session deleted.");
    } catch (error) {
      toast.error(getRequestError(error, "Unable to delete the session."));
    } finally {
      setWorking("");
    }
  };

  return (
    <>
      <AluminiNavbar />
      <DashboardShell role="alumni" pageTitle="My mentorship sessions">
        <Toaster position="top-right" />
        <div className="space-y-5">
          <section className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-sky-700 to-indigo-700 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">Mentorship studio</p><h1 className="mt-1 text-2xl font-bold">Manage your sessions</h1><p className="mt-1 text-sm text-sky-50">Publish opportunities for students and manage booking requests.</p></div>
            <Link to="/alumni/sessions/create" className="w-fit rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-sky-700 hover:bg-sky-50">+ Create session</Link>
          </section>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Total sessions", sessions.length],
              ["Published", sessions.filter((session) => session.status === "Published").length],
              ["Booking requests", bookings.length],
            ].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-900">{value}</p></div>)}
          </div>

          {loading ? <div className="space-y-4">{[1, 2, 3].map((item) => <div key={item} className="h-40 animate-pulse rounded-2xl bg-slate-100" />)}</div>
            : sessions.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center"><p className="font-semibold text-slate-800">You haven't created a session yet</p><Link to="/alumni/sessions/create" className="mt-3 inline-block text-sm font-semibold text-sky-700 hover:underline">Create your first session</Link></div>
              : <div className="space-y-4">{sessions.map((session) => {
                const sessionBookings = bookings.filter((booking) => booking.sessionId?._id === session._id);
                return (
                  <article key={session._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold text-slate-900">{session.title}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${session.status === "Published" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{session.status}</span><span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">{session.domain}</span></div>
                        <p className="mt-2 line-clamp-2 text-sm text-slate-600">{session.description}</p>
                        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500"><span>{formatSessionDate(session.availableDate)} · {session.availableTime}</span><span>{session.duration} min</span><span>₹{Number(session.price).toLocaleString("en-IN")} informational</span><span>{sessionBookings.length} booking{sessionBookings.length === 1 ? "" : "s"}</span></div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link to={`/alumni/sessions/${session._id}/edit`} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Edit</Link>
                        <button disabled={working === session._id} onClick={() => changeStatus(session)} className="rounded-xl bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100 disabled:opacity-50">{session.status === "Published" ? "Unpublish" : "Publish"}</button>
                        <button disabled={working === session._id} onClick={() => removeSession(session)} className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50">Delete</button>
                      </div>
                    </div>
                    <details className="mt-5 border-t border-slate-100 pt-4">
                      <summary className="cursor-pointer text-sm font-semibold text-slate-700">View students and booking statuses ({sessionBookings.length})</summary>
                      {sessionBookings.length ? <div className="mt-3 divide-y divide-slate-100">{sessionBookings.map((booking) => <div key={booking._id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                        <div className="flex items-center gap-3">
                          {booking.studentId?.profilePhoto ? <img src={booking.studentId.profilePhoto} alt="" className="h-9 w-9 rounded-full object-cover" /> : <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-700">{(booking.studentId?.name || "S").charAt(0)}</div>}
                          <div><p className="text-sm font-semibold text-slate-800">{booking.studentId?.name || "Student"}</p><p className="text-xs text-slate-500">{booking.studentId?.email || ""}</p></div>
                        </div>
                        <span className="text-xs text-slate-500">{formatSessionDate(booking.bookingDate)} · {booking.bookingTime}</span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{booking.bookingStatus}</span>
                      </div>)}</div> : <p className="mt-3 text-sm text-slate-500">No students have booked this session yet.</p>}
                    </details>
                  </article>
                );
              })}</div>}
          <div className="flex justify-end"><Link to="/alumni/bookings" className="text-sm font-semibold text-sky-700 hover:underline">Manage booking requests →</Link></div>
        </div>
      </DashboardShell>
    </>
  );
};

export default MySessions;
