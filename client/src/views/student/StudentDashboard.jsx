
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import DashboardShell from '../../components/DashboardShell';
import StatCard from '../../components/StatCard';
import StudentNavbar from '../../components/studentNavbar';
import ProfileCompletion from '../../components/ProfileCompletion';

import {
  studentStats,
  featuredOpportunities,
  alumniRecommendations,
  recentUpdates,
} from '../../data/mockData';

const API_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const StudentDashboard = () => {
  const navigate = useNavigate();

  const [studentName, setStudentName] = useState('Student');
  const [profile, setProfile] = useState({});
  const [profileLoading, setProfileLoading] = useState(true);

  // Get the logged-in student's name from localStorage.
  useEffect(() => {
    try {
      const user = JSON.parse(
        localStorage.getItem('user') || 'null'
      ) || {};

      const userData = JSON.parse(
        localStorage.getItem('userData') || 'null'
      ) || {};

      const storedName =
        localStorage.getItem('name') ||
        user.name ||
        user.fullName ||
        userData.name ||
        userData.fullName ||
        userData.user?.name ||
        userData.user?.fullName;

      if (typeof storedName === 'string' && storedName.trim()) {
        setStudentName(storedName.trim());
      }
    } catch (error) {
      console.error(
        'Unable to read student information:',
        error
      );
    }
  }, []);

  // Fetch the saved profile from the same API used by StudentProfile.jsx.
  const fetchProfile = useCallback(async () => {
    setProfileLoading(true);

    try {
      const token =
        localStorage.getItem('userJwtToken') ||
        localStorage.getItem('token');

      if (!token) {
        setProfile({});
        return;
      }

      const response = await axios.get(
        `${API_URL}/api/student/profile/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Support the common response formats used by the backend.
      const responseData = response.data;

      const savedProfile =
        responseData?.profile ||
        responseData?.student ||
        responseData?.data?.profile ||
        responseData?.data?.student ||
        responseData?.data ||
        responseData;

      setProfile(
        savedProfile &&
          typeof savedProfile === 'object' &&
          !Array.isArray(savedProfile)
          ? savedProfile
          : {}
      );
    } catch (error) {
      console.error(
        'Unable to fetch student profile:',
        error.response?.data || error.message
      );

      setProfile({});
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Fetch on page load and refresh when the user returns to the tab.
  useEffect(() => {
    fetchProfile();

    const handleFocus = () => {
      fetchProfile();
    };

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
          {/* Shared profile completion component */}
          <ProfileCompletion
            profile={profile}
            loading={profileLoading}
          />

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
                  {
                    label: 'Find alumni',
                    path: '/student/alumni',
                  },
                  {
                    label: 'Browse internships',
                    path: '/student/internships',
                  },
                  {
                    label: 'Request referral',
                    path: '/student/alumni',
                  },
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
