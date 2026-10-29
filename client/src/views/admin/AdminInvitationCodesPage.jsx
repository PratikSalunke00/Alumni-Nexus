import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import DashboardShell from "../../components/DashboardShell";
import toast, { Toaster } from "react-hot-toast";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const getToken = () => localStorage.getItem("token") || localStorage.getItem("userJwtToken") || "";

const AdminInvitationCodesPage = () => {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ code: "", maxUses: 100, expiresAt: "", allowedRoles: ["student", "alumni"] });
  const [showForm, setShowForm] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/admin/invitation-codes`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setCodes(res.data.data || []);
    } catch (err) {
      toast.error("Failed to load invitation codes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.code.trim()) return toast.error("Code is required");
    setCreating(true);
    try {
      const res = await axios.post(
        `${API}/api/admin/invitation-codes`,
        {
          code: form.code.trim(),
          maxUses: Number(form.maxUses),
          expiresAt: form.expiresAt || null,
          allowedRoles: form.allowedRoles,
        },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      toast.success(`Code created: ${res.data.data?.code || form.code}`);
      setShowForm(false);
      setForm({ code: "", maxUses: 100, expiresAt: "", allowedRoles: ["student", "alumni"] });
      fetchCodes();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create code");
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (id, currentActive) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await axios.patch(
        `${API}/api/admin/invitation-codes/${id}`,
        { active: !currentActive },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      toast.success(currentActive ? "Code deactivated" : "Code activated");
      fetchCodes();
    } catch (err) {
      toast.error("Failed to update code");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  return (
    <DashboardShell role="admin" pageTitle="Invitation codes">
      <Toaster position="top-right" />
      <div className="space-y-5">
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            {showForm ? "Cancel" : "+ New code"}
          </button>
        </div>

        {/* Create Form */}
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="rounded-2xl border border-sky-100 bg-sky-50 p-5 space-y-4"
          >
            <h3 className="text-lg font-semibold text-slate-800">Create invitation code</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Code (4–64 chars)</label>
                <input
                  required
                  minLength={4}
                  maxLength={64}
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  placeholder="e.g. BATCH2025"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Max uses</label>
                <input
                  type="number"
                  min={1}
                  value={form.maxUses}
                  onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Expires at (optional)</label>
                <input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Allowed roles</label>
                <div className="flex gap-3 pt-2">
                  {["student", "alumni"].map((r) => (
                    <label key={r} className="flex items-center gap-1.5 text-sm capitalize">
                      <input
                        type="checkbox"
                        checked={form.allowedRoles.includes(r)}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            allowedRoles: e.target.checked
                              ? [...f.allowedRoles, r]
                              : f.allowedRoles.filter((x) => x !== r),
                          }))
                        }
                      />
                      {r}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={creating}
              className="rounded-xl bg-sky-600 px-5 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create code"}
            </button>
          </form>
        )}

        {/* Codes list */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : codes.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 py-16 text-center text-slate-400">
            No invitation codes yet. Create one above.
          </div>
        ) : (
          <div className="space-y-3">
            {codes.map((c) => (
              <div
                key={c._id}
                className={`rounded-2xl border p-4 ${c.active ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50 opacity-60"}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-base font-semibold text-slate-800">
                        {c.active ? "●●●●●●" : "○○○○○○"} <span className="text-slate-400 text-sm">(code hash hidden for security)</span>
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}
                      >
                        {c.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      Uses: {c.usedCount} / {c.maxUses} · Roles: {c.allowedRoles.join(", ")}
                      {c.expiresAt && ` · Expires: ${new Date(c.expiresAt).toLocaleDateString()}`}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">Created {new Date(c.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => toggleActive(c._id, c.active)}
                    disabled={!!actionLoading[c._id]}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      c.active
                        ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                        : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                    } disabled:opacity-50`}
                  >
                    {actionLoading[c._id] ? "…" : c.active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
};

export default AdminInvitationCodesPage;
