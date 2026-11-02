import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import DashboardShell from "../../components/DashboardShell";
import AluminiNavbar from "../../components/AluminiNavbar";
import {
  getMentorshipConfig,
  getRequestError,
  MENTORSHIP_API,
  sessionDomains,
} from "../../utils/mentorship";

const today = new Date();
const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
const emptyForm = {
  title: "",
  domain: "",
  description: "",
  topics: "",
  duration: "30",
  price: "0",
  availableDate: "",
  availableTime: "",
  meetingLink: "",
  maxStudents: "",
  publishNow: true,
};

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100";

const CreateSession = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [profileResponse, sessionResponse] = await Promise.all([
          axios.get(`${MENTORSHIP_API}/api/alumni/profile/me`, getMentorshipConfig()),
          id
            ? axios.get(`${MENTORSHIP_API}/api/sessions/${id}`, getMentorshipConfig())
            : Promise.resolve(null),
        ]);
        if (!active) return;
        setProfile(profileResponse.data.data);
        if (sessionResponse) {
          const session = sessionResponse.data.data;
          setForm({
            title: session.title || "",
            domain: session.domain || "",
            description: session.description || "",
            topics: (session.topics || []).join(", "),
            duration: String(session.duration || 30),
            price: String(session.price ?? 0),
            availableDate: session.availableDate || "",
            availableTime: session.availableTime || "",
            meetingLink: session.meetingLink || "",
            maxStudents: session.maxStudents ?? "",
            publishNow: session.status === "Published",
          });
        }
      } catch (error) {
        if (active) {
          toast.error(getRequestError(error, "Unable to load session details."));
          if (id) navigate("/alumni/sessions");
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [id, navigate]);

  const update = (event) => {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const topics = form.topics
      .split(/[,\n]/)
      .map((topic) => topic.trim())
      .filter(Boolean);
    const payload = {
      title: form.title.trim(),
      domain: form.domain.trim(),
      description: form.description.trim(),
      topics,
      duration: Number(form.duration),
      price: Number(form.price),
      availableDate: form.availableDate,
      availableTime: form.availableTime,
      meetingLink: form.meetingLink.trim(),
      maxStudents: form.maxStudents ? Number(form.maxStudents) : null,
    };

    if (
      !payload.title ||
      !payload.domain ||
      !payload.description ||
      !payload.availableDate ||
      !payload.availableTime ||
      payload.price < 0 ||
      (payload.maxStudents !== null && payload.maxStudents < 1)
    ) {
      toast.error("Complete all required fields with valid values.");
      return;
    }

    setSaving(true);
    try {
      if (id) {
        await axios.put(
          `${MENTORSHIP_API}/api/sessions/${id}`,
          { ...payload, status: form.publishNow ? "Published" : "Unpublished" },
          getMentorshipConfig(),
        );
        toast.success("Session updated.");
      } else {
        await axios.post(
          `${MENTORSHIP_API}/api/sessions/create`,
          { ...payload, status: form.publishNow ? "Published" : "Unpublished" },
          getMentorshipConfig(),
        );
        toast.success(form.publishNow ? "Session published." : "Session saved as unpublished.");
      }
      navigate("/alumni/sessions");
    } catch (error) {
      toast.error(getRequestError(error, "Unable to save the session."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AluminiNavbar />
      <DashboardShell role="alumni" pageTitle={id ? "Edit mentorship session" : "Create mentorship session"}>
        <Toaster position="top-right" />
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-20 rounded-2xl bg-slate-100" />
            <div className="h-96 rounded-2xl bg-slate-100" />
          </div>
        ) : (
          <div className="mx-auto max-w-4xl space-y-5">
            <section className="flex flex-col gap-4 rounded-2xl border border-sky-100 bg-sky-50 p-5 sm:flex-row sm:items-center">
              {profile?.profilePhoto ? (
                <img src={profile.profilePhoto} alt="" className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-600 text-lg font-bold text-white">
                  {(profile?.name || "A").charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-slate-900">{profile?.name || "Your alumni profile"}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {[profile?.jobTitle, profile?.company].filter(Boolean).join(" at ") || "Profile details are linked automatically"}
                </p>
              </div>
              <p className="sm:ml-auto text-xs text-slate-500">Session ownership is linked to your signed-in account.</p>
            </section>

            <form onSubmit={submit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-700 md:col-span-2">
                  Session title *
                  <input className={fieldClass} name="title" value={form.title} onChange={update} maxLength={120} required />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Professional domain *
                  <select className={fieldClass} name="domain" value={form.domain} onChange={update} required>
                    <option value="">Choose a domain</option>
                    {sessionDomains.map((domain) => <option key={domain}>{domain}</option>)}
                    {form.domain && !sessionDomains.includes(form.domain) && <option>{form.domain}</option>}
                  </select>
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Duration *
                  <select className={fieldClass} name="duration" value={form.duration} onChange={update} required>
                    {[30, 45, 60].map((duration) => <option key={duration} value={duration}>{duration} minutes</option>)}
                  </select>
                </label>
                <label className="text-sm font-medium text-slate-700 md:col-span-2">
                  Session description *
                  <textarea className={fieldClass} name="description" value={form.description} onChange={update} rows={4} maxLength={3000} required />
                </label>
                <label className="text-sm font-medium text-slate-700 md:col-span-2">
                  Topics covered <span className="font-normal text-slate-400">(separate topics with commas)</span>
                  <textarea className={fieldClass} name="topics" value={form.topics} onChange={update} rows={2} placeholder="System design, interview preparation, project review" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Price (₹) *
                  <input className={fieldClass} type="number" name="price" value={form.price} onChange={update} min="0" step="1" required />
                  <span className="mt-1 block text-xs font-normal text-slate-500">Informational only. No payment is collected.</span>
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Maximum students <span className="font-normal text-slate-400">(optional)</span>
                  <input className={fieldClass} type="number" name="maxStudents" value={form.maxStudents} onChange={update} min="1" step="1" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Available date *
                  <input className={fieldClass} type="date" name="availableDate" value={form.availableDate} onChange={update} min={localToday} required />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Available time *
                  <input className={fieldClass} type="time" name="availableTime" value={form.availableTime} onChange={update} required />
                </label>
                <label className="text-sm font-medium text-slate-700 md:col-span-2">
                  Meeting link <span className="font-normal text-slate-400">(optional)</span>
                  <input className={fieldClass} type="url" name="meetingLink" value={form.meetingLink} onChange={update} placeholder="https://" />
                </label>
              </div>

              <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <input className="mt-1 h-4 w-4 accent-sky-600" type="checkbox" name="publishNow" checked={form.publishNow} onChange={update} />
                <span>
                  <span className="block text-sm font-semibold text-slate-800">Publish this session</span>
                  <span className="mt-1 block text-xs text-slate-500">Published sessions appear in the student session directory.</span>
                </span>
              </label>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <Link to="/alumni/sessions" className="rounded-xl border border-slate-200 px-5 py-3 text-center text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</Link>
                <button disabled={saving} className="rounded-xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60">
                  {saving ? "Saving..." : id ? "Save changes" : "Create session"}
                </button>
              </div>
            </form>
          </div>
        )}
      </DashboardShell>
    </>
  );
};

export default CreateSession;