import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Gauge,
  PlayCircle,
  Settings,
  UserCircle2,
  X,
} from "lucide-react";
import { ComponentType, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../../context/AuthContext";
import { StudentTab } from "../types";

type Props = {
  activeTab: StudentTab;
  setActiveTab: (tab: StudentTab) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  sidebarExpanded: boolean;
  setSidebarExpanded: (expanded: boolean) => void;
};

const items: {
  id: StudentTab;
  label: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { id: "dashboard", label: "Dashboard", icon: Gauge },
  { id: "assignments", label: "Assignments", icon: BookOpen },
  { id: "livetests", label: "Live Tests", icon: PlayCircle },
  { id: "results", label: "Results", icon: Gauge },
  { id: "violations", label: "Violations", icon: AlertTriangle },
  { id: "profile", label: "Profile", icon: UserCircle2 },
  { id: "settings", label: "Settings", icon: Settings },
];

const StudentSidebar = ({
  activeTab,
  setActiveTab,
  mobileOpen,
  setMobileOpen,
  sidebarExpanded,
  setSidebarExpanded,
}: Props) => {
  const nav = useMemo(() => items, []);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login?role=student", { replace: true });
  };

  const navContent = (onSelect?: () => void) => (
    <nav className="flex flex-1 flex-col gap-2">
      {nav.map((item) => {
        const active = activeTab === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setActiveTab(item.id);
              onSelect?.();
            }}
            className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm transition-all ${
              active
                ? "border-orange-400/30 bg-orange-500/15 text-orange-300"
                : "border-white/10 bg-[#081120]/60 hover:bg-[#0b1a31]"
            }`}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
            />

            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.2 }}
              className="fixed left-0 top-0 z-50 flex h-screen w-72 flex-col gap-4 border-r border-white/10 bg-[#050816] p-4 lg:hidden"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm tracking-[0.2em] text-slate-300">STUDENT</p>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  title="Close menu"
                  className="rounded-lg border border-white/10 p-2"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {navContent(() => setMobileOpen(false))}

              <button
                type="button"
                onClick={handleLogout}
                className="mt-auto flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
              >
                Logout
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <aside className={`hidden lg:fixed lg:left-4 lg:top-1/2 lg:z-30 lg:flex lg:h-auto lg:max-h-[85vh] lg:-translate-y-1/2 lg:flex-col lg:rounded-3xl lg:border lg:border-white/10 lg:bg-[#081120]/85 lg:backdrop-blur-xl lg:transition-all lg:duration-300 ${sidebarExpanded ? "lg:w-[240px] lg:p-5" : "lg:w-[80px] lg:p-3"}`}>
        <div className={`mb-4 flex items-center ${sidebarExpanded ? "justify-between" : "justify-center"}`}>
          {sidebarExpanded && (
            <div>
              <p className="text-sm tracking-[0.24em] text-slate-300">STUDENT</p>
              <p className="text-xs text-slate-500">Workspace</p>
            </div>
          )}
          <button
            type="button"
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

        <nav className="flex flex-1 flex-col gap-2 overflow-y-auto">
          {items.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm transition-all ${active ? "border-orange-400/30 bg-orange-500/15 text-orange-300" : "border-white/10 bg-[#081120]/60 hover:bg-[#0b1a31]"}`}
                title={!sidebarExpanded ? item.label : undefined}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {sidebarExpanded && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default StudentSidebar;
