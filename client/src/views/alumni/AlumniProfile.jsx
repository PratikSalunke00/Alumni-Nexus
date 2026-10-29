import { useEffect, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import DashboardShell from "../../components/DashboardShell";
import ProfileCompletion from "../../components/ProfileCompletion";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const tabs = [
  "Overview",
  "Personal Information",
  "Education",
  "Career & Experience",
  "Skills & Projects",
  "Mentorship & Referrals",
  "Resume & Links",
  "Certifications",
];
const emptyProfile = {
  name: "", email: "", phone: "", city: "", state: "", country: "", headline: "", bio: "",
  branch: "", graduationYear: "", company: "", jobTitle: "", profilePhoto: "", education: [],
  workExperience: [], skills: [], softSkills: [], tools: [], projects: [], certifications: [],
  achievements: [], mentorshipAvailable: false, mentorshipAreas: [], mentorshipFormat: "",
  mentorshipAvailability: "", referralAvailable: false, preferredRoles: [], linkedin: "",
  github: "", portfolio: "", resumeUrl: "",
};
const editableFields = Object.keys(emptyProfile);
const emptyEducation = { college: "", degree: "", branch: "", startYear: "", graduationYear: "", grade: "", achievements: "" };
const emptyExperience = { company: "", jobTitle: "", employmentType: "", location: "", startDate: "", endDate: "", current: false, description: "" };
const emptyProject = { title: "", description: "", technologies: "", githubUrl: "", liveUrl: "" };
const emptyCertification = { title: "", organization: "", issueDate: "", expiryDate: "", credentialId: "", credentialUrl: "" };

const getConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token") || localStorage.getItem("userJwtToken") || ""}`,
  },
});
const getErrorMessage = (error) =>
  error.response?.data?.message || error.message || "Something went wrong. Please try again.";
const normalize = (profile) => ({
  ...emptyProfile,
  ...profile,
  education: Array.isArray(profile.education) ? profile.education : [],
  workExperience: Array.isArray(profile.workExperience) ? profile.workExperience : [],
  skills: Array.isArray(profile.skills) ? profile.skills : [],
  softSkills: Array.isArray(profile.softSkills) ? profile.softSkills : [],
  tools: Array.isArray(profile.tools) ? profile.tools : [],
  projects: Array.isArray(profile.projects) ? profile.projects : [],
  certifications: Array.isArray(profile.certifications) ? profile.certifications : [],
  achievements: Array.isArray(profile.achievements) ? profile.achievements : [],
  mentorshipAreas: Array.isArray(profile.mentorshipAreas) ? profile.mentorshipAreas : [],
  preferredRoles: Array.isArray(profile.preferredRoles) ? profile.preferredRoles : [],
});
const collegeName = (profile) =>
  profile.education[0]?.college ||
  profile.collegeName ||
  (typeof profile.collegeId === "object" ? profile.collegeId?.name : "");
const location = (profile) =>
  [profile.city, profile.state, profile.country].filter(Boolean).join(", ");
const safeHref = (value) => {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
};
const fetchAlumniProfile = async () => {
  const { data } = await axios.get(`${API_URL}/api/alumni/profile/me`, getConfig());
  if (!data.data || data.data.role !== "alumni") {
    throw new Error("An alumni profile could not be found for this account.");
  }
  return normalize(data.data);
};

const Section = ({ title, description, children }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="mb-5">
      <h2 className="text-lg font-bold text-slate-800">{title}</h2>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
    </div>
    {children}
  </section>
);
const Field = ({ label, value, onChange, type = "text", disabled = false, required = false, placeholder = "" }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}{required && <span className="text-red-500"> *</span>}</span>
    <input type={type} value={value ?? ""} onChange={(event) => onChange(event.target.value)} disabled={disabled} required={required} placeholder={placeholder}
      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 disabled:text-slate-600" />
  </label>
);
const TextArea = ({ label, value, onChange, disabled = false, rows = 4 }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
    <textarea value={value ?? ""} onChange={(event) => onChange(event.target.value)} disabled={disabled} rows={rows}
      className="w-full resize-y rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 disabled:text-slate-600" />
  </label>
);
const EmptyState = ({ children }) => <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">{children}</p>;

