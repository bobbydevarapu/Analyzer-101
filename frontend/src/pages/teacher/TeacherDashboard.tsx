import { useState } from "react";

import CanvasCursor from "../../components/landing/CanvasCursor";

import TeacherSidebar from "./components/TeacherSidebar";
import TeacherTopbar from "./components/TeacherTopbar";

import AnalysisSection from "./sections/AnalysisSection";
import DashboardSection from "./sections/DashboardSection";
import LiveTestsSection from "./sections/LiveTestsSection";
import ReportsSection from "./sections/ReportsSection";
import SettingsSection from "./sections/SettingsSection";
import ViolationsSection from "./sections/ViolationsSection";

export type TeacherTab =
  | "dashboard"
  | "analysis"
  | "reports"
  | "violations"
  | "livetests"
  | "settings";

const TeacherDashboard = () => {

  const [activeTab, setActiveTab] =
    useState<TeacherTab>("dashboard");

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [sidebarExpanded, setSidebarExpanded] =
    useState(true);

  // =========================
  // GLOBAL ANALYSIS STATE
  // =========================

  const [analysis, setAnalysis] =
    useState<any>(null);

  const [assignmentId, setAssignmentId] =
    useState("");

  // =========================
  // RENDER SECTION
  // =========================

  const renderSection = () => {

    switch (activeTab) {

      case "dashboard":

        return (
          <DashboardSection />
        );

      case "analysis":

        return (
          <AnalysisSection
            analysis={analysis}
            setAnalysis={setAnalysis}
            assignmentId={assignmentId}
            setAssignmentId={setAssignmentId}
          />
        );

      case "reports":

        return (
          <ReportsSection
            analysis={analysis}
          />
        );

      case "violations":

        return (
          <ViolationsSection
            analysis={analysis}
          />
        );

      case "livetests":

        return (
          <LiveTestsSection />
        );

      case "settings":

        return (
          <SettingsSection />
        );

      default:

        return (
          <DashboardSection />
        );
    }
  };

  return (

    <div
      className="
        landing-page
        relative
        min-h-screen
        overflow-hidden
        bg-[#050816]
        text-white
      "
    >

      <CanvasCursor />

      <TeacherSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        sidebarExpanded={sidebarExpanded}
        setSidebarExpanded={setSidebarExpanded}
      />

      <div
        className={`
          min-h-screen
          overflow-hidden
          transition-all duration-300
          lg:${sidebarExpanded ? "ml-[280px]" : "ml-[100px]"}
        `}
      >

        <TeacherTopbar
          setMobileOpen={setMobileOpen}
        />

        <main
          className="
            px-3
            py-3
            sm:px-4
            md:px-6
            lg:px-8
            md:py-4
            overflow-hidden
          "
        >

          {renderSection()}

        </main>

      </div>

    </div>
  );
};

export default TeacherDashboard;