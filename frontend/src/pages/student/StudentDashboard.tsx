import { lazy, Suspense, useCallback, useMemo, useState } from "react";

import CanvasCursor from "../../components/landing/CanvasCursor";
import { useAuth } from "../../context/AuthContext";
import StudentSidebar from "./components/StudentSidebar";
import StudentTopbar from "./components/StudentTopbar";
import { StudentTab } from "./types";

const DashboardSection = lazy(() => import("./sections/DashboardSection"));
const AssignmentsSection = lazy(() => import("./sections/AssignmentsSection"));
const LiveTestsSection = lazy(() => import("./sections/LiveTestsSection"));
const ResultsSection = lazy(() => import("./sections/ResultsSection"));
const ViolationsSection = lazy(() => import("./sections/ViolationsSection"));
const ProfileSection = lazy(() => import("./sections/ProfileSection"));
const SettingsSection = lazy(() => import("./sections/SettingsSection"));

const StudentDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<StudentTab>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  const email = user?.email || user?.username || "";

  const section = useMemo(() => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardSection email={email} />;
      case "assignments":
        return <AssignmentsSection email={email} />;
      case "livetests":
        return <LiveTestsSection email={email} />;
      case "results":
        return <ResultsSection email={email} />;
      case "violations":
        return <ViolationsSection email={email} />;
      case "profile":
        return <ProfileSection email={email} />;
      case "settings":
        return <SettingsSection email={email} />;
      default:
        return <DashboardSection email={email} />;
    }
  }, [activeTab, email]);

  const handleSetTab = useCallback((tab: StudentTab) => {
    setActiveTab(tab);
  }, []);

  return (
    <div className="landing-page relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <CanvasCursor />

      <StudentSidebar
        activeTab={activeTab}
        setActiveTab={handleSetTab}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        sidebarExpanded={sidebarExpanded}
        setSidebarExpanded={setSidebarExpanded}
      />

      <div className={`min-h-screen transition-all duration-300 ${sidebarExpanded ? "lg:ml-[280px]" : "lg:ml-[100px]"}`}>
        <StudentTopbar setMobileOpen={setMobileOpen} />

        <main className="px-3 py-3 sm:px-4 md:px-6 lg:px-8">
          <Suspense
            fallback={
              <div className="rounded-2xl border border-white/10 bg-[#081120]/85 p-4 text-sm text-slate-400">
                Loading section...
              </div>
            }
          >
            {section}
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
