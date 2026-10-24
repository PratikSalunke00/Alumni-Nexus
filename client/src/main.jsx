import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router';
import './index.css';
import LandingPage from './pages/LandingPage.jsx';
import Login from './views/Login.jsx';
import SignUp from './views/SignUp.jsx';
import StudentDashboard from './pages/student/StudentDashboard.jsx';
import AlumniDashboard from './pages/alumni/AlumniDashboard.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import Profile from './views/Profile.jsx';
import AdminVerificationQueue from './pages/admin/AdminVerificationQueue.jsx';
import StudentOpportunitiesPage from './pages/student/StudentOpportunitiesPage.jsx';
import StudentReferralsPage from './pages/student/StudentReferralsPage.jsx';
import StudentMentorshipPage from './pages/student/StudentMentorshipPage.jsx';
import AlumniOpportunitiesPage from './pages/alumni/AlumniOpportunitiesPage.jsx';
import AlumniReferralsPage from './pages/alumni/AlumniReferralsPage.jsx';
import AlumniMentorshipPage from './pages/alumni/AlumniMentorshipPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={['student', 'alumni', 'admin']}>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/profile"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/opportunities"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentOpportunitiesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/referrals"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentReferralsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/mentorship"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentMentorshipPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/alumni/dashboard"
        element={
          <ProtectedRoute allowedRoles={['alumni']}>
            <AlumniDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/alumni/profile"
        element={
          <ProtectedRoute allowedRoles={['alumni']}>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/alumni/opportunities"
        element={
          <ProtectedRoute allowedRoles={['alumni']}>
            <AlumniOpportunitiesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/alumni/referrals"
        element={
          <ProtectedRoute allowedRoles={['alumni']}>
            <AlumniReferralsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/alumni/mentorship"
        element={
          <ProtectedRoute allowedRoles={['alumni']}>
            <AlumniMentorshipPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/verification-requests"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminVerificationQueue />
          </ProtectedRoute>
        }
      />
    </Routes>
  </BrowserRouter>
);

