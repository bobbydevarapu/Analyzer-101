import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Folders,
  Home,
  LogOut,
  Settings,
  ShieldAlert,
  Users,
  X,
} from "lucide-react";

import type { ComponentType } from "react";

import { AdminPage, useAdmin } from "./AdminContext";

const glassCard =
  "rounded-3xl border border-white/10 bg-[#081120]/88 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.35)]";

const navButton =
  "group relative flex items-center rounded-2xl border px-3 py-3 text-sm transition-all duration-300";

const activeNav =
  "border-orange-400/30 bg-orange-500/15 text-orange-300 shadow-[0_0_20px_rgba(249,115,22,0.12)]";

const inactiveNav =
  "border-white/10 bg-[#081120]/50 text-slate-300 hover:border-orange-400/20 hover:bg-[#0b1a31] hover:text-white";

export function Sidebar() {
  const {
    collapsed,
    setCollapsed,
    mobileOpen,
    setMobileOpen,
    activePage,
    setActivePage,
  } = useAdmin();

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.assign("/");
  };

  const items = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Home,
    },
    {
      id: "assignments",
      label: "Assignments",
      icon: Folders,
    },
    {
      id: "teachers",
      label: "Teachers",
      icon: Users,
    },
    {
      id: "students",
      label: "Students",
      icon: BookOpen,
    },
    {
      id: "alerts",
      label: "Alerts",
      icon: ShieldAlert,
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
    },
  ] as const satisfies {
    id: AdminPage;
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
        const active = activePage === item.id;

        return (
          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ y: -1 }}
            key={item.id}
            onClick={() => {
              setActivePage(item.id);
              onSelect?.();
            }}
            className={`
              ${navButton}
              ${active ? activeNav : inactiveNav}
              ${compact ? "justify-center" : "gap-3"}
            `}
            title={compact ? item.label : undefined}
          >
            {/* ACTIVE GLOW */}
            {active && (
              <div className="absolute inset-0 rounded-2xl bg-orange-500/5 blur-xl" />
            )}

            <item.icon className="relative z-10 h-4 w-4 shrink-0" />

            {!compact && (
              <span className="relative z-10 font-medium tracking-[0.01em]">
                {item.label}
              </span>
            )}
          </motion.button>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* MOBILE SIDEBAR */}
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
              transition={{ duration: 0.25 }}
              className="
                fixed
                left-0
                top-0
                z-50
                h-screen
                w-72
                border-r
                border-white/10
                bg-[#050816]/98
                p-4
                backdrop-blur-2xl
                lg:hidden
              "
            >
              <div className="flex h-full flex-col gap-4">

                {/* TOP */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm tracking-[0.25em] text-orange-300">
                      ADMIN
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Control Center
                    </p>
                  </div>

                  <button
                    onClick={() => setMobileOpen(false)}
                    className="
                      rounded-xl
                      border
                      border-white/10
                      bg-[#0b1627]
                      p-2
                      text-slate-300
                      transition
                      hover:border-orange-400/30
                      hover:text-orange-300
                    "
                    title="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* NAVIGATION */}
                <NavItems
                  onSelect={() => setMobileOpen(false)}
                />

                {/* LOGOUT */}
                <button
                  onClick={handleLogout}
                  className="
                    mt-auto
                    flex
                    items-center
                    gap-3
                    rounded-2xl
                    border
                    border-white/10
                    bg-[#0b1627]
                    px-4
                    py-3
                    text-sm
                    text-slate-300
                    transition-all
                    hover:border-red-500/30
                    hover:bg-red-500/10
                    hover:text-red-300
                  "
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* DESKTOP SIDEBAR */}
      <aside
        className={`
          hidden
          lg:fixed
          lg:left-4
          lg:top-1/2
          lg:z-30
          lg:flex
          lg:-translate-y-1/2
          lg:flex-col
          lg:transition-all
          lg:duration-300
          ${glassCard}
          ${
            collapsed
              ? "lg:w-[88px] lg:p-3"
              : "lg:w-[255px] lg:p-5"
          }
        `}
      >
        {/* TOP */}
        <div
          className={`mb-5 flex items-center ${
            collapsed
              ? "justify-center"
              : "justify-between"
          }`}
        >
          {!collapsed && (
            <div>
              <p className="text-sm tracking-[0.24em] text-orange-300">
                ADMIN
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Control Center
              </p>
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="
              rounded-xl
              border
              border-white/10
              bg-[#0b1627]
              p-2
              text-slate-300
              transition
              hover:border-orange-400/30
              hover:text-orange-300
            "
            title={
              collapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* NAV ITEMS */}
        <NavItems compact={collapsed} />
      </aside>
    </>
  );
}

export default Sidebar;