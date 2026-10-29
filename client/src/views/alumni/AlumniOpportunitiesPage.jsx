import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import DashboardShell from "../../components/DashboardShell";
import toast, { Toaster } from "react-hot-toast";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const getToken = () => localStorage.getItem("token") || localStorage.getItem("userJwtToken") || "";

const TYPES = ["Internship", "Full Time", "Part Time", "Freelance", "Campus"];

const AlumniOpportunitiesPage = () => {
  const [myPostings, setMyPostings] = useState([]);
  const [loadingPostings, setLoadingPostings] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "", company: "", type: "Internship", location: "Remote",
    description: "", salary: "", remote: false, tags: "",
  });

  const fetchMyPostings = useCallback(async () => {
    setLoadingPostings(true);
    try {
      const res = await axios.get(`${API}/api/opportunities`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      // Show only the alumni's own postings
      const userId = (() => {
        try { return JSON.parse(localStorage.getItem("userData") || "{}").id; } catch { return null; }
      })();
      const all = res.data.data || [];
      setMyPostings(userId ? all.filter((o) => o.postedBy?._id === userId || o.postedBy === userId) : all);
    } catch (err) {
      toast.error("Failed to load your postings");
    } finally {
      setLoadingPostings(false);
    }
  }, []);

  useEffect(() => { fetchMyPostings(); }, [fetchMyPostings]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.company.trim()) {
      return toast.error("Title and company are required");
    }
    setSubmitting(true);
    try {
      await axios.post(
        `${API}/api/opportunities`,
        {
          ...form,
          tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
        },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      toast.success("Opportunity published!");
      setForm({ title: "", company: "", type: "Internship", location: "Remote", description: "", salary: "", remote: false, tags: "" });
      setShowForm(false);
      fetchMyPostings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell role="alumni" pageTitle="Opportunities">
      <Toaster position="top-right" />
      <div className="space-y-6">
        {/* Top action bar */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Share career opportunities with students at your college</p>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {showForm ? "Cancel" : "+ Post opportunity"}
          </button>
        </div>

        {/* Post form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">Post a new opportunity</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Role title *</label>
                <input required name="title" value={form.title} onChange={handleChange} placeholder="e.g. Software Engineer Intern"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Company *</label>
                <input required name="company" value={form.company} onChange={handleChange} placeholder="Company name"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Type</label>
                <select name="type" value={form.type} onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                  {TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Location</label>
                <input name="location" value={form.location} onChange={handleChange} placeholder="City or Remote"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Salary / stipend</label>
                <input name="salary" value={form.salary} onChange={handleChange} placeholder="e.g. ₹50k/mo"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Skills tags (comma-separated)</label>
                <input name="tags" value={form.tags} onChange={handleChange} placeholder="React, Node.js, SQL"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">Job description</label>
                <textarea name="description" value={form.description} onChange={handleChange}
                  rows={3} placeholder="Describe the role and requirements"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" name="remote" id="remote" checked={form.remote} onChange={handleChange}
                  className="rounded" />
                <label htmlFor="remote" className="text-sm text-slate-600">Remote position</label>
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={submitting}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                {submitting ? "Publishing…" : "Publish opportunity"}
              </button>
            </div>
          </form>
        )}

        {/* My postings */}
        <div>
          <h3 className="mb-4 text-lg font-semibold text-slate-800">My postings</h3>
          {loadingPostings ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}
            </div>
          ) : myPostings.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 py-12 text-center text-slate-400">
              You haven't posted any opportunities yet
            </div>
          ) : (
            <div className="space-y-4">
              {myPostings.map((item) => (
                <div key={item._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">{item.type}</span>
                        {item.remote && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">Remote</span>}
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${item.status === "open" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="mt-1 text-lg font-semibold text-slate-900">{item.title}</p>
                      <p className="text-sm text-slate-500">{item.company} · {item.location}</p>
                      {item.salary && <p className="text-sm font-medium text-slate-700 mt-1">{item.salary}</p>}
                    </div>
                    <div className="text-sm text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
};

export default AlumniOpportunitiesPage;
