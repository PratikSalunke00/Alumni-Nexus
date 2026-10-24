
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import DashboardShell from '../../components/DashboardShell';
import toast, { Toaster } from 'react-hot-toast';
import { upload } from '@imagekit/javascript';

const API_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const emptyProfile = {
  fullName: '',
  email: '',
  mobile: '',
  dateOfBirth: '',
  gender: '',
  address: '',
  city: '',
  state: '',
  country: 'India',
  postalCode: '',
  headline: '',
  about: '',
  showMobile: false,
  showAddress: false,
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  linkedin: '',
  github: '',
  portfolio: '',
  leetcode: '',
  photo: '',
  resume: '',
};

const emptyEducation = {
  college: '',
  degree: '',
  branch: '',
  currentYear: '',
  startYear: '',
  graduationYear: '',
  grade: '',
};

const emptyProject = {
  title: '',
  description: '',
  technologies: '',
  githubUrl: '',
  liveUrl: '',
  startDate: '',
  endDate: '',
};

const emptyCertification = {
  title: '',
  organization: '',
  issueDate: '',
  credentialUrl: '',
};

const getToken = () =>
  localStorage.getItem('userJwtToken') ||
  localStorage.getItem('token');

const getConfig = () => {
  const token = getToken();

  return {
    headers: token
      ? { Authorization: `Bearer ${token}` }
      : {},
  };
};

const getErrorMessage = (error) =>
  error.response?.data?.message ||
  error.response?.data?.error ||
  error.message ||
  'Something went wrong. Please try again.';

const completionFields = [
  'fullName',
  'email',
  'mobile',
  'headline',
  'about',
  'city',
  'state',
  'country',
];

const calculateCompletion = (profile) => {
  const checks = [
    ...completionFields.map((field) =>
      Boolean(String(profile[field] || '').trim())
    ),
    Boolean(profile.photo),
    Boolean(profile.education?.length),
    Boolean(profile.skills?.length),
    Boolean(profile.projects?.length),
    Boolean(profile.resume),
    Boolean(profile.linkedin || profile.github),
    Boolean(profile.certifications?.length),
  ];

  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
};

const Section = ({ title, description, children }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="mb-5">
      <h2 className="text-lg font-bold text-slate-800">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      )}
    </div>
    {children}
  </section>
);

const Field = ({
  label,
  value,
  onChange,
  placeholder = '',
  type = 'text',
  required = false,
  ...props
}) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-medium text-slate-700">
      {label}
      {required && <span className="text-red-500"> *</span>}
    </span>

    <input
      type={type}
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
      {...props}
    />
  </label>
);

const TextArea = ({ label, value, onChange, placeholder, disabled = false }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-medium text-slate-700">
      {label}
    </span>
    <textarea
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      rows={4}
      className="w-full resize-y rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
    />
  </label>
);

