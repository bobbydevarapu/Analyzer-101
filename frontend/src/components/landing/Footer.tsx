import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const Footer = () => {
  const ref = useRef(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1.15]);
  const y = useTransform(scrollYProgress, [0, 1], [60, 0]);

  return (
    <footer className="relative border-t border-border bg-black/60 py-28 overflow-hidden">
      {/* ===== TOP DOT FADE (FIXED) ===== */}
 <div className="absolute top-0 left-0 w-full h-40 pointer-events-none">
  <div
    className="
      w-full h-full
      bg-[radial-gradient(circle,rgba(255,170,60,0.35)_1px,transparent_1px)]
      bg-[size:14px_14px]
      opacity-40
      [mask-image:linear-gradient(to_bottom,black,transparent)]
    "
  />
  </div>

      {/* ===== DOT LAYER (BOTTOM PREMIUM TOUCH) ===== */}
      <div className="absolute bottom-0 left-0 w-full h-32 opacity-[0.15] pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(circle,rgba(255,180,80,0.4)_1px,transparent_1px)] bg-[size:14px_14px]" />
      </div>

      <div className="mx-auto max-w-6xl px-6 relative z-10">

        {/* ===== AiA ===== */}
        <div ref={ref} className="flex flex-col items-center mb-28 relative">

          <motion.div style={{ scale, y }} className="group relative select-none z-10">
            <div className="relative text-[clamp(7rem,18vw,13rem)] font-black tracking-[-0.08em] leading-none">

              <span className="text-white/80">AiA</span>

              {/* Shine */}
              <span className="
                absolute inset-0
                bg-[linear-gradient(110deg,transparent_30%,rgba(249, 233, 233, 0.45)_50%,transparent_70%)]
                bg-[length:200%_100%]
                bg-clip-text text-transparent
                opacity-0 group-hover:opacity-100
                animate-[shine_2s_linear_infinite]
              ">
                AiA
              </span>

            </div>
          </motion.div>

          {/* ===== WAVE (JUST BELOW TEXT — FIXED POSITION) ===== */}
          <div className="absolute bottom-[-30px] w-full overflow-hidden opacity-25 pointer-events-none">
            <div className="flex w-[200%] animate-waveFlow">

              <svg viewBox="0 0 1440 200" className="w-full">
                <path
                  d="M0,100 C200,40 400,160 600,100 C800,40 1000,160 1200,100 C1300,70 1400,130 1440,100"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.5"
                />
              </svg>

              <svg viewBox="0 0 1440 200" className="w-full">
                <path
                  d="M0,100 C200,40 400,160 600,100 C800,40 1000,160 1200,100 C1300,70 1400,130 1440,100"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.5"
                />
              </svg>

            </div>
          </div>

        </div>

        {/* ===== NAV ===== */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">

          <nav className="flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#" className="hover:text-white transition">Product</a>
            <a href="#" className="hover:text-white transition">Features</a>
            <a href="#" className="hover:text-white transition">Resources</a>
          </nav>

          {/* ===== SOCIALS ===== */}
          <div className="flex items-center gap-5">

            {/* LinkedIn */}
            <a href="https://www.linkedin.com/in/bobbydevarapu/" target="_blank"
              className="text-muted-foreground hover:text-white transition">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 4a2 2 0 110 4 2 2 0 010-4z"/>
              </svg>
            </a>

            {/* GitHub FIXED */}
            <a href="https://github.com/bobbydevarapu" target="_blank"
              className="text-muted-foreground hover:text-white transition">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.38.6.11.82-.26.82-.58v-2.02c-3.34.73-4.04-1.41-4.04-1.41-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.74.08-.74 1.2.09 1.83 1.24 1.83 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.31-5.47-1.34-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.31-.54-1.55.12-3.23 0 0 1-.32 3.3 1.23a11.5 11.5 0 016 0c2.3-1.55 3.3-1.23 3.3-1.23.66 1.68.24 2.92.12 3.23.77.84 1.24 1.91 1.24 3.22 0 4.6-2.8 5.62-5.48 5.92.43.37.82 1.1.82 2.22v3.29c0 .32.22.7.83.58C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
            </a>

          </div>
        </div>

        <div className="border-t border-border/40 mb-8" />

        <div className="text-center text-xs text-muted-foreground font-mono">
          © 2026 Assignment Integrity Analyzer
          Built with ❤️ for academic integrity
        </div>

      </div>

      {/* ===== ANIMATIONS ===== */}
      <style>{`
        @keyframes waveFlow {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @keyframes shine {
          0% { background-position: -150% 0; }
          100% { background-position: 150% 0; }
        }

        .animate-waveFlow {
          animation: waveFlow 12s linear infinite;
        }
      `}</style>
       <div className="absolute bottom-0 left-0 w-full h-32 opacity-[0.15] pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(circle,rgba(255,180,80,0.4)_1px,transparent_1px)] bg-[size:14px_14px]" />
      </div>
    </footer>
  );
};

export default Footer;