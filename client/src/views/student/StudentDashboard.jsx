
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import DashboardShell from '../../components/DashboardShell';
import StatCard from '../../components/StatCard';
import StudentNavbar from '../../components/studentNavbar';

import {
  studentStats,
  featuredOpportunities,
  alumniRecommendations,
  recentUpdates,
} from '../../data/mockData';

const API_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Calculate completeness using actual profile fields.
function calculateProfileCompleteness(profile = {}) {
  const fields = [
    profile.fullName,
    profile.email,
    profile.mobile,
    profile.dob || profile.DOB,
    profile.gender,
    profile.address || profile.location,
    profile.headline,
    profile.about,
    profile.education,
    profile.skills,
    profile.projects,
    profile.certifications,
    profile.linkedIn || profile.linkedin,
    profile.github,
    profile.portfolio,
    profile.leetcode,
    profile.profilePhoto || profile.photoUrl,
    profile.resumeUrl,
  ];

  const completed = fields.filter((value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === 'object') {
      return Object.values(value).some(
        (item) => item !== null && item !== undefined && item !== ''
      );
    }
    return value !== null && value !== undefined && String(value).trim() !== '';
  }).length;

  return Math.round((completed / fields.length) * 100);
}

const StudentDashboard = () => {
  const navigate = useNavigate();

  const [studentName, setStudentName] = useState('Student');
  const [profilePercentage, setProfilePercentage] = useState(0);
  const [profileLoading, setProfileLoading] = useState(true);

  // Get the logged-in student's name.
  useEffect(() => {
    try {
      const user =
        JSON.parse(localStorage.getItem('user') || 'null') || {};

      const userData =
        JSON.parse(localStorage.getItem('userData') || 'null') || {};

      const name =
        localStorage.getItem('name') ||
        user.name ||
        userData.name ||
        userData.user?.name;

      if (name && name.trim()) {
        setStudentName(name.trim());
      }
    } catch (error) {
      console.error('Unable to read student information:', error);
    }
  }, []);

  // Fetch the actual saved profile from the backend.
  const fetchProfile = useCallback(async () => {
    setProfileLoading(true);

    try {
      const token =
        localStorage.getItem('userJwtToken') ||
        localStorage.getItem('token');

      if (!token) {
        setProfilePercentage(0);
        return;
      }

      const response = await axios.get(
        `${API_URL}/api/student/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const profile = response.data?.profile || {};

      // Use saved profile information, with login information as fallback.
      const userData =
        JSON.parse(localStorage.getItem('userData') || 'null') || {};

      const user =
        JSON.parse(localStorage.getItem('user') || 'null') || {};

      const mergedProfile = {
        ...profile,
        fullName:
          profile.fullName ||
          profile.name ||
          userData.name ||
          userData.user?.name ||
          user.name,
        email:
          profile.email ||
          userData.email ||
          userData.user?.email ||
          user.email,
      };

      setProfilePercentage(calculateProfileCompleteness(mergedProfile));
    } catch (error) {
      console.error(
        'Unable to fetch student profile:',
        error.response?.data || error.message
      );
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();

    // Refresh if the student returns to this page.
    const handleFocus = () => fetchProfile();

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchProfile]);

  return (
    <>
      <StudentNavbar />

      <DashboardShell
        role="student"
        pageTitle={`Welcome back, ${studentName}`}
      >
        <div className="space-y-6">

          {/* Profile completeness */}
          <section className="rounded-3xl border border-sky-100 bg-sky-50 p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">
                  Profile completeness
                </p>

                <h3 className="mt-2 text-3xl font-semibold text-slate-900">
                  {profileLoading ? 'Calculating...' : `${profilePercentage}% complete`}
                </h3>

                <div
                  className="mt-4 h-3 w-full max-w-xl overflow-hidden rounded-full bg-sky-100"
                  role="progressbar"
                  aria-label="Profile completeness"
                  aria-valuenow={profilePercentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full bg-sky-600 transition-all duration-500"
                    style={{ width: `${profilePercentage}%` }}
                  />
                </div>

                <p className="mt-3 max-w-xl text-slate-600">
                  {profileLoading
                    ? 'Loading your profile information...'
                    : profilePercentage === 100
                      ? 'Your profile looks complete!'
                      : 'Add your education, skills, projects, certifications, and other details to strengthen your profile.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/student/profile')}
                className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
              >
                {profilePercentage === 100
                  ? 'View profile'
                  : 'Complete profile'}
              </button>
            </div>
          </section>

          {/* Student statistics */}
          <section className="grid gap-4 md:grid-cols-3">
            {studentStats.map((stat, index) => (
              <StatCard
                key={stat.label}
                {...stat}
                accent={
                  index % 2 === 0
                    ? 'indigo'
                    : index === 1
                      ? 'emerald'
                      : 'amber'
                }
              />
            ))}
          </section>

          {/* Opportunities and status updates */}
          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900">
                  Recommended opportunities
                </h3>

                <button
                  type="button"
                  onClick={() => navigate('/student/internships')}
                  className="text-sm font-medium text-sky-600"
                >
                  View all
                </button>
              </div>

              <div className="space-y-4">
                {featuredOpportunities.map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div>
                      <p className="text-lg font-semibold text-slate-900">
                        {item.title}
                      </p>
                      <p className="text-sm text-slate-600">
                        {item.company} · {item.type} · {item.location}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        {item.match}
                      </div>

                      <button
                        type="button"
                        onClick={() => navigate('/student/internships')}
                        className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900">
                  Recent status updates
                </h3>
                <button
                  type="button"
                  onClick={() => navigate('/student/applications')}
                  className="text-sm font-medium text-indigo-600"
                >
                  Track
                </button>
              </div>

              <div className="space-y-3">
                {recentUpdates.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl bg-slate-50 p-3"
                  >
                    <p className="font-medium text-slate-800">
                      {item.title}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                      <span>{item.company}</span>
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Alumni recommendations and quick actions */}
          <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900">
                  Verified alumni
                </h3>
                <button
                  type="button"
                  onClick={() => navigate('/student/alumni')}
                  className="text-sm font-medium text-sky-600"
                >
                  Explore
                </button>
              </div>

              <div className="space-y-4">
                {alumniRecommendations.map((alumni) => (
                  <div
                    key={alumni.name}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {alumni.name}
                      </p>
                      <p className="text-sm text-slate-600">
                        {alumni.role} · {alumni.company}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate('/student/alumni')}
                      className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700"
                    >
                      Connect
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900">
                  Quick actions
                </h3>
                <button
                  type="button"
                  onClick={() => navigate('/student/alumni')}
                  className="text-sm font-medium text-sky-600"
                >
                  Open alumni hub
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: 'Find alumni', path: '/student/alumni' },
                  { label: 'Browse internships', path: '/student/internships' },
                  { label: 'Request referral', path: '/student/alumni' },
                ].map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => navigate(action.path)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left text-sm font-medium text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      </DashboardShell>
    </>
  );
};

export default StudentDashboard;
