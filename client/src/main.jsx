import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

// Public / Auth
import LandingPage from "./views/LandingPage.jsx";
import Login from "./views/auth/Login.jsx";
import SignUp from "./views/auth/Signup.jsx";

// Student views
import StudentDashboard from "./views/student/StudentDashboard.jsx";
import StudentOpportunitiesPage from "./views/student/StudentOpportunitiesPage.jsx";
import StudentReferralsPage from "./views/student/StudentReferralsPage.jsx";
import StudentMentorshipPage from "./views/student/StudentMentorshipPage.jsx";
import StudentProfile from "./views/student/StudentProfile.jsx";
import StudentAlumniDirectoryPage from "./views/student/StudentAlumniDirectoryPage.jsx";

// Alumni views
import AlumniDashboard from "./views/alumni/AlumniDashboard.jsx";
import AlumniOpportunitiesPage from "./views/alumni/AlumniOpportunitiesPage.jsx";
import AlumniReferralsPage from "./views/alumni/AlumniReferralsPage.jsx";
import AlumniMentorshipPage from "./views/alumni/AlumniMentorshipPage.jsx";
import AlumniInsightsPage from "./views/alumni/AlumniInsightsPage.jsx";

// Admin views
import AdminDashboard from "./views/admin/AdminDashboard.jsx";
import AdminVerificationQueue from "./views/admin/AdminVerificationQueue.jsx";
import AdminUsersPage from "./views/admin/AdminUsersPage.jsx";
import AdminOpportunitiesPage from "./views/admin/AdminOpportunitiesPage.jsx";
import AdminReportsPage from "./views/admin/AdminReportsPage.jsx";
import AdminSettingsPage from "./views/admin/AdminSettingsPage.jsx";
import AdminInvitationCodesPage from "./views/admin/AdminInvitationCodesPage.jsx";

// Guards
import ProtectedRoute from "./components/ProtectedRoute.jsx";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />

      {/* ─── STUDENT ─── */}
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
            <StudentProfile />
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
        path="/student/alumni"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentAlumniDirectoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/messages"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentMentorshipPage /> {/* placeholder until messaging is built */}
          </ProtectedRoute>
        }
      />

      {/* ─── ALUMNI ─── */}
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
            <StudentProfile />
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
            <AlumniInsightsPage />
          </ProtectedRoute>
        }
      />

      {/* ─── ADMIN ─── */}
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
            <AdminUsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/opportunities"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminOpportunitiesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminSettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/invitation-codes"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminInvitationCodesPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  </BrowserRouter>
);
