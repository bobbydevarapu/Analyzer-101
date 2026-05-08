import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const PublicOnlyRoute = ({
  children,
}: {
  children: React.ReactNode;
}) => {

  const { user, initialized } = useAuth();

  if (!initialized) {
    return (
      <div className="min-h-screen bg-[#050816]" />
    );
  }

  const authToken =
    localStorage.getItem("authToken");

  const teacherToken =
    localStorage.getItem("teacherToken");

  const adminToken =
    localStorage.getItem("adminToken");

  // =========================
  // ADMIN
  // =========================

  if (adminToken) {
    return (
      <Navigate
        to="/admin-dashboard"
        replace
      />
    );
  }

  // =========================
  // TEACHER
  // =========================

  if (teacherToken && user?.role === "teacher") {
    return (
      <Navigate
        to="/teacher-dashboard"
        replace
      />
    );
  }

  // =========================
  // STUDENT
  // =========================

  if (authToken && user?.role === "student") {
    return (
      <Navigate
        to="/student-dashboard"
        replace
      />
    );
  }

  return <>{children}</>;
};

export default PublicOnlyRoute;