import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import DashboardShell from "../../components/DashboardShell";
import toast, { Toaster } from "react-hot-toast";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const getToken = () => localStorage.getItem("token") || localStorage.getItem("userJwtToken") || "";

const STATUS_OPTIONS = ["", "open", "closed", "draft"];

const AdminOpportunitiesPage = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [actionLoading, setActionLoading] = useState({});

  const fetchOpps = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page, limit: 15, ...(filterStatus && { status: filterStatus }) });
        const res = await axios.get(`${API}/api/admin/opportunities?${params}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        setOpportunities(res.data.data || []);
        setPagination(res.data.pagination || { total: 0, page: 1, pages: 1 });
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load opportunities");
      } finally {
        setLoading(false);
      }
    },
    [filterStatus]
  );

  useEffect(() => { fetchOpps(1); }, [fetchOpps]);

  const handleStatusChange = async (oppId, newStatus) => {
    setActionLoading((prev) => ({ ...prev, [oppId]: true }));
    try {
      await axios.patch(
        `${API}/api/admin/opportunities/${oppId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      toast.success(`Opportunity marked as ${newStatus}`);
      fetchOpps(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setActionLoading((prev) => ({ ...prev, [oppId]: false }));
    }
  };

  return (
    <DashboardShell role="admin" pageTitle="Opportunity moderation">
      <Toaster position="top-right" />
      <div className="space-y-5">
        {/* Filter */}
        <div className="flex gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s || "All statuses"}</option>
            ))}
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : opportunities.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 py-16 text-center text-slate-400">
            No opportunities found
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {opportunities.map((opp) => (
              <div key={opp._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-800">{opp.title}</p>
                    <p className="text-sm text-slate-500">{opp.company} · {opp.type}</p>
                    {opp.postedBy && (
                      <p className="mt-1 text-xs text-slate-400">
                        Posted by {opp.postedBy.name} ({opp.postedBy.role})
                      </p>
                    )}
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(opp.createdAt).toLocaleDateString()}
                    </p>
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

                {/* Actions */}
                <div className="mt-3 flex gap-2">
                  {opp.status !== "open" && (
                    <button
                      onClick={() => handleStatusChange(opp._id, "open")}
                      disabled={!!actionLoading[opp._id]}
                      className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                    >
                      Open
                    </button>
                  )}
                  {opp.status !== "closed" && (
                    <button
                      onClick={() => handleStatusChange(opp._id, "closed")}
                      disabled={!!actionLoading[opp._id]}
                      className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                    >
                      Close
                    </button>
                  )}
                  {opp.status !== "draft" && (
                    <button
                      onClick={() => handleStatusChange(opp._id, "draft")}
                      disabled={!!actionLoading[opp._id]}
                      className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                    >
                      Draft
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>{pagination.total} total · page {pagination.page} of {pagination.pages}</span>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchOpps(pagination.page - 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40"
              >
                ← Prev
              </button>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchOpps(pagination.page + 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
};

export default AdminOpportunitiesPage;
