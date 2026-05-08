import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import { ReactNode } from "react";
import { Link } from "react-router-dom";

interface DashboardShellProps {
  role: "Student" | "Teacher" | "Admin";
  children: ReactNode;
}

const DashboardShell = ({ role, children }: DashboardShellProps) => {
  const dashboardPath =
    role === "Student"
      ? "/student-dashboard"
      : role === "Teacher"
      ? "/teacher-dashboard"
      : "/admin-dashboard";

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.assign("/");
  };

  return (
    <main className="min-h-screen landing-shell overflow-x-hidden relative">
      
      {/* HEADER */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 inset-x-0 z-50 flex justify-center px-4 pt-3"
      >
        <div className="w-full max-w-6xl landing-top-frame rounded-full px-3 py-2">
          <nav className="flex items-center justify-between">

            {/* LOGO */}
            <Link to={dashboardPath} className="font-display text-sm sm:text-lg font-bold tracking-wider">
              <span className="text-gradient">Ai</span>A
            </Link>

            {/* CENTER */}
            <div className="landing-navbar-rail h-10 sm:h-12 flex items-center justify-center px-4 flex-1 mx-3 rounded-full">
              <span className="text-[10px] sm:text-xs tracking-widest text-brand-cyan uppercase">
                {role} Workspace
              </span>
            </div>

            {/* LOGOUT */}
            <button
              onClick={handleLogout}
              className="landing-navbar-rail px-3 py-2 rounded-full text-xs flex items-center gap-2 hover:text-primary"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Logout</span>
            </button>

          </nav>
        </div>
      </motion.header>

      {/* CONTENT */}
      <div className="pt-28 sm:pt-32 px-4 sm:px-6 pb-16 max-w-6xl mx-auto">
        {children}
      </div>
    </main>
  );
};

export default DashboardShell;