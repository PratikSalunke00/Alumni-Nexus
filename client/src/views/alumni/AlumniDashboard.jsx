import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DashboardShell from "../../components/DashboardShell";
import StatCard from "../../components/StatCard";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const getToken = () => localStorage.getItem("token") || localStorage.getItem("userJwtToken") || "";

const AlumniDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [mentorship, setMentorship] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  const name = (() => {
    try {
      const u = JSON.parse(localStorage.getItem("userData") || "{}");
      return localStorage.getItem("name") || u.name || "Alumni";
    } catch { return "Alumni"; }
  })();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      const [statsRes, mentorRes, refRes] = await Promise.all([
        axios.get(`${API}/api/alumni/stats/me`, { headers }),
        axios.get(`${API}/api/mentorship-requests`, { headers }),
        axios.get(`${API}/api/referrals`, { headers }),
      ]);
      setStats(statsRes.data.data);
      setMentorship((mentorRes.data.data || []).filter((r) => r.status === "pending").slice(0, 4));
      setReferrals((refRes.data.data || []).filter((r) => r.status === "pending").slice(0, 4));
    } catch (err) {
      console.error("dashboard error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const statCards = stats
    ? [
        { label: "Opportunities posted", value: stats.totalOpportunities, icon: "💼" },
        { label: "Pending referrals", value: stats.pendingReferrals, icon: "🔗" },
        { label: "Pending mentorship", value: stats.pendingMentorship, icon: "🤝" },
        { label: "Referrals approved", value: stats.resolvedReferrals, icon: "✅" },
      ]
    : [];

  return (
    <DashboardShell role="alumni" pageTitle={`Welcome back, ${name}`}>
      <div className="space-y-6">
        {/* Verification Banner */}
        <section className="rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-sky-50 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">Network status</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900">You're connected to your college network</h3>
              <p className="mt-1 text-slate-600 text-sm max-w-xl">
                Students can find your profile for mentorship requests, referrals, and career guidance.
              </p>
            </div>
            <button
              onClick={() => navigate("/alumni/opportunities")}
              className="shrink-0 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              + Post opportunity
            </button>
          </div>
        </section>

        {/* Stats */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />)}
          </div>
        ) : (
          <section className="grid gap-4 md:grid-cols-4">
            {statCards.map((s, i) => (
              <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon}
                accent={["emerald", "sky", "amber", "indigo"][i % 4]} />
            ))}
          </section>
        )}

        {/* Pending Requests */}
        <section className="grid gap-6 xl:grid-cols-2">
          {/* Referrals */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Pending referral requests</h3>
              <button
                onClick={() => navigate("/alumni/referrals")}
                className="text-sm font-medium text-emerald-600 hover:underline"
              >
                Review all →
              </button>
            </div>
            {loading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div>
            ) : referrals.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">No pending referral requests</p>
            ) : (
              <div className="space-y-3">
                {referrals.map((r) => (
                  <div key={r._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-800">{r.student?.name || "Student"}</p>
                        <p className="text-sm text-slate-500">{r.opportunity?.title} at {r.opportunity?.company}</p>
                      </div>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Pending</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mentorship */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Mentorship requests</h3>
              <button
                onClick={() => navigate("/alumni/mentorship")}
                className="text-sm font-medium text-emerald-600 hover:underline"
              >
                View all →
              </button>
            </div>
            {loading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div>
            ) : mentorship.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">No pending mentorship requests</p>
            ) : (
              <div className="space-y-3">
                {mentorship.map((r) => (
                  <div key={r._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-800">{r.student?.name || "Student"}</p>
                        <p className="text-sm text-slate-500">{r.topic}</p>
                      </div>
                      <span className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
};

export default AlumniDashboard;
