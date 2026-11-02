import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import DashboardShell from "../../components/DashboardShell";
import StudentNavbar from "../../components/StudentNavbar";
import {
  formatSessionDate,
  getMentorshipConfig,
  getRequestError,
  MENTORSHIP_API,
} from "../../utils/mentorship";

const isUpcoming = (booking) =>
  new Date(`${booking.bookingDate}T${booking.bookingTime}:00`) > new Date();

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [working, setWorking] = useState("");

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get(`${MENTORSHIP_API}/api/bookings/my-bookings`, getMentorshipConfig());
      setBookings(data.data || []);
    } catch (error) {
      toast.error(getRequestError(error, "Unable to load your bookings."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => bookings.filter((booking) => {
    if (filter === "upcoming") return ["Pending", "Confirmed"].includes(booking.bookingStatus) && isUpcoming(booking);
    if (filter === "completed") return booking.bookingStatus === "Completed";
    if (filter === "history") return ["Rejected", "Cancelled", "Completed"].includes(booking.bookingStatus) || !isUpcoming(booking);
    return true;
  }), [bookings, filter]);

  const cancel = async (booking) => {
    if (!window.confirm("Cancel this session booking?")) return;
    setWorking(booking._id);
    try {
      const { data } = await axios.patch(`${MENTORSHIP_API}/api/bookings/${booking._id}/cancel`, {}, getMentorshipConfig());
      setBookings((current) => current.map((item) => item._id === booking._id ? data.data : item));
      setSelected((current) => current?._id === booking._id ? data.data : current);
      toast.success("Booking cancelled.");
    } catch (error) {
      toast.error(getRequestError(error, "Unable to cancel this booking."));
    } finally {
      setWorking("");
    }
  };

  const statusClass = {
    Pending: "bg-amber-50 text-amber-700",
    Confirmed: "bg-emerald-50 text-emerald-700",
    Rejected: "bg-rose-50 text-rose-700",
    Cancelled: "bg-slate-100 text-slate-600",
    Completed: "bg-indigo-50 text-indigo-700",
  };

  return (
    <>
      <StudentNavbar />
      <DashboardShell role="student" pageTitle="My session bookings">
        <Toaster position="top-right" />
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">Review booking requests, confirmed sessions, and your mentorship history.</p>
            <a href="/student/sessions" className="w-fit rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700">Browse sessions</a>
          </div>
          <div className="flex flex-wrap gap-2">
            {[["all", "All bookings"], ["upcoming", "Upcoming"], ["completed", "Completed"], ["history", "History"]].map(([value, label]) => (
              <button key={value} onClick={() => setFilter(value)} className={`rounded-xl px-4 py-2 text-sm font-semibold ${filter === value ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{label}</button>
            ))}
          </div>
          {loading ? <div className="space-y-4">{[1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse rounded-2xl bg-slate-100" />)}</div>
            : filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center"><p className="font-semibold text-slate-800">No bookings in this view</p><p className="mt-1 text-sm text-slate-500">Your session bookings and status updates will show here.</p></div>
              : <div className="space-y-4">{filtered.map((booking) => {
                const session = booking.sessionId || {};
                const alumni = booking.alumniId || {};
                const canCancel = ["Pending", "Confirmed"].includes(booking.bookingStatus) && isUpcoming(booking);
                const meetingLink = booking.meetingLink || session.meetingLink;
                return (
                  <article key={booking._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 gap-4">
                        {alumni.profilePhoto ? <img src={alumni.profilePhoto} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" /> : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky-100 font-semibold text-sky-700">{(alumni.name || "A").charAt(0)}</div>}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-slate-900">{session.title || "Mentorship session"}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[booking.bookingStatus] || "bg-slate-100 text-slate-600"}`}>{booking.bookingStatus}</span></div>
                          <p className="mt-1 text-sm text-slate-600">{alumni.name || "Alumni"}{alumni.jobTitle ? ` · ${alumni.jobTitle}` : ""}{alumni.company ? ` at ${alumni.company}` : ""}</p>
                          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span>{session.domain || "Mentorship"}</span><span>{formatSessionDate(booking.bookingDate)} · {booking.bookingTime}</span><span>{session.duration || "—"} minutes</span><span>₹{Number(booking.amount).toLocaleString("en-IN")} informational</span></div>
                          {booking.bookingStatus === "Confirmed" && meetingLink && <a className="mt-3 inline-block text-sm font-semibold text-sky-700 hover:underline" href={meetingLink} target="_blank" rel="noreferrer">Open meeting link ↗</a>}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2 sm:flex-col">
                        <button onClick={() => setSelected(booking)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">View details</button>
                        {canCancel && <button disabled={working === booking._id} onClick={() => cancel(booking)} className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50">{working === booking._id ? "Cancelling..." : "Cancel booking"}</button>}
                      </div>
                    </div>
                  </article>
                );
              })}</div>}
        </div>
      </DashboardShell>
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="booking-detail-title" className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-widest text-sky-600">Booking details</p><h2 id="booking-detail-title" className="mt-1 text-xl font-bold text-slate-900">{selected.sessionId?.title || "Mentorship session"}</h2></div><button onClick={() => setSelected(null)} aria-label="Close details" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">✕</button></div>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">{[
              ["Alumni", selected.alumniId?.name || "Alumni"],
              ["Professional domain", selected.sessionId?.domain || "—"],
              ["Booking date", formatSessionDate(selected.bookingDate)],
              ["Booking time", selected.bookingTime],
              ["Duration", `${selected.sessionId?.duration || "—"} minutes`],
              ["Price (informational)", `₹${Number(selected.amount).toLocaleString("en-IN")}`],
              ["Status", selected.bookingStatus],
            ].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{value}</dd></div>)}</dl>
            {selected.bookingStatus === "Confirmed" && (selected.meetingLink || selected.sessionId?.meetingLink) && <a href={selected.meetingLink || selected.sessionId.meetingLink} target="_blank" rel="noreferrer" className="mt-5 inline-block text-sm font-semibold text-sky-700 hover:underline">Open meeting link ↗</a>}
          </section>
        </div>
      )}
    </>
  );
};

export default MyBookings;
