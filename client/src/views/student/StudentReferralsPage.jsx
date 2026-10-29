import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import DashboardShell from "../../components/DashboardShell";
import toast, { Toaster } from "react-hot-toast";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const getToken = () => localStorage.getItem("token") || localStorage.getItem("userJwtToken") || "";

const StudentReferralsPage = () => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReferrals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/referrals`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setReferrals(res.data.data || []);
    } catch (err) {
      toast.error("Failed to load referrals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReferrals(); }, [fetchReferrals]);

  const statusConfig = {
    pending: { label: "Under review", cls: "bg-amber-100 text-amber-700" },
    approved: { label: "Approved ✓", cls: "bg-emerald-100 text-emerald-700" },
    rejected: { label: "Declined", cls: "bg-rose-100 text-rose-700" },
  };

  return (
    <DashboardShell role="student" pageTitle="My referral requests">
      <Toaster position="top-right" />
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Track referral requests from alumni in your network</p>
          <a href="/student/alumni" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
            + Request referral
          </a>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />)}
          </div>
        ) : referrals.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 py-16 text-center">
            <p className="text-slate-400">No referral requests yet</p>
            <a href="/student/alumni" className="mt-3 inline-block text-sm font-medium text-emerald-600 hover:underline">
              Find alumni to request referrals →
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {referrals.map((r) => (
              <div key={r._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-800">
                        {r.opportunity?.title || "Opportunity"}
                      </p>
                      <span className="text-slate-400 text-sm">at {r.opportunity?.company}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      Requested from: <span className="font-medium text-slate-700">{r.alumni?.name || "Alumni"}</span>
                      {r.alumni?.company && ` @ ${r.alumni.company}`}
                    </p>
                    {r.message && <p className="mt-2 text-sm text-slate-600">{r.message}</p>}
                    <p className="mt-2 text-xs text-slate-400">{new Date(r.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${statusConfig[r.status]?.cls || "bg-slate-100 text-slate-600"}`}>
                    {statusConfig[r.status]?.label || r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
};

export default StudentReferralsPage;
