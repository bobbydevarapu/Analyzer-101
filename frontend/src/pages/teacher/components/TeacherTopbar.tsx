import { LogOut, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";

import AiALogo from "../../../components/AiALogo";

type Props = {
  setMobileOpen: (value: boolean) => void;
};

const TeacherTopbar = ({
  setMobileOpen,
}: Props) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login?role=teacher", { replace: true });
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (

    <header className="sticky top-0 z-30 px-3 sm:px-4 md:px-6 pt-1.5 md:pt-2">

      <div
        className="
          h-16
          rounded-2xl
          border
          border-white/10
          bg-[#050816]/90
          backdrop-blur-2xl
          shadow-[0_10px_40px_rgba(0,0,0,0.45)]
          flex
          items-center
          justify-between
          px-3 md:px-4
        "
      >

        {/* LEFT - LOGO */}
        <button
          onClick={handleRefresh}
          title="Refresh"
          className="flex items-center gap-2 transition hover:opacity-80 flex-shrink-0"
        >
          <AiALogo size="text-sm md:text-base" />
        </button>

        {/* CENTER */}
        <div className="flex flex-1 justify-center">

          <div
            className="
              hidden
              md:flex
              items-center
              justify-center
              rounded-full
              border
              border-white/10
              bg-[#0c1627]
              px-8
              lg:px-14
              py-2.5
              min-w-[260px]
            "
          >
            <span className="text-xs tracking-[0.28em] uppercase text-slate-300">
              Teacher Workspace
            </span>
          </div>

        </div>

        {/* RIGHT SIDE - LOGOUT & MOBILE MENU */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="hidden items-center gap-2 rounded-xl border border-white/10 bg-[#0b1627] px-4 py-2 text-sm text-white/90 transition hover:border-orange-400/30 hover:text-orange-300 lg:flex"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>

          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-xl border border-white/10 bg-[#0b1627] p-2.5 lg:hidden"
            title="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

      </div>

    </header>
  );
};

export default TeacherTopbar;