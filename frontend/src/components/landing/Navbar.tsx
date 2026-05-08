import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mobileLogoIndex, setMobileLogoIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMobileLogoIndex((prev) => (prev + 1) % 3);
    }, 700);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <motion.header
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 inset-x-0 z-50 px-3 sm:px-6 pt-2"
    >
      <div className="mx-auto max-w-[1320px]">
        <div className="landing-top-frame rounded-full px-2 py-2 sm:px-3 sm:translate-x-2 lg:translate-x-4">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-4">
            <Link
              to="/"
              className="landing-navbar-rail h-12 w-12 sm:h-14 sm:w-14 rounded-full flex items-center justify-center"
              aria-label="Home"
            >
              <span className="sm:hidden text-base font-display font-semibold tracking-[0.2em] inline-flex items-center justify-center min-w-[1ch]">
                <motion.span
                  key={mobileLogoIndex}
                  className={mobileLogoIndex === 1 ? "text-primary drop-shadow-[0_0_12px_rgba(212,156,64,0.6)] glow-accent" : "text-foreground"}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  {mobileLogoIndex === 0 ? "A" : mobileLogoIndex === 1 ? "I" : "A"}
                </motion.span>
              </span>

              <span className="hidden sm:inline-flex text-sm sm:text-base font-display font-semibold tracking-[0.2em] items-center gap-0.5">
                <motion.span
                  className="text-foreground"
                  animate={{ opacity: [0.35, 1, 0.35], y: [1, 0, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", times: [0, 0.2, 0.4] }}
                >
                  A
                </motion.span>
                <motion.span
                  className="text-primary drop-shadow-[0_0_12px_rgba(212,156,64,0.6)] glow-accent"
                  animate={{ opacity: [0.35, 1, 0.35], y: [1, 0, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.35, times: [0, 0.2, 0.4] }}
                >
                  I
                </motion.span>
                <motion.span
                  className="text-foreground"
                  animate={{ opacity: [0.35, 1, 0.35], y: [1, 0, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.7, times: [0, 0.2, 0.4] }}
                >
                  A
                </motion.span>
              </span>
            </Link>

            <div className="landing-navbar-rail h-12 sm:h-14 rounded-full flex items-center justify-between px-4 sm:px-8 overflow-hidden">
              {/* Mobile text - only visible on small screens */}
              <div className="md:hidden flex-1">
                <motion.div
                  key={mobileLogoIndex}
                  className="text-sm font-mono uppercase tracking-[0.15em] text-primary drop-shadow-[0_0_12px_rgba(212,156,64,0.4)] leading-tight"
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  {mobileLogoIndex === 0 ? "Assignment" : mobileLogoIndex === 1 ? "Integrity" : "Analyzer"}
                </motion.div>
              </div>

              {/* Desktop navigation - only visible on medium screens and up */}
              <nav className="hidden md:flex items-center gap-10 pl-6 lg:pl-12 text-xs font-mono uppercase tracking-[0.22em] text-muted-foreground">
                <a href="#features" className="hover:text-foreground transition-colors">Product</a>
                <a href="#how" className="hover:text-foreground transition-colors">Features</a>
                <a href="#access" className="hover:text-foreground transition-colors">Access</a>
              </nav>

              <Link
                to="/login"
                className="hidden sm:inline-flex items-center justify-center rounded-full border border-primary/60 px-4 py-1.5 text-xs font-mono uppercase tracking-[0.2em] text-primary hover:bg-primary/10 transition-colors"
              >
                Login
              </Link>
            </div>

            <div className="flex items-center justify-end gap-2">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden h-12 w-12 sm:h-14 sm:w-14 rounded-full border border-foreground/20 flex items-center justify-center text-foreground hover:bg-foreground/10 transition-colors"
                aria-label="Toggle menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>

              <Link
                to="/signup"
                className="hidden md:inline-flex h-12 sm:h-14 rounded-full px-4 sm:px-6 items-center justify-center text-sm sm:text-base font-mono tracking-[0.08em] border border-foreground/20 bg-foreground text-background hover:bg-foreground/90 transition-colors"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile menu with improved readability */}
        <motion.div
          initial={false}
          animate={{ opacity: isMenuOpen ? 1 : 0, pointerEvents: isMenuOpen ? "auto" : "none" }}
          transition={{ duration: 0.2 }}
          className="md:hidden fixed inset-0 z-[70]"
        >
          <div
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            onClick={() => setIsMenuOpen(false)}
            aria-hidden="true"
          />

          <motion.div
            initial={false}
            animate={{ y: isMenuOpen ? 0 : -12, opacity: isMenuOpen ? 1 : 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute inset-x-0 top-24 mx-3"
          >
            <div className="landing-menu-glass backdrop-blur-xl bg-black/85 rounded-2xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
              <nav className="flex flex-col gap-2">
                <a
                  href="#features"
                  className="text-sm font-mono uppercase tracking-[0.22em] text-white hover:text-primary transition-colors py-3 px-4 rounded-lg bg-white/5 hover:bg-primary/15"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Product
                </a>
                <a
                  href="#how"
                  className="text-sm font-mono uppercase tracking-[0.22em] text-white hover:text-primary transition-colors py-3 px-4 rounded-lg bg-white/5 hover:bg-primary/15"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Features
                </a>
                <a
                  href="#access"
                  className="text-sm font-mono uppercase tracking-[0.22em] text-white hover:text-primary transition-colors py-3 px-4 rounded-lg bg-white/5 hover:bg-primary/15"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Access
                </a>
                <Link
                  to="/login"
                  className="text-sm font-mono uppercase tracking-[0.22em] text-primary hover:text-white transition-colors py-3 px-4 rounded-lg bg-primary/10 hover:bg-primary/20"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
              </nav>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.header>
  );
};

export default Navbar;
