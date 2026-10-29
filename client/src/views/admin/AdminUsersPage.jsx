import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import DashboardShell from "../../components/DashboardShell";
import toast, { Toaster } from "react-hot-toast";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const getToken = () => localStorage.getItem("token") || localStorage.getItem("userJwtToken") || "";

const ROLE_OPTIONS = ["", "student", "alumni", "admin"];
const STATUS_OPTIONS = ["", "active", "inactive", "verified", "pending"];

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ role: "", status: "", search: "" });
  const [actionLoading, setActionLoading] = useState({});

  const fetchUsers = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page,
          limit: 15,
          ...(filters.role && { role: filters.role }),
          ...(filters.status && { status: filters.status }),
          ...(filters.search && { search: filters.search }),
        });

        const res = await axios.get(`${API}/api/admin/users?${params}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        setUsers(res.data.data || []);
        setPagination(res.data.pagination || { total: 0, page: 1, pages: 1 });
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const handleSuspend = async (userId, currentlyActive) => {
    setActionLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      await axios.patch(
        `${API}/api/admin/users/${userId}/suspend`,
        { suspend: currentlyActive },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      toast.success(currentlyActive ? "User suspended" : "User reactivated");
      fetchUsers(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  return (
    <DashboardShell role="admin" pageTitle="User directory">
      <Toaster position="top-right" />
      <div className="space-y-5">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search name, email, company…"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            className="flex-1 min-w-[200px] rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
          <select
            value={filters.role}
            onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value }))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r || "All roles"}
              </option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s || "All statuses"}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-auto rounded-2xl border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Verification</th>
                <th className="px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-t border-slate-200">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-slate-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="border-t border-slate-200 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
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
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          u.isActive !== false
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {u.isActive !== false ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleSuspend(u._id, u.isActive !== false)}
                        disabled={!!actionLoading[u._id]}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                          u.isActive !== false
                            ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                            : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        } disabled:opacity-50`}
                      >
                        {actionLoading[u._id]
                          ? "…"
                          : u.isActive !== false
                            ? "Suspend"
                            : "Reactivate"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>
              {pagination.total} users · page {pagination.page} of {pagination.pages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchUsers(pagination.page - 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40"
              >
                ← Prev
              </button>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchUsers(pagination.page + 1)}
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

export default AdminUsersPage;
