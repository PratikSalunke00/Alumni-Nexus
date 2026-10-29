import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import DashboardShell from "../../components/DashboardShell";
import toast, { Toaster } from "react-hot-toast";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const getToken = () => localStorage.getItem("token") || localStorage.getItem("userJwtToken") || "";

const AlumniInsightsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/alumni/insights/me`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setData(res.data.data);
    } catch (err) {
      toast.error("Failed to load insights");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInsights(); }, [fetchInsights]);

  const mentorshipMap = {};
  (data?.mentorshipByStatus || []).forEach(({ _id, count }) => { mentorshipMap[_id] = count; });

  const referralMap = {};
  (data?.referralsByStatus || []).forEach(({ _id, count }) => { referralMap[_id] = count; });

  return (
    <DashboardShell role="alumni" pageTitle="My insights">
      <Toaster position="top-right" />
      <div className="space-y-6">
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {[...Array(3)].map((_, i) => <div key={i} className="h-48 animate-pulse rounded-2xl bg-slate-100" />)}
          </div>
        ) : (
          <>
            {/* Mentorship overview */}
            <section className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-slate-800">Mentorship outcomes</h3>
                <div className="flex gap-3">
                  {["pending", "accepted", "declined"].map((s) => (
                    <div
                      key={s}
                      className={`flex-1 rounded-2xl p-4 text-center ${
                        s === "accepted" ? "bg-emerald-50" : s === "declined" ? "bg-rose-50" : "bg-amber-50"
                      }`}
                    >
                      <p className={`text-3xl font-bold ${
                        s === "accepted" ? "text-emerald-700" : s === "declined" ? "text-rose-700" : "text-amber-700"
                      }`}>
                        {mentorshipMap[s] || 0}
                      </p>
                      <p className="mt-1 text-xs capitalize text-slate-600">{s}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-slate-800">Referral outcomes</h3>
                <div className="flex gap-3">
                  {["pending", "approved", "rejected"].map((s) => (
                    <div
                      key={s}
                      className={`flex-1 rounded-2xl p-4 text-center ${
                        s === "approved" ? "bg-emerald-50" : s === "rejected" ? "bg-rose-50" : "bg-amber-50"
                      }`}
                    >
                      <p className={`text-3xl font-bold ${
                        s === "approved" ? "text-emerald-700" : s === "rejected" ? "text-rose-700" : "text-amber-700"
                      }`}>
                        {referralMap[s] || 0}
                      </p>
                      <p className="mt-1 text-xs capitalize text-slate-600">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* My Opportunities */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-slate-800">
                My opportunities ({data?.myOpportunities?.length || 0})
              </h3>
              {!data?.myOpportunities?.length ? (
                <p className="text-center text-sm text-slate-400 py-6">
                  You haven't posted any opportunities yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {data.myOpportunities.map((opp) => (
                    <div key={opp._id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-800">{opp.title}</p>
                        <p className="text-sm text-slate-500">{opp.type}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            opp.status === "open" ? "bg-emerald-100 text-emerald-700"
                              : opp.status === "closed" ? "bg-slate-100 text-slate-500"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {opp.status}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(opp.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
};

export default AlumniInsightsPage;
