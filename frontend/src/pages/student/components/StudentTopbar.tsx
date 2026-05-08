import { LogOut, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";

import AiALogo from "../../../components/AiALogo";
import { useAuth } from "../../../context/AuthContext";

type Props = {
  setMobileOpen: (open: boolean) => void;
};

const StudentTopbar = ({ setMobileOpen }: Props) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login?role=student", { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 px-3 pt-2 sm:px-4 md:px-6">
      <div className="flex h-16 items-center gap-3 rounded-2xl border border-white/10 bg-[#081120]/90 px-3 shadow-[0_12px_42px_rgba(0,0,0,0.45)] backdrop-blur-2xl md:px-4">
        <button
          type="button"
          onClick={() => window.location.reload()}
          title="Reload student dashboard"
          aria-label="Reload student dashboard"
          className="flex items-center gap-2"
        >
          <AiALogo size="text-sm md:text-base" />
        </button>

        <div className="hidden flex-1 justify-center md:flex">
          <div className="rounded-full border border-white/10 bg-[#0b1627] px-8 py-2">
          <span className="text-xs uppercase tracking-[0.24em] text-slate-300">
            Student Workspace
          </span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={handleLogout}
            className="hidden items-center gap-2 rounded-xl border border-white/10 bg-[#0b1627] px-4 py-2 text-sm text-white/90 transition hover:border-orange-400/30 hover:text-orange-300 lg:flex"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>

          <button
            type="button"
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

export default StudentTopbar;
