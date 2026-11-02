import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import DashboardShell from "../../components/DashboardShell";
import AluminiNavbar from "../../components/AluminiNavbar";
import {
  formatSessionDate,
  getMentorshipConfig,
  getRequestError,
  MENTORSHIP_API,
} from "../../utils/mentorship";

const isUpcoming = (booking) =>
  new Date(`${booking.bookingDate}T${booking.bookingTime}:00`) > new Date();

const AlumniBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [meetingLinks, setMeetingLinks] = useState({});
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState("");

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get(`${MENTORSHIP_API}/api/bookings/alumni-bookings`, getMentorshipConfig());
      setBookings(data.data || []);
      setMeetingLinks(Object.fromEntries((data.data || []).map((booking) => [booking._id, booking.meetingLink || booking.sessionId?.meetingLink || ""])));
    } catch (error) {
      toast.error(getRequestError(error, "Unable to load booking requests."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => bookings.filter((booking) => {
    if (filter === "pending") return booking.bookingStatus === "Pending";
    if (filter === "upcoming") return ["Pending", "Confirmed"].includes(booking.bookingStatus) && isUpcoming(booking);
    return true;
  }), [bookings, filter]);

  const updateBooking = async (booking, bookingStatus, saveLink = false) => {
    setWorking(booking._id);
    try {
      const payload = { bookingStatus };
      if (saveLink || bookingStatus === "Confirmed") payload.meetingLink = meetingLinks[booking._id] || "";
      const { data } = await axios.patch(
        `${MENTORSHIP_API}/api/bookings/${booking._id}/status`,
        payload,
        getMentorshipConfig(),
      );
      setBookings((current) => current.map((item) => item._id === booking._id ? data.data : item));
      setMeetingLinks((current) => ({ ...current, [booking._id]: data.data.meetingLink || "" }));
      toast.success(saveLink ? "Meeting link updated." : `Booking ${bookingStatus.toLowerCase()}.`);
    } catch (error) {
      toast.error(getRequestError(error, "Unable to update this booking."));
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
      <AluminiNavbar />
      <DashboardShell role="alumni" pageTitle="Student booking requests">
        <Toaster position="top-right" />
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-slate-500">Review student requests, confirm sessions, and share meeting details.</p><a href="/alumni/sessions" className="w-fit rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Manage sessions</a></div>
          <div className="flex flex-wrap gap-2">{[["all", "All bookings"], ["pending", "Pending requests"], ["upcoming", "Upcoming sessions"]].map(([value, label]) => <button key={value} onClick={() => setFilter(value)} className={`rounded-xl px-4 py-2 text-sm font-semibold ${filter === value ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{label}</button>)}</div>
          {loading ? <div className="space-y-4">{[1, 2, 3].map((item) => <div key={item} className="h-40 animate-pulse rounded-2xl bg-slate-100" />)}</div>
            : filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center"><p className="font-semibold text-slate-800">No booking requests here</p><p className="mt-1 text-sm text-slate-500">New student bookings will appear on this page.</p></div>
              : <div className="space-y-4">{filtered.map((booking) => {
                const student = booking.studentId || {};
                const session = booking.sessionId || {};
                const active = ["Pending", "Confirmed"].includes(booking.bookingStatus);
                return (
                  <article key={booking._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 gap-3">
                        {student.profilePhoto ? <img src={student.profilePhoto} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" /> : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-50 font-semibold text-indigo-700">{(student.name || "S").charAt(0)}</div>}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-slate-900">{student.name || "Student"}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[booking.bookingStatus] || "bg-slate-100 text-slate-600"}`}>{booking.bookingStatus}</span></div>
                          <a href={`mailto:${student.email || ""}`} className="mt-1 inline-block text-sm text-sky-700 hover:underline">{student.email || "Email unavailable"}</a>
                          <p className="mt-3 text-sm font-semibold text-slate-800">{session.title || "Mentorship session"} <span className="font-normal text-slate-400">· {session.domain || "Mentorship"}</span></p>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span>{formatSessionDate(booking.bookingDate)} · {booking.bookingTime}</span><span>{session.duration || "—"} minutes</span><span>₹{Number(booking.amount).toLocaleString("en-IN")} informational</span></div>
                        </div>
                      </div>
                      {active && <div className="w-full space-y-3 lg:max-w-sm">
                        <label className="block text-xs font-semibold text-slate-600">Meeting link (optional)
                          <input className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-400" type="url" placeholder="https://" value={meetingLinks[booking._id] || ""} onChange={(event) => setMeetingLinks((current) => ({ ...current, [booking._id]: event.target.value }))} />
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {booking.bookingStatus === "Pending" ? <>
                            <button disabled={working === booking._id} onClick={() => updateBooking(booking, "Confirmed")} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">Accept request</button>
                            <button disabled={working === booking._id} onClick={() => updateBooking(booking, "Rejected")} className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50">Reject</button>
                          </> : <>
                            <button disabled={working === booking._id} onClick={() => updateBooking(booking, "Confirmed", true)} className="rounded-xl border border-sky-200 px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50 disabled:opacity-50">Save meeting link</button>
                            {!isUpcoming(booking) && <button disabled={working === booking._id} onClick={() => updateBooking(booking, "Completed")} className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">Mark completed</button>}
                          </>}
                        </div>
                      </div>}
                    </div>
                  </article>
                );
              })}</div>}
        </div>
      </DashboardShell>
    </>
  );
};

export default AlumniBookings;