const StringList = ({ title, items, editing, onChange, placeholder }) => {
  const [value, setValue] = useState("");
  const add = () => {
    const item = value.trim();
    if (!item) return;
    if (items.some((existing) => existing.toLowerCase() === item.toLowerCase())) {
      toast.error("That item has already been added.");
      return;
    }
    onChange([...items, item]);
    setValue("");
  };
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-slate-700">{title}</h3>
      {items.length ? <div className="flex flex-wrap gap-2">{items.map((item, index) => (
        <span key={`${item}-${index}`} className="inline-flex items-center gap-2 rounded-lg bg-sky-50 px-3 py-2 text-sm font-medium text-sky-800">
          {item}
          {editing && <button type="button" aria-label={`Remove ${item}`} onClick={() => onChange(items.filter((_, i) => i !== index))} className="text-sky-600 hover:text-red-600">×</button>}
        </span>
      ))}</div> : <p className="text-sm text-slate-400">No {title.toLowerCase()} added yet.</p>}
      {editing && <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input value={value} onChange={(event) => setValue(event.target.value)} placeholder={placeholder}
          onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); add(); } }}
          className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
        <button type="button" onClick={add} className="rounded-xl border border-sky-200 px-4 py-2.5 text-sm font-semibold text-sky-700 hover:bg-sky-50">Add</button>
      </div>}
    </div>
  );
};

const EntryList = ({ title, items, fields, editing, onChange, onAdd, onRemove }) => (
  <Section title={title}>
    {!items.length && !editing && <EmptyState>No {title.toLowerCase()} added yet.</EmptyState>}
    <div className="space-y-4">
      {items.map((item, index) => (
        <article key={index} className="rounded-xl border border-slate-200 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">{title} {index + 1}</h3>
            {editing && <button type="button" onClick={() => onRemove(index)} className="text-sm font-medium text-red-600">Remove</button>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map(({ field, label, type = "text", textarea = false }) => (
              <div key={field} className={textarea ? "sm:col-span-2" : ""}>
                {textarea
                  ? <TextArea label={label} value={item[field]} disabled={!editing} onChange={(value) => onChange(index, field, value)} />
                  : <Field label={label} type={type} value={item[field]} disabled={!editing} onChange={(value) => onChange(index, field, value)} />}
              </div>
            ))}
            {Object.hasOwn(item, "current") && <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
              <input type="checkbox" checked={Boolean(item.current)} disabled={!editing} onChange={(event) => onChange(index, "current", event.target.checked)} className="h-4 w-4 accent-sky-600" />
              I currently work in this role
            </label>}
          </div>
        </article>
      ))}
    </div>
    {editing && <button type="button" onClick={onAdd} className="mt-4 rounded-xl border border-sky-200 px-4 py-2.5 text-sm font-semibold text-sky-700 hover:bg-sky-50">+ Add {title}</button>}
  </Section>
);

