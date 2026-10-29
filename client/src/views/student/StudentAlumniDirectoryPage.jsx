import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DashboardShell from "../../components/DashboardShell";
import toast, { Toaster } from "react-hot-toast";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const getToken = () => localStorage.getItem("token") || localStorage.getItem("userJwtToken") || "";

const AlumniCard = ({ alumni, onConnect, onReferral }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-lg font-bold text-white">
        {alumni.name?.[0]?.toUpperCase() || "A"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-slate-800 truncate">{alumni.name}</p>
          {alumni.verificationStatus === "verified" && (
            <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
              ✓ Verified
            </span>
          )}
        </div>
        {(alumni.jobTitle || alumni.company) && (
          <p className="text-sm text-slate-500 truncate">
            {alumni.jobTitle}{alumni.jobTitle && alumni.company && " @ "}{alumni.company}
          </p>
        )}
        {alumni.branch && (
          <p className="text-xs text-slate-400">{alumni.branch}{alumni.graduationYear ? ` · Batch ${alumni.graduationYear}` : ""}</p>
        )}
        {alumni.bio && (
          <p className="mt-2 text-xs text-slate-600 line-clamp-2">{alumni.bio}</p>
        )}
        {alumni.skills?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {alumni.skills.slice(0, 4).map((s) => (
              <span key={s} className="rounded-full bg-sky-50 px-2 py-0.5 text-xs text-sky-700">{s}</span>
            ))}
            {alumni.skills.length > 4 && (
              <span className="text-xs text-slate-400">+{alumni.skills.length - 4}</span>
            )}
          </div>
        )}
      </div>
    </div>
    <div className="mt-4 flex gap-2">
      <button
        onClick={() => onConnect(alumni)}
        className="flex-1 rounded-xl border border-sky-200 bg-sky-50 py-2 text-xs font-medium text-sky-700 hover:bg-sky-100 transition"
      >
        Request mentorship
      </button>
      <button
        onClick={() => onReferral(alumni)}
        className="flex-1 rounded-xl border border-emerald-200 bg-emerald-50 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition"
      >
        Ask for referral
      </button>
    </div>
  </div>
);

const MentorshipModal = ({ alumni, onClose, onSubmit }) => {
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [availableTime, setAvailableTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return toast.error("Topic is required");
    setSubmitting(true);
    try {
      await onSubmit({ mentor: alumni._id, topic, message, availableTime });
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
        <h3 className="text-lg font-semibold text-slate-800">Request mentorship from {alumni.name}</h3>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Topic *</label>
          <input
            required value={topic} onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Career switch, Interview prep"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Message</label>
          <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder="Brief introduction and why you're reaching out"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Your availability</label>
          <input value={availableTime} onChange={(e) => setAvailableTime(e.target.value)}
            placeholder="e.g. Weekends, after 6pm"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" disabled={submitting}
            className="flex-1 rounded-xl bg-sky-600 py-2.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50">
            {submitting ? "Sending…" : "Send request"}
          </button>
        </div>
      </form>
    </div>
  );
};

const ReferralModal = ({ alumni, opportunities, onClose, onSubmit }) => {
  const [opportunity, setOpportunity] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!opportunity) return toast.error("Please select an opportunity");
    setSubmitting(true);
    try {
      await onSubmit({ alumni: alumni._id, opportunity, message });
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
        <h3 className="text-lg font-semibold text-slate-800">Request referral from {alumni.name}</h3>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Opportunity *</label>
          <select required value={opportunity} onChange={(e) => setOpportunity(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
            <option value="">Select an opportunity</option>
            {opportunities.map((o) => (
              <option key={o._id} value={o._id}>{o.title} — {o.company}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Message</label>
          <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder="Brief message about your interest"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" disabled={submitting}
            className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
            {submitting ? "Sending…" : "Request referral"}
          </button>
        </div>
      </form>
    </div>
  );
};

const StudentAlumniDirectoryPage = () => {
  const [alumni, setAlumni] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [search, setSearch] = useState("");
  const [company, setCompany] = useState("");
  const [mentorshipTarget, setMentorshipTarget] = useState(null);
  const [referralTarget, setReferralTarget] = useState(null);

  const fetchAlumni = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12, ...(search && { search }), ...(company && { company }) });
      const res = await axios.get(`${API}/api/alumni?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setAlumni(res.data.data || []);
      setPagination(res.data.pagination || { total: 0, page: 1, pages: 1 });
    } catch (err) {
      toast.error("Failed to load alumni directory");
    } finally {
      setLoading(false);
    }
  }, [search, company]);

  const fetchOpportunities = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/opportunities`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setOpportunities((res.data.data || []).filter((o) => o.status === "open"));
    } catch {}
  }, []);

  useEffect(() => { fetchAlumni(1); }, [fetchAlumni]);
  useEffect(() => { fetchOpportunities(); }, [fetchOpportunities]);

  const handleMentorshipSubmit = async (data) => {
    try {
      await axios.post(`${API}/api/mentorship-requests`, data, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      toast.success("Mentorship request sent!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send request");
      throw err;
    }
  };

  const handleReferralSubmit = async (data) => {
    try {
      await axios.post(`${API}/api/referrals`, data, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      toast.success("Referral request sent!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send request");
      throw err;
    }
  };

  return (
    <DashboardShell role="student" pageTitle="Alumni directory">
      <Toaster position="top-right" />
      <div className="space-y-5">
        {/* Search */}
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search alumni by name, company, role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
          <input
            type="text"
            placeholder="Filter by company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-48 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>

        <p className="text-sm text-slate-500">{pagination.total} alumni in your network</p>

        {/* Grid */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => <div key={i} className="h-52 animate-pulse rounded-2xl bg-slate-100" />)}
          </div>
        ) : alumni.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 py-16 text-center text-slate-400">
            No alumni found matching your search
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {alumni.map((a) => (
              <AlumniCard
                key={a._id}
                alumni={a}
                onConnect={(alum) => setMentorshipTarget(alum)}
                onReferral={(alum) => setReferralTarget(alum)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Page {pagination.page} of {pagination.pages}</span>
            <div className="flex gap-2">
              <button disabled={pagination.page <= 1} onClick={() => fetchAlumni(pagination.page - 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40">
                ← Prev
              </button>
              <button disabled={pagination.page >= pagination.pages} onClick={() => fetchAlumni(pagination.page + 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {mentorshipTarget && (
        <MentorshipModal
          alumni={mentorshipTarget}
          onClose={() => setMentorshipTarget(null)}
          onSubmit={handleMentorshipSubmit}
        />
      )}
      {referralTarget && (
        <ReferralModal
          alumni={referralTarget}
          opportunities={opportunities}
          onClose={() => setReferralTarget(null)}
          onSubmit={handleReferralSubmit}
        />
      )}
    </DashboardShell>
  );
};

export default StudentAlumniDirectoryPage;
