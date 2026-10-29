import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import DashboardShell from "../../components/DashboardShell";
import StatCard from "../../components/StatCard";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const getToken = () =>
  localStorage.getItem("token") || localStorage.getItem("userJwtToken") || "";

const colorMap = { student: "indigo", alumni: "emerald", admin: "sky" };

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      const [statsRes, usersRes, oppsRes] = await Promise.all([
        axios.get(`${API}/api/admin/stats`, { headers }),
        axios.get(`${API}/api/admin/users?limit=8`, { headers }),
        axios.get(`${API}/api/admin/opportunities?limit=5`, { headers }),
      ]);
      setStats(statsRes.data.data);
      setUsers(usersRes.data.data || []);
      setOpportunities(oppsRes.data.data || []);
    } catch (err) {
      console.error("fetchAll error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const statCards = stats
    ? [
        { label: "Total users", value: stats.totalUsers, trend: "+", icon: "👥" },
        { label: "Alumni", value: stats.totalAlumni, trend: "+", icon: "🎓" },
        { label: "Students", value: stats.totalStudents, trend: "+", icon: "📚" },
        { label: "Pending verifications", value: stats.pendingVerifications, trend: "!", icon: "⏳" },
        { label: "Opportunities", value: stats.totalOpportunities, trend: "+", icon: "💼" },
        { label: "Open roles", value: stats.pendingOpportunities, trend: "+", icon: "🟢" },
      ]
    : [];

  return (
    <DashboardShell role="admin" pageTitle="Administration overview">
      <div className="space-y-6">
        {/* STATS */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : (
          <section className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {statCards.map((s, i) => (
              <StatCard
                key={s.label}
                label={s.label}
                value={s.value}
                icon={s.icon}
                accent={["indigo", "emerald", "sky", "amber", "rose", "violet"][i % 6]}
              />
            ))}
          </section>
        )}

        {/* USER TABLE */}
        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">Recent users</h3>
              <a href="/admin/users" className="text-sm font-medium text-sky-600 hover:underline">
                View all
              </a>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            ) : (
              <div className="overflow-auto rounded-2xl border border-slate-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} className="border-t border-slate-200 hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                        <td className="px-4 py-3 capitalize text-slate-600">{u.role}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              u.verificationStatus === "verified"
                                ? "bg-emerald-100 text-emerald-700"
                                : u.verificationStatus === "pending"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {u.verificationStatus || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {!loading && users.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* OPPORTUNITY MODERATION */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">Opportunity moderation</h3>
              <a href="/admin/opportunities" className="text-sm font-medium text-sky-600 hover:underline">
                Review queue
              </a>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {opportunities.map((opp) => (
                  <div key={opp._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-800">{opp.title}</p>
                        <p className="text-sm text-slate-500">{opp.company}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                          opp.status === "open"
                            ? "bg-emerald-100 text-emerald-700"
                            : opp.status === "closed"
                              ? "bg-slate-100 text-slate-600"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {opp.status}
                      </span>
                    </div>
                  </div>
                ))}
                {!loading && opportunities.length === 0 && (
                  <p className="py-4 text-center text-sm text-slate-400">No opportunities yet</p>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
};

export default AdminDashboard;
