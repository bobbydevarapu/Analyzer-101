import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface Props {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({
  children,
  allowedRoles,
}: Props) => {

  const { user, initialized } = useAuth();

  // WAIT UNTIL AUTH LOADS
  if (!initialized) {
    return (
      <div className="min-h-screen bg-[#050816]" />
    );
  }

  const adminToken =
    localStorage.getItem("adminToken");

  const authToken =
    localStorage.getItem("authToken");

  // =========================
  // ADMIN ROUTES
  // =========================

  if (allowedRoles?.includes("admin")) {

    if (!adminToken) {
      return (
        <Navigate
          to="/login?role=admin"
          replace
        />
      );
    }

    return <>{children}</>;
  }

  // =========================
  // NORMAL AUTH ROUTES
  // =========================

  if (!authToken || !user) {
    return <Navigate to="/login" replace />;
  }

  // =========================
  // ROLE CHECK
  // =========================

  if (
    allowedRoles &&
    !allowedRoles.includes(user.role)
  ) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;