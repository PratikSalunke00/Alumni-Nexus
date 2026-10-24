import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router';
import './index.css';
import LandingPage from './pages/LandingPage.jsx';
import Login from './views/Login.jsx';
import SignUp from './views/SignUp.jsx';
import StudentDashboard from './pages/student/StudentDashboard.jsx';
import AlumniDashboard from './pages/alumni/AlumniDashboard.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/student/dashboard" element={<StudentDashboard />} />
      <Route path="/alumni/dashboard" element={<AlumniDashboard />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
    </Routes>
  </BrowserRouter>
);

