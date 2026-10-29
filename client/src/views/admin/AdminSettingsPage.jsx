import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import DashboardShell from "../../components/DashboardShell";
import toast, { Toaster } from "react-hot-toast";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const getToken = () => localStorage.getItem("token") || localStorage.getItem("userJwtToken") || "";

const AdminSettingsPage = () => {
  const [college, setCollege] = useState(null);
  const [form, setForm] = useState({ name: "", address: "", website: "", description: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/admin/college-settings`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const c = res.data.data;
      setCollege(c);
      setForm({ name: c.name || "", address: c.address || "", website: c.website || "", description: c.description || "" });
    } catch (err) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`${API}/api/admin/college-settings`, form, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      toast.success("College settings updated");
      fetchSettings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) {
      return toast.error("Passwords do not match");
    }
    if (pwForm.newPassword.length < 8) {
      return toast.error("Password must be at least 8 characters");
    }
    setPwSaving(true);
    try {
      await axios.post(
        `${API}/api/auth/change-password`,
        { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      toast.success("Password changed successfully");
      setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <DashboardShell role="admin" pageTitle="Admin settings">
      <Toaster position="top-right" />
      <div className="space-y-8 max-w-2xl">
        {/* College Info */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">College information</h3>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">College name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Address</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Website</label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                  placeholder="https://"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  maxLength={2000}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </form>
          )}
        </section>

        {/* Change Password */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">Change password</h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Current password</label>
              <input
                type="password"
                required
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">New password</label>
              <input
                type="password"
                required
                minLength={8}
                value={pwForm.newPassword}
                onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Confirm new password</label>
              <input
                type="password"
                required
                value={pwForm.confirm}
                onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>
            <button
              type="submit"
              disabled={pwSaving}
              className="rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
            >
              {pwSaving ? "Changing…" : "Change password"}
            </button>
          </form>
        </section>
      </div>
    </DashboardShell>
  );
};

export default AdminSettingsPage;
