import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import "./index.css";
import LandingPage from "./views/LandingPage.jsx";
import Login from "./views/auth/Login.jsx";
import SignUp from "./views/auth/Signup.jsx";
import StudentDashboard from "./views/student/StudentDashboard.jsx";
import AlumniDashboard from "./views/alumni/AlumniDashboard.jsx";
import AdminDashboard from "./views/admin/AdminDashboard.jsx";
import Profile from "./views/Profile.jsx";
import AdminVerificationQueue from "./views/admin/AdminVerificationQueue.jsx";
import StudentOpportunitiesPage from "./views/student/StudentOpportunitiesPage.jsx";
import StudentReferralsPage from "./views/student/StudentReferralsPage.jsx";
import StudentMentorshipPage from "./views/student/StudentMentorshipPage.jsx";
import AlumniOpportunitiesPage from "./views/alumni/AlumniOpportunitiesPage.jsx";
import AlumniReferralsPage from "./views/alumni/AlumniReferralsPage.jsx";
import AlumniMentorshipPage from "./views/alumni/AlumniMentorshipPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import DashboardShell from "./components/DashboardShell.jsx";
import StudentProfile from "./views/student/StudentProfile.jsx";

const DashboardPlaceholderPage = ({
  role,
  pageTitle,
  eyebrow,
  title,
  description,
}) => (
  <DashboardShell role={role} pageTitle={pageTitle}>
    <div className="space-y-6">
      <section className="rounded-3xl border border-sky-100 bg-sky-50 p-6">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">
          {eyebrow}
        </p>
        <h3 className="mt-2 text-3xl font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 max-w-2xl text-slate-600">{description}</p>
      </section>
    </div>
  </DashboardShell>
);

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />

      <Route path="/student/profile" element={<StudentProfile />} />
      
      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={["student", "alumni", "admin"]}>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/profile"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/messages"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <DashboardPlaceholderPage
              role="student"
              pageTitle="Messages"
              eyebrow="Inbox"
              title="Student messages"
              description="Your alumni conversations, referral follow-ups, and mentorship updates will appear here once you start engaging with the network."
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/opportunities"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentOpportunitiesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/referrals"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentReferralsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/mentorship"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentMentorshipPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/alumni/dashboard"
        element={
          <ProtectedRoute allowedRoles={["alumni"]}>
            <AlumniDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/alumni/profile"
        element={
          <ProtectedRoute allowedRoles={["alumni"]}>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/alumni/opportunities"
        element={
          <ProtectedRoute allowedRoles={["alumni"]}>
            <AlumniOpportunitiesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/alumni/referrals"
        element={
          <ProtectedRoute allowedRoles={["alumni"]}>
            <AlumniReferralsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/alumni/mentorship"
        element={
          <ProtectedRoute allowedRoles={["alumni"]}>
            <AlumniMentorshipPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/alumni/insights"
        element={
          <ProtectedRoute allowedRoles={["alumni"]}>
            <DashboardPlaceholderPage
              role="alumni"
              pageTitle="Insights"
              eyebrow="Network analytics"
              title="Alumni insights"
              description="Track engagement, response rates, and student demand to understand which mentorship and opportunity programs are driving the strongest outcomes."
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/verification-requests"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminVerificationQueue />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardPlaceholderPage
              role="admin"
              pageTitle="Users"
              eyebrow="Access management"
              title="User directory"
              description="Manage student, alumni, and admin accounts, review statuses, and maintain network access for verified members."
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/opportunities"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardPlaceholderPage
              role="admin"
              pageTitle="Opportunities"
              eyebrow="Platform content"
              title="Opportunity moderation"
              description="Review posted roles, approve employer listings, and ensure the network surface remains current and trustworthy."
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardPlaceholderPage
              role="admin"
              pageTitle="Reports"
              eyebrow="Performance"
              title="Network reports"
              description="Review community growth, opportunities matched, and engagement across students and alumni."
            />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardPlaceholderPage
              role="admin"
              pageTitle="Settings"
              eyebrow="System controls"
              title="Admin settings"
              description="Configure platform rules, role permissions, and communications for the Alumni Nexus network."
            />
          </ProtectedRoute>
        }
      />
    </Routes>
  </BrowserRouter>,
);
