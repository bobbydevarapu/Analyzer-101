import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AiALogo from "../components/AiALogo";
import CanvasCursor from "../components/landing/CanvasCursor";
import { useAuth } from "../context/AuthContext";

const API_BASE =
  import.meta.env.VITE_BACKEND_URL ||
  "https://aia-101.up.railway.app";

const Login = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [params] = useSearchParams();

  const initialRole =
    (params.get("role") as "student" | "teacher" | "admin") || "student";

  const [role, setRole] = useState(initialRole);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Toast system
  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("username", identifier);
      formData.append("password", password);

      const endpoint =
        role === "admin" ? "/admin/login" : "/login";

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Invalid credentials");
      }

      if (role === "admin") {
        localStorage.setItem("adminToken", data.token);
        authLogin({
          username: data.display_name || identifier,
          email: data.email || identifier,
          role: "admin",
        });
        navigate("/admin-dashboard", { replace: true });
      } else {
        if (data.token) {
          localStorage.setItem("authToken", data.token);
          if (data.role === "teacher") {
            localStorage.setItem("teacherToken", data.token);
          }
        }

        authLogin({
          username: data.display_name || identifier,
          email: data.email || identifier,
          role: data.role,
        });

        if (data.role === "student") navigate("/student-dashboard", { replace: true });
        else if (data.role === "teacher") navigate("/teacher-dashboard", { replace: true });
      }
    } catch (err: any) {
      setToast({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="landing-page min-h-screen flex items-center justify-center px-4 sm:px-6 py-12 sm:py-24 relative overflow-hidden">
      <CanvasCursor />

      {/* LOGO */}
      <div
        onClick={() => window.location.reload()}
        className="absolute top-4 sm:top-6 left-4 sm:left-6 z-10 cursor-pointer"
      >
        <AiALogo size="text-lg sm:text-xl" />
      </div>

      {/* BACK */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 sm:top-6 right-4 sm:right-6 flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-white z-10 group"
      >
        <ArrowLeft className="w-4 sm:w-5 h-4 sm:h-5 transition group-hover:-translate-x-1" />
        <span className="hidden sm:inline">Back</span>
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-3">
          Welcome <span className="text-gradient">back</span>
        </h1>

        <p className="text-xs sm:text-sm md:text-base text-muted-foreground mb-6 sm:mb-10">
          Sign in to continue to your workspace.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-5">

          {/* ===== ROLE SWITCH ===== */}
          <div className="relative flex rounded-full border border-border bg-card/40 p-1 overflow-hidden">

            <div
              className={`absolute top-1 bottom-1 left-1 w-[calc(33.33%-4px)]
                rounded-full bg-gradient-to-r from-orange-400/20 via-orange-400/10 to-transparent
                transition-all duration-300
                ${role === "student" ? "translate-x-0" : ""}
                ${role === "teacher" ? "translate-x-full" : ""}
                ${role === "admin" ? "translate-x-[200%]" : ""}
              `}
            />

            {(["student", "teacher", "admin"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`relative z-10 flex-1 py-2 sm:py-3 text-[10px] sm:text-xs uppercase tracking-widest font-medium transition-all
                  ${
                    role === r
                      ? "text-white"
                      : "text-muted-foreground hover:text-white"
                  }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* INPUTS */}
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            placeholder="Email"
            className="w-full rounded-2xl border border-border bg-input px-4 sm:px-5 py-3 sm:py-4 text-sm placeholder:text-muted-foreground"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Password"
            className="w-full rounded-2xl border border-border bg-input px-4 sm:px-5 py-3 sm:py-4 text-sm placeholder:text-muted-foreground"
          />

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="landing-access-btn w-full inline-flex items-center justify-center gap-2 rounded-full px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium tracking-wide transition-transform hover:scale-[1.03] disabled:opacity-60"
          >
            <span className="landing-access-btn-icon">▶</span>
            <span className="hidden sm:inline">{loading ? "Logging in..." : `Continue as ${role}`}</span>
            <span className="inline sm:hidden">{loading ? "..." : "Continue"}</span>
          </button>

          <p className="text-center text-xs sm:text-sm text-muted-foreground">
            New to AiA?{" "}
            <Link
              to={
                role === "teacher"
                  ? "/signup?role=teacher"
                  : "/signup?role=student"
              }
              className="text-brand-cyan hover:underline"
            >
              Sign up
            </Link>
          </p>
        </form>
      </motion.div>

      {/* ===== TOAST (BOTTOM RIGHT) ===== */}
      {toast && (
        <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50">
          <div
            className={`px-4 sm:px-6 py-3 sm:py-4 rounded-xl backdrop-blur-lg border shadow-lg text-xs sm:text-sm
              ${
                toast.type === "success"
                  ? "bg-green-500/10 border-green-500/30 text-green-400"
                  : "bg-red-500/10 border-red-500/30 text-red-400"
              }`}
          >
            {toast.text}
          </div>
        </div>
      )}
    </main>
  );
};

export default Login;