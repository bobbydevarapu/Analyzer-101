import { AnimatePresence, motion } from "framer-motion";
import {
    BarChart3,
    ChevronLeft,
    ChevronRight,
    ClipboardCheck,
    FileText,
    LogOut,
    Settings,
    ShieldAlert,
    TestTube,
    X
} from "lucide-react";

import type { ComponentType } from "react";

import { TeacherTab } from "../TeacherDashboard";

type Props = {
  activeTab: TeacherTab;
  setActiveTab: (tab: TeacherTab) => void;
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
  sidebarExpanded: boolean;
  setSidebarExpanded: (value: boolean) => void;
};

export function TeacherSidebar({
  activeTab,
  setActiveTab,
  mobileOpen,
  setMobileOpen,
  sidebarExpanded,
  setSidebarExpanded,
}: Props) {

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.assign("/");
  };

  const items = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "analysis", label: "Analysis", icon: ClipboardCheck },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "violations", label: "Violations", icon: ShieldAlert },
    { id: "livetests", label: "Live Tests", icon: TestTube },
    { id: "settings", label: "Settings", icon: Settings },
  ] as const satisfies {
    id: TeacherTab;
    label: string;
    icon: ComponentType<{ className?: string }>;
  }[];

  const NavItems = ({
    compact = false,
    onSelect,
  }: {
    compact?: boolean;
    onSelect?: () => void;
  }) => (
    <nav className="flex flex-1 flex-col gap-2">
      {items.map((item) => {
        const active = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(active ? "dashboard" : item.id);
              onSelect?.();
            }}
            className={`group flex items-center rounded-2xl px-3 py-3 transition-all duration-200 ${
              active
                ? "border border-orange-400/30 bg-orange-500/10 text-orange-300"
                : "border border-transparent hover:bg-white/5"
            } ${compact ? "justify-center" : "gap-3"}`}
          >
            <item.icon className="h-4 w-4 shrink-0" />

            {!compact && (
              <span className="text-sm font-medium">
                {item.label}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* MOBILE */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />

            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ duration: 0.25 }}
              className="fixed left-0 top-0 z-50 h-screen w-72 border-r border-white/10 bg-[#050816] p-4 lg:hidden"
            >
              <div className="flex h-full flex-col gap-4">

                <div className="flex items-center justify-between">
                  <h2 className="text-sm tracking-[0.25em] text-slate-400">
                    MENU
                  </h2>

                  <button
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg p-2 hover:bg-white/5"
                    title="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <NavItems onSelect={() => setMobileOpen(false)} />

                <button
                  onClick={handleLogout}
                  className="mt-auto flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10 transition-all"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>

              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* DESKTOP */}
      <div className="hidden lg:block w-[88px] xl:w-[220px] flex-shrink-0">
        <aside
          className={`fixed left-4 top-1/2 z-40 -translate-y-1/2 flex flex-col gap-4 rounded-[24px] border border-white/10 bg-[#050816]/92 p-4 backdrop-blur-xl transition-all duration-300 ${
            sidebarExpanded ? "w-[240px]" : "w-[80px]"
          }`}
        >
          <div className={`flex items-center ${sidebarExpanded ? "justify-between" : "justify-center"}`}>
            {sidebarExpanded && (
              <div>
                <p className="text-sm tracking-[0.24em] text-slate-300">TEACHER</p>
                <p className="text-xs text-slate-500">Workspace</p>
              </div>
            )}
            <button
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className="rounded-lg border border-white/10 p-1.5 hover:bg-white/5"
              title={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
            >
              {sidebarExpanded ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </div>

          <NavItems compact={!sidebarExpanded} />

        </aside>
      </div>
    </>
  );
}

export default TeacherSidebar;