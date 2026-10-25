
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const location = useLocation();


  const token = localStorage.getItem("token");

  const userData = JSON.parse(
    localStorage.getItem("userData") || "{}"
  );


  const currentRole = (
    localStorage.getItem("role") ||
    userData?.role ||
    ""
  )
    .toLowerCase()
    .trim();


  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }


  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(currentRole)
  ) {
    switch (currentRole) {
      case "student":
        return <Navigate to="/student/dashboard" replace />;

      case "alumni":
        return <Navigate to="/alumni/dashboard" replace />;

      case "admin":
        return <Navigate to="/admin/dashboard" replace />;

      default:
        return <Navigate to="/login" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
