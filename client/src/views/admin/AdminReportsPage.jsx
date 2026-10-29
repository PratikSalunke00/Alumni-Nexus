import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import DashboardShell from "../../components/DashboardShell";
import toast, { Toaster } from "react-hot-toast";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const getToken = () => localStorage.getItem("token") || localStorage.getItem("userJwtToken") || "";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const SimpleBar = ({ label, value, maxValue, color = "sky" }) => {
  const pct = maxValue ? Math.round((value / maxValue) * 100) : 0;
  const colorMap = {
    sky: "bg-sky-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    indigo: "bg-indigo-500",
  };
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-xs text-slate-500">{label}</span>
      <div className="flex-1 h-4 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full ${colorMap[color] || "bg-sky-500"} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right text-xs font-medium text-slate-700">{value}</span>
    </div>
  );
};

const AdminReportsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/admin/reports`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setData(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  // Aggregate user growth by month
  const growthByMonth = {};
  (data?.userGrowth || []).forEach(({ _id, count }) => {
    const key = `${MONTH_NAMES[_id.month - 1]} ${_id.year}`;
    growthByMonth[key] = (growthByMonth[key] || 0) + count;
  });
  const growthEntries = Object.entries(growthByMonth);
  const maxGrowth = Math.max(...growthEntries.map(([, v]) => v), 1);

  const verificationMap = {};
  (data?.verificationFunnel || []).forEach(({ _id, count }) => { verificationMap[_id] = count; });

  const mentorshipMap = {};
  (data?.mentorshipStats || []).forEach(({ _id, count }) => { mentorshipMap[_id] = count; });

  const referralMap = {};
  (data?.referralStats || []).forEach(({ _id, count }) => { referralMap[_id] = count; });

  const oppTypeMap = {};
  (data?.opportunityStats || []).forEach(({ _id, count }) => { oppTypeMap[_id] = count; });
  const maxOpp = Math.max(...Object.values(oppTypeMap), 1);

  if (loading) {
    return (
      <DashboardShell role="admin" pageTitle="Network reports">
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="admin" pageTitle="Network reports">
      <Toaster position="top-right" />
      <div className="grid gap-6 md:grid-cols-2">
        {/* User growth */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">User growth (last 6 months)</h3>
          <div className="space-y-2">
            {growthEntries.length === 0 ? (
              <p className="text-sm text-slate-400">No data yet</p>
            ) : (
              growthEntries.map(([label, value]) => (
                <SimpleBar key={label} label={label} value={value} maxValue={maxGrowth} color="indigo" />
              ))
            )}
          </div>
        </div>

        {/* Verification funnel */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">Verification funnel</h3>
          <div className="space-y-4">
            {["pending", "approved", "rejected"].map((status) => {
              const val = verificationMap[status] || 0;
              const total = Object.values(verificationMap).reduce((a, b) => a + b, 0) || 1;
              return (
                <div key={status}>
                  <div className="flex justify-between mb-1">
                    <span className="capitalize text-sm text-slate-600">{status}</span>
                    <span className="text-sm font-medium text-slate-800">
                      {val} <span className="text-slate-400">({Math.round((val / total) * 100)}%)</span>
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${status === "approved" ? "bg-emerald-500" : status === "rejected" ? "bg-rose-500" : "bg-amber-400"}`}
                      style={{ width: `${Math.round((val / total) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mentorship stats */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">Mentorship requests</h3>
          <div className="flex gap-4">
            {["pending", "accepted", "declined"].map((s) => (
              <div
                key={s}
                className={`flex-1 rounded-2xl p-4 text-center ${
                  s === "accepted" ? "bg-emerald-50" : s === "declined" ? "bg-rose-50" : "bg-amber-50"
                }`}
              >
                <p className={`text-2xl font-bold ${s === "accepted" ? "text-emerald-700" : s === "declined" ? "text-rose-700" : "text-amber-700"}`}>
                  {mentorshipMap[s] || 0}
                </p>
                <p className="mt-1 text-xs capitalize text-slate-600">{s}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Opportunity types */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">Opportunities by type</h3>
          <div className="space-y-2">
            {Object.entries(oppTypeMap).length === 0 ? (
              <p className="text-sm text-slate-400">No opportunities yet</p>
            ) : (
              Object.entries(oppTypeMap).map(([type, count]) => (
                <SimpleBar key={type} label={type} value={count} maxValue={maxOpp} color="sky" />
              ))
            )}
          </div>
        </div>

        {/* Referral stats */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">Referral outcomes</h3>
          <div className="flex gap-4">
            {["pending", "approved", "rejected"].map((s) => (
              <div
                key={s}
                className={`flex-1 rounded-2xl p-4 text-center ${
                  s === "approved" ? "bg-emerald-50" : s === "rejected" ? "bg-rose-50" : "bg-amber-50"
                }`}
              >
                <p className={`text-2xl font-bold ${s === "approved" ? "text-emerald-700" : s === "rejected" ? "text-rose-700" : "text-amber-700"}`}>
                  {referralMap[s] || 0}
                </p>
                <p className="mt-1 text-xs capitalize text-slate-600">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
};

export default AdminReportsPage;
