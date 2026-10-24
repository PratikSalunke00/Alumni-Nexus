import { Navigate, useLocation } from 'react-router';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const location = useLocation();
  const token = localStorage.getItem('userJwtToken');
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const currentRole = (userData?.role || 'student').toLowerCase();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(currentRole)) {
    const fallback = currentRole === 'alumni' ? '/alumni/dashboard' : '/student/dashboard';
    return <Navigate to={fallback} replace />;
  }

  return children;
};

export default ProtectedRoute;
