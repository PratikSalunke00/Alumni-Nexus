import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import DashboardShell from "../../components/DashboardShell";
import toast, { Toaster } from "react-hot-toast";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const getToken = () => localStorage.getItem("token") || localStorage.getItem("userJwtToken") || "";

const AlumniMentorshipPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [filter, setFilter] = useState("pending");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/mentorship-requests`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setRequests(res.data.data || []);
    } catch (err) {
      toast.error("Failed to load mentorship requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleAction = async (id, status) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await axios.patch(
        `${API}/api/mentorship-requests/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      toast.success(`Request ${status}`);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  return (
    <DashboardShell role="alumni" pageTitle="Mentorship requests">
      <Toaster position="top-right" />
      <div className="space-y-5">
        {/* Filter tabs */}
        <div className="flex gap-2">
          {["all", "pending", "accepted", "declined"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                filter === s
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
              <span className="ml-1.5 text-xs opacity-70">
                {s === "all" ? requests.length : requests.filter((r) => r.status === s).length}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 py-16 text-center text-slate-400">
            No {filter === "all" ? "" : filter} requests
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((r) => (
              <div key={r._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800">{r.student?.name || "Student"}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          r.status === "accepted"
                            ? "bg-emerald-100 text-emerald-700"
                            : r.status === "declined"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-700">Topic: {r.topic}</p>
                    {r.message && (
                      <p className="mt-2 text-sm text-slate-600 bg-slate-50 rounded-xl px-3 py-2">{r.message}</p>
                    )}
                    {r.availableTime && (
                      <p className="mt-2 text-xs text-slate-400">Available: {r.availableTime}</p>
                    )}
                    <p className="mt-2 text-xs text-slate-400">
                      {new Date(r.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {r.status === "pending" && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleAction(r._id, "accepted")}
                        disabled={!!actionLoading[r._id]}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {actionLoading[r._id] ? "…" : "Accept"}
                      </button>
                      <button
                        onClick={() => handleAction(r._id, "declined")}
                        disabled={!!actionLoading[r._id]}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
};

export default AlumniMentorshipPage;
