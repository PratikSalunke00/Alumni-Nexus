import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import DashboardShell from "../../components/DashboardShell";
import toast, { Toaster } from "react-hot-toast";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const getToken = () => localStorage.getItem("token") || localStorage.getItem("userJwtToken") || "";

const ApplyModal = ({ opportunity, onClose, onSubmit }) => {
  const [coverLetter, setCoverLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({ coverLetter });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4"
      >
        <h3 className="text-lg font-semibold text-slate-800">
          Apply for {opportunity.title}
        </h3>
        <p className="text-sm text-slate-500">{opportunity.company} · {opportunity.type}</p>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Cover letter (optional)</label>
          <textarea
            rows={4} value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)}
            placeholder="Tell them why you're a great fit…"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" disabled={submitting}
            className="flex-1 rounded-xl bg-sky-600 py-2.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50">
            {submitting ? "Submitting…" : "Submit application"}
          </button>
        </div>
      </form>
    </div>
  );
};

const StudentOpportunitiesPage = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myApplications, setMyApplications] = useState(new Set());
  const [applyTarget, setApplyTarget] = useState(null);
  const [filterType, setFilterType] = useState("");
  const [search, setSearch]= useState("");

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/opportunities`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setOpportunities(res.data.data || []);
    } catch (err) {
      toast.error("Failed to load opportunities");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchApplications = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/applications/me`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const appliedIds = new Set((res.data.data || []).map((a) => a.opportunity?._id || a.opportunity));
      setMyApplications(appliedIds);
    } catch {}
  }, []);

  useEffect(() => {
    fetchOpportunities();
    fetchApplications();
  }, [fetchOpportunities, fetchApplications]);

  const handleApply = async ({ coverLetter }) => {
    if (!applyTarget) return;
    try {
      await axios.post(
        `${API}/api/opportunities/${applyTarget._id}/apply`,
        { coverLetter },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      toast.success("Application submitted!");
      setMyApplications((prev) => new Set([...prev, applyTarget._id]));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to apply");
      throw err;
    }
  };

  const types = ["Internship", "Full Time", "Part Time", "Freelance", "Campus"];

  const filtered = opportunities.filter((o) => {
    const matchType = !filterType || o.type === filterType;
    const matchSearch = !search || o.title.toLowerCase().includes(search.toLowerCase()) || o.company.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch && o.status === "open";
  });

  return (
    <>
      <DashboardShell role="student" pageTitle="Opportunities">
        <Toaster position="top-right" />
        <div className="space-y-5">
          {/* Header */}
          <section className="rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 to-indigo-50 p-5">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">Career growth</p>
            <h3 className="mt-1 text-2xl font-semibold text-slate-900">
              Jobs & internships from your alumni network
            </h3>
          </section>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or company…"
              className="flex-1 min-w-[200px] rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setFilterType("")}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${!filterType ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                All
              </button>
              {types.map((t) => (
                <button key={t} onClick={() => setFilterType(t === filterType ? "" : t)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${filterType === t ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-100" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 py-16 text-center text-slate-400">
              No open opportunities found
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((item) => {
                const applied = myApplications.has(item._id);
                return (
                  <div key={item._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-700">{item.type}</span>
                          {item.remote && <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">Remote</span>}
                        </div>
                        <div>
                          <h4 className="text-xl font-semibold text-slate-900">{item.title}</h4>
                          <p className="text-sm text-slate-500">{item.company} · {item.location}</p>
                          {item.postedBy && <p className="text-xs text-slate-400 mt-0.5">Posted by {item.postedBy.name}</p>}
                        </div>
                        {item.description && <p className="text-sm text-slate-600 leading-6 max-w-2xl">{item.description}</p>}
                        <div className="flex flex-wrap gap-2">
                          {(item.tags || []).map((tag) => (
                            <span key={tag} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600">{tag}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex min-w-[160px] flex-col items-end gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-xs uppercase tracking-widest text-slate-400">Salary</p>
                          <p className="font-bold text-slate-800">{item.salary || "Competitive"}</p>
                        </div>
                        {applied ? (
                          <span className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                            ✓ Applied
                          </span>
                        ) : (
                          <button
                            onClick={() => setApplyTarget(item)}
                            className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
                          >
                            Apply now
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DashboardShell>

      {applyTarget && (
        <ApplyModal
          opportunity={applyTarget}
          onClose={() => setApplyTarget(null)}
          onSubmit={handleApply}
        />
      )}
    </>
  );
};

export default StudentOpportunitiesPage;
