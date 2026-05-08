import { motion } from "framer-motion";
import {
  Bell,
  LogOut,
  Menu,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import AiALogo from "../../components/AiALogo";

import { useAdmin } from "./AdminContext";

export function Topbar() {
  const { setMobileOpen } = useAdmin();

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();

    navigate("/login?role=admin", {
      replace: true,
    });
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-30 w-full px-3 pt-2 sm:px-4 md:px-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="
          mx-auto
          flex
          h-16
          w-full
          max-w-[1500px]
          items-center
          gap-3
          rounded-2xl
          border
          border-white/10
          bg-[#081120]/90
          px-3
          shadow-[0_12px_42px_rgba(0,0,0,0.45)]
          backdrop-blur-2xl
          md:px-4
        "
      >
        {/* LEFT */}
        <button
          type="button"
          onClick={handleRefresh}
          title="Reload admin dashboard"
          aria-label="Reload admin dashboard"
          className="
            flex
            items-center
            gap-2
            transition
            hover:opacity-80
          "
        >
          <AiALogo size="text-sm md:text-base" />
        </button>

        {/* CENTER */}
        <div className="hidden flex-1 justify-center md:flex">
          <div
            className="
              flex
              items-center
              rounded-full
              border
              border-white/10
              bg-[#0b1627]
              px-8
              py-2
              shadow-[0_0_20px_rgba(255,255,255,0.02)]
            "
          >
            <span
              className="
                text-xs
                uppercase
                tracking-[0.24em]
                text-slate-300
              "
            >
              ADMIN WORKSPACE
            </span>
          </div>
        </div>

        {/* RIGHT */}
        <div className="ml-auto flex items-center gap-2">

          {/* ALERT BUTTON */}
          <button
            type="button"
            className="
              hidden
              lg:flex
              items-center
              justify-center
              rounded-xl
              border
              border-white/10
              bg-[#0b1627]
              p-2.5
              text-slate-300
              transition
              hover:border-orange-400/30
              hover:text-orange-300
            "
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>

          {/* LOGOUT */}
          <button
            type="button"
            onClick={handleLogout}
            className="
              hidden
              lg:flex
              items-center
              gap-2
              rounded-xl
              border
              border-white/10
              bg-[#0b1627]
              px-4
              py-2
              text-sm
              text-white/90
              transition-all
              duration-300
              hover:border-red-500/30
              hover:bg-red-500/10
              hover:text-red-300
            "
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>

          {/* MOBILE MENU */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="
              rounded-xl
              border
              border-white/10
              bg-[#0b1627]
              p-2.5
              text-slate-300
              transition
              hover:border-orange-400/30
              hover:text-orange-300
              lg:hidden
            "
            title="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </motion.div>
    </header>
  );
}

export default Topbar;