const StudentProfile = () => {
  const [profile, setProfile] = useState(emptyProfile);
  const [draft, setDraft] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState('');
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const [skillInput, setSkillInput] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [resumePreview, setResumePreview] = useState('');

  const tabs = [
    'Overview',
    'Personal Information',
    'Education',
    'Skills & Projects',
    'Resume & Links',
    'Certifications',
  ];

  const completion = useMemo(
    () => calculateCompletion(draft),
    [draft]
  );

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      setLoading(true);

      try {
        const { data } = await axios.get(
          `${API_URL}/api/student/profile`,
          getConfig()
        );

        const saved = data.profile || data.student || data;

        if (mounted) {
          const nextProfile = {
            ...emptyProfile,
            ...saved,
            education: Array.isArray(saved.education) ? saved.education : [],
            skills: Array.isArray(saved.skills) ? saved.skills : [],
            projects: Array.isArray(saved.projects) ? saved.projects : [],
            certifications: Array.isArray(saved.certifications)
              ? saved.certifications
              : [],
          };

          setProfile(nextProfile);
          setDraft(nextProfile);
          setPhotoPreview(nextProfile.photo || '');
          setResumePreview(nextProfile.resume || '');
        }
      } catch (error) {
        if (mounted) {
          toast.error(
            error.response?.status === 404
              ? 'Profile not found. You can create your profile by editing the form.'
              : getErrorMessage(error)
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const updateField = (field, value) => {
    setDraft((previous) => ({ ...previous, [field]: value }));
  };

  const updateEntry = (section, index, field, value) => {
    setDraft((previous) => ({
      ...previous,
      [section]: previous[section].map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      ),
    }));
  };

  const addEntry = (section, entry) => {
    setDraft((previous) => ({
      ...previous,
      [section]: [...previous[section], { ...entry }],
    }));
  };

  const removeEntry = (section, index) => {
    if (!window.confirm('Are you sure you want to remove this entry?')) {
      return;
    }

    setDraft((previous) => ({
      ...previous,
      [section]: previous[section].filter((_, i) => i !== index),
    }));
  };

  const addSkill = () => {
    const skill = skillInput.trim();

    if (!skill) return;

    if (
      draft.skills.some(
        (item) => item.toLowerCase() === skill.toLowerCase()
      )
    ) {
      toast.error('This skill has already been added.');
      return;
    }

    updateField('skills', [...draft.skills, skill]);
    setSkillInput('');
  };

  const removeSkill = (skill) => {
    updateField(
      'skills',
      draft.skills.filter((item) => item !== skill)
    );
  };

  const handleEdit = () => {
    setDraft({ ...profile });
    setPhotoPreview(profile.photo || '');
    setResumePreview(profile.resume || '');
    setEditing(true);
  };

  const handleCancel = () => {
    if (
      !window.confirm(
        'Discard your unsaved changes, including new uploads?'
      )
    ) {
      return;
    }

    setDraft({ ...profile });
    setPhotoPreview(profile.photo || '');
    setResumePreview(profile.resume || '');
    setEditing(false);
    setSkillInput('');
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!draft.fullName.trim() || !draft.email.trim()) {
      toast.error('Full name and email are required.');
      setActiveTab('Personal Information');
      return;
    }

    if (
      draft.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)
    ) {
      toast.error('Please enter a valid email address.');
      return;
    }

    const urls = [
      ['LinkedIn', draft.linkedin],
      ['GitHub', draft.github],
      ['Portfolio', draft.portfolio],
      ['LeetCode', draft.leetcode],
      ...draft.projects.flatMap((project, index) => [
        [`Project ${index + 1} GitHub URL`, project.githubUrl],
        [`Project ${index + 1} live URL`, project.liveUrl],
      ]),
      ...draft.certifications.map((item, index) => [
        `Certification ${index + 1} credential URL`,
        item.credentialUrl,
      ]),
    ];

    for (const item of urls) {
      const [label, url] = item;

      if (!url) continue;

      try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          throw new Error('Invalid URL');
        }
      } catch {
        toast.error(`Please enter a valid URL for ${label}.`);
        setActiveTab('Resume & Links');
        return;
      }
    }

    setSaving(true);

    try {
      const { data } = await axios.put(
        `${API_URL}/api/student/profile`,
        draft,
        getConfig()
      );

      const saved = data.profile || data.student || data;

      const nextProfile = {
        ...draft,
        ...saved,
        education: Array.isArray(saved.education) ? saved.education : draft.education,
        skills: Array.isArray(saved.skills) ? saved.skills : draft.skills,
        projects: Array.isArray(saved.projects) ? saved.projects : draft.projects,
        certifications: Array.isArray(saved.certifications)
          ? saved.certifications
          : draft.certifications,
      };

      setProfile(nextProfile);
      setDraft(nextProfile);
      setPhotoPreview(nextProfile.photo || '');
      setResumePreview(nextProfile.resume || '');
      setEditing(false);

      toast.success('Profile saved successfully!');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (event, kind) => {
  const file = event.target.files?.[0];
  event.target.value = '';

  if (!file) return;

  const isPhoto = kind === 'photo';

  const allowedTypes = isPhoto
    ? ['image/jpeg', 'image/png', 'image/webp']
    : ['application/pdf'];

  if (!allowedTypes.includes(file.type)) {
    toast.error(
      isPhoto
        ? 'Choose a JPG, PNG, or WebP image.'
        : 'Please select a PDF resume.'
    );
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    toast.error('The maximum file size is 5 MB.');
    return;
  }

  const previewUrl = URL.createObjectURL(file);

  if (isPhoto) setPhotoPreview(previewUrl);
  else setResumePreview(previewUrl);

  setUploading(kind);

  try {
    let uploadedUrl;

    if (isPhoto) {
      // 1. Get secure upload credentials from your backend
      const { data: auth } = await axios.get(
        `${API_URL}/api/student/imagekit-auth/auth`,
        getConfig()
      );

      // 2. Upload the image directly to ImageKit
      const result = await upload({
        file,
        fileName: file.name,
        token: auth.token,
        signature: auth.signature,
        expire: auth.expire,
        publicKey: auth.publicKey,
        folder: '/student-profiles',
        useUniqueFileName: true,
      });

      uploadedUrl = result.url;
    } else {
      // Keep your existing backend resume-upload flow
      const formData = new FormData();
      formData.append('resume', file);

      const { data } = await axios.post(
        `${API_URL}/api/student/profile/resume`,
        formData,
        {
          ...getConfig(),
          headers: {
            ...getConfig().headers,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      uploadedUrl =
        data.url || data.resume || data.profile?.resume;
    }

    if (!uploadedUrl) {
      throw new Error('Upload completed without returning a file URL.');
    }

    // 3. Store the URL in the profile draft
    updateField(isPhoto ? 'photo' : 'resume', uploadedUrl);

    if (isPhoto) setPhotoPreview(uploadedUrl);
    else setResumePreview(uploadedUrl);

    toast.success(
      `${isPhoto ? 'Profile photo' : 'Resume'} uploaded. Save your profile to keep the changes.`
    );
  } catch (error) {
    if (isPhoto) setPhotoPreview(draft.photo || '');
    else setResumePreview(draft.resume || '');

    toast.error(getErrorMessage(error));
  } finally {
    URL.revokeObjectURL(previewUrl);
    setUploading('');
  }
};
  

  const removeUpload = async (kind) => {
    if (
      !window.confirm(
        `Remove your current ${kind === 'photo' ? 'profile photo' : 'resume'}?`
      )
    ) {
      return;
    }

    updateField(kind === 'photo' ? 'photo' : 'resume', '');

    if (kind === 'photo') setPhotoPreview('');
    else setResumePreview('');

    toast('Removed from the form. Save changes to update your profile.');
  };

  const renderPersonalInformation = () => (
    <Section
      title="Personal Information"
      description="Keep your personal and professional details up to date."
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field
          label="Full Name"
          value={draft.fullName}
          onChange={(v) => updateField('fullName', v)}
          placeholder="Enter your full name"
          required
          disabled={!editing}
        />
        <Field
          label="Email Address"
          type="email"
          value={draft.email}
          onChange={(v) => updateField('email', v)}
          placeholder="you@example.com"
          required
          disabled={!editing}
        />
        <Field
          label="Mobile Number"
          value={draft.mobile}
          onChange={(v) => updateField('mobile', v)}
          placeholder="Enter mobile number"
          disabled={!editing}
        />
        <Field
          label="Date of Birth"
          type="date"
          value={draft.dateOfBirth?.slice(0, 10)}
          onChange={(v) => updateField('dateOfBirth', v)}
          disabled={!editing}
        />

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Gender
          </span>
          <select
            value={draft.gender}
            onChange={(e) => updateField('gender', e.target.value)}
            disabled={!editing}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm disabled:bg-slate-50"
          >
            <option value="">Prefer not to say</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </label>

        <Field
          label="Postal Code"
          value={draft.postalCode}
          onChange={(v) => updateField('postalCode', v)}
          placeholder="Postal code"
          disabled={!editing}
        />

        <Field
          label="City"
          value={draft.city}
          onChange={(v) => updateField('city', v)}
          placeholder="Your city"
          disabled={!editing}
        />
        <Field
          label="State"
          value={draft.state}
          onChange={(v) => updateField('state', v)}
          placeholder="Your state"
          disabled={!editing}
        />
        <Field
          label="Country"
          value={draft.country}
          onChange={(v) => updateField('country', v)}
          placeholder="Your country"
          disabled={!editing}
        />

        <div className="sm:col-span-2">
          <Field
            label="Current Address"
            value={draft.address}
            onChange={(v) => updateField('address', v)}
            placeholder="Enter your address"
            disabled={!editing}
          />
          {editing && (
            <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={draft.showAddress}
                onChange={(e) =>
                  updateField('showAddress', e.target.checked)
                }
              />
              Allow my address to be visible on my profile
            </label>
          )}
        </div>

        <div className="sm:col-span-2">
          <Field
            label="Professional Headline"
            value={draft.headline}
            onChange={(v) => updateField('headline', v)}
            placeholder="e.g. Aspiring Full Stack Developer | MERN Stack"
            disabled={!editing}
          />
        </div>

        <div className="sm:col-span-2">
          <TextArea
            label="About Me / Career Objective"
            value={draft.about}
            onChange={(v) => updateField('about', v)}
            placeholder="Describe your skills, interests, projects, and career goals..."
            disabled={!editing}
          />
          {!editing && (
            <p className="mt-1 text-xs text-slate-400">
              Select Edit Profile to update this information.
            </p>
          )}
        </div>

        {editing && (
          <label className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2">
            <input
              type="checkbox"
              checked={draft.showMobile}
              onChange={(e) =>
                updateField('showMobile', e.target.checked)
              }
            />
            Allow my mobile number to be visible on my profile
          </label>
        )}
      </div>
    </Section>
  );

  const renderEducation = () => (
    <Section
      title="Education"
      description="Add your current degree and previous qualifications."
    >
      <div className="space-y-5">
        {draft.education.length === 0 && (
          <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
            No education details added yet.
          </p>
        )}

        {draft.education.map((item, index) => (
          <div
            key={item._id || index}
            className="rounded-xl border border-slate-200 p-4"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-slate-700">
                Education {index + 1}
              </h3>
              {editing && (
                <button
                  type="button"
                  onClick={() => removeEntry('education', index)}
                  className="text-sm font-medium text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                ['college', 'College / University'],
                ['degree', 'Degree'],
                ['branch', 'Branch / Specialization'],
                ['currentYear', 'Current Year / Semester'],
                ['startYear', 'Start Year'],
                ['graduationYear', 'Expected Graduation Year'],
                ['grade', 'CGPA / Percentage'],
              ].map(([field, label]) => (
                <Field
                  key={field}
                  label={label}
                  value={item[field]}
                  onChange={(v) =>
                    updateEntry('education', index, field, v)
                  }
                  placeholder={label}
                  disabled={!editing}
                />
              ))}
            </div>
          </div>
        ))}

        {editing && (
          <button
            type="button"
            onClick={() => addEntry('education', emptyEducation)}
            className="rounded-xl border border-sky-200 px-4 py-2.5 text-sm font-semibold text-sky-700 hover:bg-sky-50"
          >
            + Add Education
          </button>
        )}
      </div>
    </Section>
  );

  const renderSkillsAndProjects = () => (
    <div className="space-y-6">
      <Section
        title="Technical Skills"
        description="Add the technologies and tools you know."
      >
        <div className="flex flex-wrap gap-2">
          {draft.skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-2 text-sm font-medium text-sky-800"
            >
              {skill}
              {editing && (
                <button
                  type="button"
                  aria-label={`Remove ${skill}`}
                  onClick={() => removeSkill(skill)}
                  className="font-bold text-sky-700 hover:text-red-600"
                >
                  ×
                </button>
              )}
            </span>
          ))}

          {draft.skills.length === 0 && (
            <p className="text-sm text-slate-500">
              No skills added yet.
            </p>
          )}
        </div>

        {editing && (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSkill();
                }
              }}
              placeholder="e.g. Java, React.js, MongoDB"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-sky-500"
            />
            <button
              type="button"
              onClick={addSkill}
              className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
            >
              Add Skill
            </button>
          </div>
        )}
      </Section>

      <Section
        title="Projects"
        description="Showcase your projects and practical experience."
      >
        <div className="space-y-5">
          {draft.projects.length === 0 && (
            <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
              No projects added yet. Add your first project.
            </p>
          )}

          {draft.projects.map((item, index) => (
            <div
              key={item._id || index}
              className="rounded-xl border border-slate-200 p-4"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-slate-700">
                  Project {index + 1}
                </h3>
                {editing && (
                  <button
                    type="button"
                    onClick={() => removeEntry('projects', index)}
                    className="text-sm text-red-500"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Project Title"
                  value={item.title}
                  onChange={(v) =>
                    updateEntry('projects', index, 'title', v)
                  }
                  placeholder="Project name"
                  disabled={!editing}
                />
                <Field
                  label="Technologies"
                  value={item.technologies}
                  onChange={(v) =>
                    updateEntry('projects', index, 'technologies', v)
                  }
                  placeholder="React, Node.js, MongoDB"
                  disabled={!editing}
                />
                <Field
                  label="GitHub Repository URL"
                  value={item.githubUrl}
                  onChange={(v) =>
                    updateEntry('projects', index, 'githubUrl', v)
                  }
                  placeholder="https://github.com/username/project"
                  disabled={!editing}
                />
                <Field
                  label="Live Demo URL"
                  value={item.liveUrl}
                  onChange={(v) =>
                    updateEntry('projects', index, 'liveUrl', v)
                  }
                  placeholder="https://your-project.com"
                  disabled={!editing}
                />
                <Field
                  label="Start Date"
                  type="date"
                  value={item.startDate?.slice(0, 10)}
                  onChange={(v) =>
                    updateEntry('projects', index, 'startDate', v)
                  }
                  disabled={!editing}
                />
                <Field
                  label="End Date"
                  type="date"
                  value={item.endDate?.slice(0, 10)}
                  onChange={(v) =>
                    updateEntry('projects', index, 'endDate', v)
                  }
                  disabled={!editing}
                />
                <div className="sm:col-span-2">
                  <TextArea
                    label="Project Description"
                    value={item.description}
                    onChange={(v) =>
                      updateEntry('projects', index, 'description', v)
                    }
                    placeholder="Explain the problem, features, and your contribution."
                    disabled={!editing}
                  />
                </div>
              </div>
            </div>
          ))}

          {editing && (
            <button
              type="button"
              onClick={() => addEntry('projects', emptyProject)}
              className="rounded-xl border border-sky-200 px-4 py-2.5 text-sm font-semibold text-sky-700 hover:bg-sky-50"
            >
              + Add Project
            </button>
          )}
        </div>
      </Section>
    </div>
  );

  const renderResumeAndLinks = () => (
    <div className="space-y-6">
      <Section
        title="Resume"
        description="Upload your latest resume in PDF format. Maximum size: 5 MB."
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <span className="text-sm font-bold">PDF</span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="break-words font-medium text-slate-800">
              {draft.resume ? 'Resume uploaded' : 'No resume uploaded'}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {draft.resume
                ? 'Your resume is available below.'
                : 'Upload your resume to help alumni understand your experience.'}
            </p>
            {draft.resume?.startsWith('http') && (
              <a
                href={draft.resume}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-sm font-semibold text-sky-700 hover:underline"
              >
                Preview / Download Resume
              </a>
            )}
          </div>

          {editing && (
            <div className="flex flex-wrap gap-2">
              <label className="cursor-pointer rounded-xl bg-sky-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-sky-700">
                {uploading === 'resume' ? 'Uploading...' : 'Upload PDF'}
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  disabled={uploading !== ''}
                  onChange={(e) => handleUpload(e, 'resume')}
                />
              </label>
              {draft.resume && (
                <button
                  type="button"
                  onClick={() => removeUpload('resume')}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-red-600"
                >
                  Remove
                </button>
              )}
            </div>
          )}
        </div>
      </Section>

      <Section
        title="Professional Links"
        description="Connect your professional and coding profiles."
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {[
            ['linkedin', 'LinkedIn Profile URL', 'https://linkedin.com/in/username'],
            ['github', 'GitHub Profile URL', 'https://github.com/username'],
            ['portfolio', 'Portfolio Website', 'https://yourportfolio.com'],
            ['leetcode', 'LeetCode Profile URL', 'https://leetcode.com/u/username'],
          ].map(([field, label, placeholder]) => (
            <Field
              key={field}
              label={label}
              type="url"
              value={draft[field]}
              onChange={(v) => updateField(field, v)}
              placeholder={placeholder}
              disabled={!editing}
            />
          ))}
        </div>

        {!editing && (
          <div className="mt-5 flex flex-wrap gap-3">
            {[
              ['LinkedIn', draft.linkedin],
              ['GitHub', draft.github],
              ['Portfolio', draft.portfolio],
              ['LeetCode', draft.leetcode],
            ]
              .filter(([, url]) => url)
              .map(([label, url]) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50"
                >
                  {label} ↗
                </a>
              ))}
          </div>
        )}
      </Section>
    </div>
  );

  const renderCertifications = () => (
    <Section
      title="Certifications & Achievements"
      description="Add certificates, hackathon wins, and other achievements."
    >
      <div className="space-y-5">
        {draft.certifications.length === 0 && (
          <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
            No certifications added yet.
          </p>
        )}

        {draft.certifications.map((item, index) => (
          <div
            key={item._id || index}
            className="rounded-xl border border-slate-200 p-4"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-slate-700">
                Certification {index + 1}
              </h3>
              {editing && (
                <button
                  type="button"
                  onClick={() => removeEntry('certifications', index)}
                  className="text-sm text-red-500"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Certification / Achievement"
                value={item.title}
                onChange={(v) =>
                  updateEntry('certifications', index, 'title', v)
                }
                placeholder="e.g. AWS Cloud Practitioner"
                disabled={!editing}
              />
              <Field
                label="Issuing Organization"
                value={item.organization}
                onChange={(v) =>
                  updateEntry('certifications', index, 'organization', v)
                }
                placeholder="e.g. AWS, Google, Microsoft"
                disabled={!editing}
              />
              <Field
                label="Issue Date"
                type="date"
                value={item.issueDate?.slice(0, 10)}
                onChange={(v) =>
                  updateEntry('certifications', index, 'issueDate', v)
                }
                disabled={!editing}
              />
              <Field
                label="Credential URL"
                type="url"
                value={item.credentialUrl}
                onChange={(v) =>
                  updateEntry('certifications', index, 'credentialUrl', v)
                }
                placeholder="https://..."
                disabled={!editing}
              />
            </div>
          </div>
        ))}

        {editing && (
          <button
            type="button"
            onClick={() =>
              addEntry('certifications', emptyCertification)
            }
            className="rounded-xl border border-sky-200 px-4 py-2.5 text-sm font-semibold text-sky-700 hover:bg-sky-50"
          >
            + Add Certification
          </button>
        )}
      </div>
    </Section>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      <Section
        title="About Me"
        description="Your introduction to students, alumni, and recruiters."
      >
        {draft.about ? (
          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
            {draft.about}
          </p>
        ) : (
          <p className="text-sm text-slate-400">
            Add your career objective and professional introduction.
          </p>
        )}
      </Section>

      <Section title="Education">
        {draft.education.length ? (
          <div className="space-y-4">
            {draft.education.map((item, index) => (
              <div
                key={item._id || index}
                className="border-l-2 border-sky-400 pl-4"
              >
                <h3 className="font-semibold text-slate-800">
                  {item.degree || 'Degree not specified'}
                  {item.branch ? ` — ${item.branch}` : ''}
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {item.college || 'College not specified'}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.startYear || '—'} – {item.graduationYear || 'Present'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            Your education details will appear here.
          </p>
        )}
      </Section>

      <Section title="Technical Skills">
        <div className="flex flex-wrap gap-2">
          {draft.skills.length ? (
            draft.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700"
              >
                {skill}
              </span>
            ))
          ) : (
            <p className="text-sm text-slate-400">
              No skills added yet.
            </p>
          )}
        </div>
      </Section>

      <Section title="Projects">
        {draft.projects.length ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {draft.projects.map((item, index) => (
              <article
                key={item._id || index}
                className="rounded-xl border border-slate-200 p-4"
              >
                <h3 className="font-semibold text-slate-800">
                  {item.title || 'Untitled Project'}
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {item.description || 'No description added.'}
                </p>
                {item.technologies && (
                  <p className="mt-3 text-xs text-sky-700">
                    {item.technologies}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                  {item.githubUrl && (
                    <a
                      href={item.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-700 hover:underline"
                    >
                      GitHub ↗
                    </a>
                  )}
                  {item.liveUrl && (
                    <a
                      href={item.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-700 hover:underline"
                    >
                      Live Demo ↗
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            Your projects will appear here.
          </p>
        )}
      </Section>

      <Section title="Certifications & Achievements">
        {draft.certifications.length ? (
          <div className="space-y-4">
            {draft.certifications.map((item, index) => (
              <div
                key={item._id || index}
                className="rounded-xl border border-slate-100 p-4"
              >
                <h3 className="font-semibold text-slate-800">
                  {item.title || 'Untitled achievement'}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {item.organization}
                </p>
                {item.credentialUrl && (
                  <a
                    href={item.credentialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-sm text-sky-700 hover:underline"
                  >
                    View Credential ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            Add certifications and achievements to showcase your growth.
          </p>
        )}
      </Section>
    </div>
  );

  const renderCurrentTab = () => {
    switch (activeTab) {
      case 'Personal Information':
        return renderPersonalInformation();
      case 'Education':
        return renderEducation();
      case 'Skills & Projects':
        return renderSkillsAndProjects();
      case 'Resume & Links':
        return renderResumeAndLinks();
      case 'Certifications':
        return renderCertifications();
      default:
        return renderOverview();
    }
  };

  return (
    <DashboardShell role="student" pageTitle="My Profile">
      <Toaster position="top-right" />

      <div className="mx-auto max-w-6xl space-y-6 pb-8">
        {/* Profile header */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-28 bg-gradient-to-r from-sky-600 to-indigo-600 sm:h-36" />

          <div className="px-5 pb-5 sm:px-7">
            <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-sky-50 text-3xl font-bold text-sky-700 shadow-sm sm:h-28 sm:w-28">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Student profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (draft.fullName?.trim()?.[0] || 'S').toUpperCase()
                  )}
                </div>

                <div className="min-w-0 pb-1">
                  <h1 className="break-words text-xl font-bold text-slate-900 sm:text-2xl">
                    {draft.fullName || 'Your Name'}
                  </h1>
                  <p className="mt-1 break-all text-sm text-slate-500">
                    {draft.email || 'Add your email address'}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {draft.headline || 'Add your professional headline'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 sm:pb-1">
                {!editing ? (
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={saving || uploading !== ''}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      form="student-profile-form"
                      disabled={saving || uploading !== ''}
                      className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {editing && (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <label className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  {uploading === 'photo' ? 'Uploading...' : 'Change Photo'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    disabled={uploading !== ''}
                    onChange={(e) => handleUpload(e, 'photo')}
                  />
                </label>
                {photoPreview && (
                  <button
                    type="button"
                    onClick={() => removeUpload('photo')}
                    className="text-sm font-medium text-red-600 hover:underline"
                  >
                    Remove Photo
                  </button>
                )}
                <span className="text-xs text-slate-400">
                  JPG, PNG or WebP · Maximum 5 MB
                </span>
              </div>
            )}

            <div className="mt-7 border-t border-slate-100 pt-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-700">
                  Profile completion
                </span>
                <span className="text-sm font-bold text-sky-700">
                  {completion}%
                </span>
              </div>

              <div
                className="h-2.5 overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
                aria-valuenow={completion}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Profile completion"
              >
                <div
                  className="h-full rounded-full bg-sky-600 transition-all duration-300"
                  style={{ width: `${completion}%` }}
                />
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Complete your details to build a stronger professional profile.
              </p>
            </div>
          </div>
        </section>

        {/* Navigation tabs */}
        <nav
          aria-label="Profile sections"
          className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2"
        >
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                activeTab === tab
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-sky-100 border-t-sky-600" />
            <p className="mt-4 text-sm text-slate-500">
              Loading your profile...
            </p>
          </div>
        ) : (
          <form
            id="student-profile-form"
            onSubmit={handleSave}
            className="space-y-6"
          >
            {renderCurrentTab()}
          </form>
        )}

        {editing && !loading && (
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving || uploading !== ''}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="student-profile-form"
              disabled={saving || uploading !== ''}
              className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </DashboardShell>
  );
};

export default StudentProfile;