const AlumniProfile = () => {
  const [profile, setProfile] = useState(emptyProfile);
  const [draft, setDraft] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("Overview");

  const loadProfile = async () => {
    try {
      const saved = await fetchAlumniProfile();
      setProfile(saved);
      setDraft(saved);
    } catch (error) {
      const message = getErrorMessage(error);
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    let active = true;
    fetchAlumniProfile()
      .then((saved) => {
        if (active) {
          setProfile(saved);
          setDraft(saved);
        }
      })
      .catch((error) => {
        if (active) {
          const message = getErrorMessage(error);
          setLoadError(message);
          toast.error(message);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);
  const retryProfileLoad = () => {
    setLoading(true);
    setLoadError("");
    loadProfile();
  };

  const updateField = (field, value) => setDraft((current) => ({ ...current, [field]: value }));
  const updateEntry = (section, index, field, value) => setDraft((current) => ({
    ...current,
    [section]: current[section].map((item, i) => i === index ? { ...item, [field]: value } : item),
  }));
  const addEntry = (section, item) => setDraft((current) => ({ ...current, [section]: [...current[section], { ...item }] }));
  const removeEntry = (section, index) => setDraft((current) => ({
    ...current,
    [section]: current[section].filter((_, i) => i !== index),
  }));
  const beginEditing = () => { setDraft(normalize(profile)); setEditing(true); };
  const cancelEditing = () => { setDraft(normalize(profile)); setEditing(false); };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!draft.name.trim()) {
      toast.error("Your name is required.");
      setActiveTab("Personal Information");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
      toast.error("Please enter a valid email address.");
      setActiveTab("Personal Information");
      return;
    }
    const urls = [
      ["Profile photo", draft.profilePhoto, "Personal Information"],
      ["LinkedIn", draft.linkedin, "Resume & Links"],
      ["GitHub", draft.github, "Resume & Links"],
      ["Portfolio", draft.portfolio, "Resume & Links"],
      ["Resume", draft.resumeUrl, "Resume & Links"],
      ...draft.projects.flatMap((item) => [["Project GitHub", item.githubUrl, "Skills & Projects"], ["Project link", item.liveUrl, "Skills & Projects"]]),
      ...draft.certifications.map((item) => ["Credential", item.credentialUrl, "Certifications"]),
    ];
    for (const [label, url, tab] of urls) {
      if (url && !safeHref(url)) {
        toast.error(`${label} must be a valid http or https URL.`);
        setActiveTab(tab);
        return;
      }
    }
    const graduationYear = draft.graduationYear === "" ? null : Number(draft.graduationYear);
    if (graduationYear !== null && (!Number.isInteger(graduationYear) || graduationYear < 1900 || graduationYear > new Date().getFullYear() + 10)) {
      toast.error("Enter a valid graduation year.");
      setActiveTab("Education");
      return;
    }
    setSaving(true);
    try {
      const payload = Object.fromEntries(editableFields.map((field) => [field, draft[field]]));
      payload.graduationYear = graduationYear;
      const { data } = await axios.put(`${API_URL}/api/alumni/profile/me`, payload, getConfig());
      const saved = normalize(data.data);
      setProfile(saved);
      setDraft(saved);
      setEditing(false);
      toast.success("Profile saved successfully.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const educationFields = [
    { field: "college", label: "College / university" }, { field: "degree", label: "Degree" },
    { field: "branch", label: "Branch / specialization" }, { field: "startYear", label: "Start year" },
    { field: "graduationYear", label: "Graduation year" }, { field: "grade", label: "Grade / GPA" },
    { field: "achievements", label: "Academic achievements", textarea: true },
  ];
  const experienceFields = [
    { field: "jobTitle", label: "Job title" }, { field: "company", label: "Company" },
    { field: "employmentType", label: "Employment type" }, { field: "location", label: "Work location" },
    { field: "startDate", label: "Start date", type: "date" }, { field: "endDate", label: "End date", type: "date" },
    { field: "description", label: "Responsibilities and achievements", textarea: true },
  ];
  const projectFields = [
    { field: "title", label: "Project name" }, { field: "technologies", label: "Technologies / stack" },
    { field: "githubUrl", label: "GitHub URL", type: "url" }, { field: "liveUrl", label: "Project URL", type: "url" },
    { field: "description", label: "Description", textarea: true },
  ];
  const certificationFields = [
    { field: "title", label: "Certification name" }, { field: "organization", label: "Issuing organization" },
    { field: "issueDate", label: "Issue date", type: "date" }, { field: "expiryDate", label: "Expiry date", type: "date" },
    { field: "credentialId", label: "Credential ID" }, { field: "credentialUrl", label: "Verification URL", type: "url" },
  ];
  const entries = (section, item) => ({
    onChange: (index, field, value) => updateEntry(section, index, field, value),
    onAdd: () => addEntry(section, item),
    onRemove: (index) => removeEntry(section, index),
  });
  const displayedGraduationYear = draft.graduationYear || draft.education[0]?.graduationYear;

  const renderOverview = () => {
    const firstEducation = draft.education[0];
    return <div className="space-y-6">
      <Section title="About Me" description="Your professional summary">
        {draft.bio ? <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">{draft.bio}</p> : <EmptyState>Add a professional summary to introduce yourself.</EmptyState>}
      </Section>
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Current Professional Role">
          {draft.jobTitle || draft.company ? <><p className="font-semibold text-slate-800">{draft.jobTitle || "Job title not added"}</p><p className="mt-1 text-sm text-slate-600">{draft.company || "Company not added"}</p><p className="mt-2 text-sm text-slate-500">{location(draft)}</p></> : <EmptyState>Add your current role and company.</EmptyState>}
        </Section>
        <Section title="Education Summary">
          {collegeName(draft) || firstEducation?.degree || draft.branch || displayedGraduationYear
            ? <><p className="font-semibold text-slate-800">{[firstEducation?.degree, firstEducation?.branch || draft.branch].filter(Boolean).join(" · ") || "Degree not added"}</p><p className="mt-1 text-sm text-slate-600">{collegeName(draft) || "College not added"}</p><p className="mt-2 text-sm text-slate-500">{displayedGraduationYear ? `Class of ${displayedGraduationYear}` : ""}</p></>
            : <EmptyState>Add your college and graduation details.</EmptyState>}
        </Section>
      </div>
      <Section title="Technical Skills">
        {draft.skills.length ? <div className="flex flex-wrap gap-2">{draft.skills.map((skill, i) => <span key={`${skill}-${i}`} className="rounded-lg bg-sky-50 px-3 py-2 text-sm font-medium text-sky-800">{skill}</span>)}</div> : <EmptyState>No technical skills have been added yet.</EmptyState>}
      </Section>
      <Section title="Work Experience">
        {draft.workExperience.length ? <div className="space-y-4">{draft.workExperience.map((item, i) => <article key={i} className="border-l-2 border-sky-200 pl-4">
          <h3 className="font-semibold text-slate-800">{item.jobTitle || "Role"}{item.company ? ` · ${item.company}` : ""}</h3>
          <p className="mt-1 text-sm text-slate-500">{[item.employmentType, item.location, item.startDate, item.current ? "Present" : item.endDate].filter(Boolean).join(" · ")}</p>
          {item.description && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.description}</p>}
        </article>)}</div> : <EmptyState>No experience or internships have been added.</EmptyState>}
      </Section>
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Featured Projects">
          {draft.projects.length ? <div className="space-y-4">{draft.projects.slice(0, 3).map((item, i) => <article key={i}>
            <h3 className="font-semibold text-slate-800">{item.title || "Project"}</h3>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{item.description}</p>
            {item.technologies && <p className="mt-2 text-xs font-medium text-sky-700">{item.technologies}</p>}
            <div className="mt-2 flex gap-3 text-sm">{safeHref(item.githubUrl) && <a href={safeHref(item.githubUrl)} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline">GitHub ↗</a>}{safeHref(item.liveUrl) && <a href={safeHref(item.liveUrl)} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline">Project ↗</a>}</div>
          </article>)}</div> : <EmptyState>No featured projects have been added yet.</EmptyState>}
        </Section>
        <Section title="Certifications & Achievements">
          {draft.certifications.length || draft.achievements.length ? <div className="space-y-3">{draft.certifications.slice(0, 3).map((item, i) => <article key={i}><p className="font-semibold text-slate-800">{item.title || "Certification"}</p><p className="text-sm text-slate-500">{item.organization}</p></article>)}{draft.achievements.slice(0, 3).map((item, i) => <p key={`a${i}`} className="text-sm text-slate-600">{item}</p>)}</div> : <EmptyState>No certifications or achievements have been added yet.</EmptyState>}
        </Section>
      </div>
      <Section title="Mentorship & Referrals">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4"><p className="text-sm font-semibold text-slate-800">Mentorship</p><p className="mt-1 text-sm text-slate-600">{draft.mentorshipAvailable ? "Available to mentor students" : "Not currently available"}</p></div>
          <div className="rounded-xl bg-slate-50 p-4"><p className="text-sm font-semibold text-slate-800">Referrals</p><p className="mt-1 text-sm text-slate-600">{draft.referralAvailable ? "Open to referral requests" : "Not currently available"}</p></div>
        </div>
      </Section>
    </div>;
  };

  const renderTab = () => {
    switch (activeTab) {
      case "Personal Information": return <Section title="Personal Information" description="Keep your contact and professional details up to date.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" value={draft.name} required disabled={!editing} onChange={(value) => updateField("name", value)} />
          <Field label="Email address" type="email" value={draft.email} required disabled={!editing} onChange={(value) => updateField("email", value)} />
          <Field label="Phone number" type="tel" value={draft.phone} disabled={!editing} onChange={(value) => updateField("phone", value)} />
          <Field label="Professional headline" value={draft.headline} disabled={!editing} onChange={(value) => updateField("headline", value)} />
          <Field label="City" value={draft.city} disabled={!editing} onChange={(value) => updateField("city", value)} />
          <Field label="State / Province" value={draft.state} disabled={!editing} onChange={(value) => updateField("state", value)} />
          <Field label="Country" value={draft.country} disabled={!editing} onChange={(value) => updateField("country", value)} />
          <Field label="Profile photo URL" type="url" value={draft.profilePhoto} disabled={!editing} onChange={(value) => updateField("profilePhoto", value)} />
          <div className="sm:col-span-2"><TextArea label="Professional summary / bio" value={draft.bio} disabled={!editing} onChange={(value) => updateField("bio", value)} /></div>
        </div>
      </Section>;
      case "Education": return <div className="space-y-6">
        <Section title="Education Summary" description="Your main degree details are also shown in your profile header.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Branch / specialization" value={draft.branch} disabled={!editing} onChange={(value) => updateField("branch", value)} />
            <Field label="Graduation year" type="number" value={draft.graduationYear} disabled={!editing} onChange={(value) => updateField("graduationYear", value)} />
          </div>
        </Section>
        <EntryList title="Education" items={draft.education} fields={educationFields} editing={editing} {...entries("education", emptyEducation)} />
      </div>;
      case "Career & Experience": return <div className="space-y-6">
        <Section title="Current Role"><div className="grid gap-4 sm:grid-cols-2"><Field label="Job title" value={draft.jobTitle} disabled={!editing} onChange={(value) => updateField("jobTitle", value)} /><Field label="Company" value={draft.company} disabled={!editing} onChange={(value) => updateField("company", value)} /></div></Section>
        <EntryList title="Experience / Internship" items={draft.workExperience} fields={experienceFields} editing={editing} {...entries("workExperience", emptyExperience)} />
      </div>;
      case "Skills & Projects": return <div className="space-y-6">
        <Section title="Skills & Technologies"><div className="space-y-6">
          <StringList title="Technical skills" items={draft.skills} editing={editing} onChange={(items) => updateField("skills", items)} placeholder="e.g. React, Node.js" />
          <StringList title="Soft skills" items={draft.softSkills} editing={editing} onChange={(items) => updateField("softSkills", items)} placeholder="e.g. Communication" />
          <StringList title="Tools & technologies" items={draft.tools} editing={editing} onChange={(items) => updateField("tools", items)} placeholder="e.g. Git, AWS" />
        </div></Section>
        <EntryList title="Project" items={draft.projects} fields={projectFields} editing={editing} {...entries("projects", emptyProject)} />
      </div>;
      case "Mentorship & Referrals": return <Section title="Mentorship & Referrals" description="Let students know how you can support their career growth.">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-sm font-medium text-slate-700"><input type="checkbox" checked={Boolean(draft.mentorshipAvailable)} disabled={!editing} onChange={(event) => updateField("mentorshipAvailable", event.target.checked)} className="h-4 w-4 accent-sky-600" />Available for mentorship</label>
            <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-sm font-medium text-slate-700"><input type="checkbox" checked={Boolean(draft.referralAvailable)} disabled={!editing} onChange={(event) => updateField("referralAvailable", event.target.checked)} className="h-4 w-4 accent-sky-600" />Open to referral requests</label>
          </div>
          <StringList title="Areas of expertise" items={draft.mentorshipAreas} editing={editing} onChange={(items) => updateField("mentorshipAreas", items)} placeholder="e.g. Product management" />
          <div className="grid gap-5 sm:grid-cols-2"><Field label="Preferred mentorship format" value={draft.mentorshipFormat} disabled={!editing} onChange={(value) => updateField("mentorshipFormat", value)} placeholder="e.g. Online, in person" /><Field label="Availability" value={draft.mentorshipAvailability} disabled={!editing} onChange={(value) => updateField("mentorshipAvailability", value)} placeholder="e.g. Weekends, monthly" /></div>
          <StringList title="Roles for referrals" items={draft.preferredRoles} editing={editing} onChange={(items) => updateField("preferredRoles", items)} placeholder="e.g. Software Engineer" />
          <p className="rounded-xl bg-sky-50 p-4 text-sm leading-6 text-sky-900">Students can send requests through the Alumni Directory. Manage incoming requests from your Mentorship and Referrals pages.</p>
        </div>
      </Section>;
      case "Resume & Links": return <div className="space-y-6">
        <Section title="Resume" description="Provide a shareable resume URL to preview or download.">
          <Field label="Resume URL" type="url" value={draft.resumeUrl} disabled={!editing} onChange={(value) => updateField("resumeUrl", value)} placeholder="https://" />
          {safeHref(draft.resumeUrl) ? <a href={safeHref(draft.resumeUrl)} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700">Preview / Download Resume ↗</a> : <p className="mt-3 text-sm text-slate-500">No resume link has been added.</p>}
        </Section>
        <Section title="Professional Links" description="Connect your professional and developer profiles.">
          <div className="grid gap-5 sm:grid-cols-2">{[["linkedin", "LinkedIn profile"], ["github", "GitHub profile"], ["portfolio", "Portfolio website"]].map(([field, label]) => <Field key={field} label={label} type="url" value={draft[field]} disabled={!editing} onChange={(value) => updateField(field, value)} placeholder="https://" />)}</div>
          <div className="mt-5 flex flex-wrap gap-3">{[["LinkedIn", draft.linkedin], ["GitHub", draft.github], ["Portfolio", draft.portfolio]].filter(([, url]) => safeHref(url)).map(([label, url]) => <a key={label} href={safeHref(url)} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50">{label} ↗</a>)}</div>
        </Section>
      </div>;
      case "Certifications": return <div className="space-y-6">
        <EntryList title="Certification" items={draft.certifications} fields={certificationFields} editing={editing} {...entries("certifications", emptyCertification)} />
        <Section title="Achievements"><StringList title="Other achievements" items={draft.achievements} editing={editing} onChange={(items) => updateField("achievements", items)} placeholder="e.g. Hackathon finalist" /></Section>
      </div>;
      default: return renderOverview();
    }
  };

  const completion = {
    fullName: draft.name, email: draft.email, mobile: draft.phone, headline: draft.headline,
    about: draft.bio, city: draft.city, state: draft.state, country: draft.country,
    photo: draft.profilePhoto, education: draft.education, skills: draft.skills,
    projects: draft.projects, resume: draft.resumeUrl, linkedin: draft.linkedin,
    github: draft.github, certifications: draft.certifications,
  };

  return <DashboardShell role="alumni" pageTitle="My Profile">
    <Toaster position="top-right" />
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-sky-100 border-t-sky-600" /><p className="mt-4 text-sm text-slate-500">Loading your alumni profile...</p></div>
        : loadError ? <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center"><h1 className="font-semibold text-rose-900">Unable to load your profile</h1><p className="mt-2 text-sm text-rose-700">{loadError}</p><button type="button" onClick={retryProfileLoad} className="mt-4 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700">Try again</button></section>
          : <>
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="h-28 bg-gradient-to-r from-sky-600 to-indigo-600 sm:h-36" />
              <div className="px-5 pb-5 sm:px-7">
                <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex items-end gap-4">
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-sky-50 text-3xl font-bold text-sky-700 shadow-sm sm:h-28 sm:w-28">
                      {safeHref(draft.profilePhoto) ? <img src={safeHref(draft.profilePhoto)} alt={`${draft.name || "Alumni"} profile`} className="h-full w-full object-cover" /> : (draft.name.trim()[0] || "A").toUpperCase()}
                    </div>
                    <div className="min-w-0 pb-1">
                      <h1 className="break-words text-xl font-bold text-slate-900 sm:text-2xl">{draft.name || "Your Name"}</h1>
                      <p className="mt-1 break-words text-sm text-slate-500">{draft.headline || "Add your professional headline"}</p>
                      <p className="mt-1 text-sm text-slate-600">{[draft.jobTitle, draft.company].filter(Boolean).join(" at ") || "Add your current role"}</p>
                      <p className="mt-1 text-sm text-slate-500">{location(draft) || "Add your current location"}</p>
                      <p className="mt-1 text-sm text-slate-500">{[collegeName(draft), draft.education[0]?.degree, draft.education[0]?.branch || draft.branch, displayedGraduationYear && `Class of ${displayedGraduationYear}`].filter(Boolean).join(" · ") || "Add your education"}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2 sm:pb-1">
                    {!editing ? <button type="button" onClick={beginEditing} className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700">Edit Profile</button> : <>
                      <button type="button" onClick={cancelEditing} disabled={saving} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
                      <button type="submit" form="alumni-profile-form" disabled={saving} className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>
                    </>}
                  </div>
                </div>
                <div className="mt-5 max-w-xl"><ProfileCompletion profile={completion} loading={loading} variant="compact" /></div>
              </div>
            </section>
            <nav aria-label="Profile sections" className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2">
              {tabs.map((tab) => <button type="button" key={tab} onClick={() => setActiveTab(tab)} aria-current={activeTab === tab ? "page" : undefined}
                className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium transition ${activeTab === tab ? "bg-sky-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>{tab}</button>)}
            </nav>
            <form id="alumni-profile-form" onSubmit={handleSave} className="space-y-6">{renderTab()}</form>
            {editing && <div className="flex justify-end gap-3">
              <button type="button" onClick={cancelEditing} disabled={saving} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
              <button type="submit" form="alumni-profile-form" disabled={saving} className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>
            </div>}
          </>}
    </div>
  </DashboardShell>;
};

export default AlumniProfile;