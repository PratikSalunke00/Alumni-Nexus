
import { useMemo } from 'react';

const calculateProfileCompletion = (profile = {}) => {
  const fields = [
    Boolean(profile.fullName?.trim()),
    Boolean(profile.email?.trim()),
    Boolean(profile.mobile?.trim()),
    Boolean(profile.headline?.trim()),
    Boolean(profile.about?.trim()),
    Boolean(profile.city?.trim()),
    Boolean(profile.state?.trim()),
    Boolean(profile.country?.trim()),
    Boolean(profile.photo),
    Boolean(profile.education?.length),
    Boolean(profile.skills?.length),
    Boolean(profile.projects?.length),
    Boolean(profile.resume),
    Boolean(profile.linkedin || profile.github),
    Boolean(profile.certifications?.length),
  ];

  const completed = fields.filter(Boolean).length;

  return Math.round((completed / fields.length) * 100);
};

const ProfileCompletion = ({
  profile = {},
  loading = false,
  variant = 'default',
}) => {
  const percentage = useMemo(
    () => calculateProfileCompletion(profile),
    [profile]
  );

  if (variant === 'compact') {
    return (
      <div className="w-full">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">
            Profile completion
          </span>

          <span className="text-sm font-bold text-sky-700">
            {loading ? '...' : `${percentage}%`}
          </span>
        </div>

        <div
          className="h-2.5 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-label="Profile completion"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-sky-600 transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-sky-100 bg-sky-50 p-6">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">
        Profile completeness
      </p>

      <h3 className="mt-2 text-3xl font-semibold text-slate-900">
        {loading ? 'Calculating...' : `${percentage}% complete`}
      </h3>

      <div
        className="mt-4 h-3 w-full max-w-xl overflow-hidden rounded-full bg-sky-100"
        role="progressbar"
        aria-label="Profile completeness"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-sky-600 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="mt-3 text-slate-600">
        {loading
          ? 'Loading your profile information...'
          : percentage === 100
            ? 'Your profile looks complete!'
            : 'Add your personal details, education, skills, projects, and certifications.'}
      </p>

      {!loading && percentage < 100 && (
        <button
          type="button"
          onClick={() => {
            window.location.href = '/student/profile';
          }}
          className="mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Complete Profile
        </button>
      )}
    </section>
  );
};

export default ProfileCompletion;
