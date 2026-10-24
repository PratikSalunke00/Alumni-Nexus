import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router';
import './index.css';
import LandingPage from './pages/LandingPage.jsx';
import Login from './views/Login.jsx';
import SignUp from './views/SignUp.jsx';
import StudentDashboard from './pages/student/StudentDashboard.jsx';
import AlumniDashboard from './pages/alumni/AlumniDashboard.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
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
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  </BrowserRouter>
);

