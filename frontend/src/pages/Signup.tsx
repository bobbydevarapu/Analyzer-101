import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AiALogo from "../components/AiALogo";
import CanvasCursor from "../components/landing/CanvasCursor";

const API_BASE =
  import.meta.env.VITE_BACKEND_URL ||
  "https://aia-010.up.railway.app";

const Signup = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const initialRole = params.get("role") || "student";

  const [role, setRole] = useState<"student" | "teacher">(
    initialRole === "teacher" ? "teacher" : "student"
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // AUTO HIDE TOAST
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password) {
      setToast({ type: "error", text: "All fields are required" });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("role", role);

      const res = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setToast({
          type: "success",
          text:
            role === "teacher"
              ? "Account pending admin approval"
              : "Account created successfully",
        });

        setName("");
        setEmail("");
        setPassword("");

        if (role === "student") {
          setTimeout(() => navigate("/login?role=student"), 1500);
        }
      } else {
        setToast({
          type: "error",
          text: data.detail || "Signup failed",
        });
      }
    } catch {
      setToast({
        type: "error",
        text: "Server not reachable",
      });
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
        className="absolute top-4 sm:top-6 right-4 sm:right-6 flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-white z-10"
      >
        <ArrowLeft className="w-4 sm:w-5 h-4 sm:h-5" />
        <span className="hidden sm:inline">Back</span>
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4">
          Create your <span className="text-gradient">account</span>
        </h1>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-6">

          {/* ROLE SWITCH */}
          <div className="relative flex rounded-full border border-border bg-card/40 p-1 overflow-hidden">
            <div
              className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)]
                rounded-full bg-orange-500/20 transition-all duration-300
                ${role === "student" ? "translate-x-0" : "translate-x-full"}`}
            />

            {(["student", "teacher"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`relative z-10 flex-1 py-2 sm:py-3 text-[10px] sm:text-xs uppercase tracking-widest font-medium transition-all
                  ${role === r ? "text-white" : "text-muted-foreground hover:text-white"}`}
              >
                {r}
              </button>
            ))}
          </div>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="w-full bg-input border border-border rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-sm placeholder:text-muted-foreground"
          />

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full bg-input border border-border rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-sm placeholder:text-muted-foreground"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full bg-input border border-border rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-sm placeholder:text-muted-foreground"
          />

          <button
            type="submit"
            disabled={loading}
            className="landing-access-btn w-full rounded-full py-3 sm:py-4 flex items-center justify-center gap-2 text-sm font-medium"
          >
            <span className="landing-access-btn-icon">▶</span>
            <span className="hidden sm:inline">{loading ? "Creating..." : `Create ${role} Account`}</span>
            <span className="inline sm:hidden">{loading ? "Creating..." : "Create"}</span>
          </button>
        </form>

        <p className="text-center text-xs sm:text-sm text-muted-foreground mt-4 sm:mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-cyan hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50">
          <div
            className={`px-4 sm:px-6 py-3 sm:py-4 rounded-xl backdrop-blur-lg border text-xs sm:text-sm
              ${toast.type === "success"
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"}`}
          >
            {toast.text}
          </div>
        </div>
      )}
    </main>
  );
};

export default Signup;