import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { WorkflowStepper } from "./WorkflowStepper";

const Hero = () => {
  return (
    <section className="landing-shell relative overflow-hidden pt-44 md:pt-48 pb-28">
      <div className="landing-dot-cluster top-right" aria-hidden />
      <div className="landing-dot-cluster mid-left" aria-hidden />
      <div className="landing-dot-cluster bottom-center" aria-hidden />
      <div className="absolute inset-0 grid-bg opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <div className="absolute inset-0 dot-bg opacity-10 [mask-image:radial-gradient(ellipse_at_bottom,black,transparent_70%)]" />
      <div className="absolute inset-x-0 top-0 h-[700px] pointer-events-none bg-gradient-radial" />

      <div className="relative mx-auto max-w-6xl px-6 text-center">
  
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-medium leading-[1.02] tracking-tight"
        >
          Academic
          <br />
          <span className="hero-gradient-text">"Integrity"</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground"
        >
          Detect - Analyze - Protect Academic Integrity
        </motion.p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
  to="/signup"
  className="landing-access-btn inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium tracking-wide transition-transform hover:scale-[1.03]"
>
   <span className="landing-access-btn-icon" aria-hidden>▶</span>
   Get Started
</Link>
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-6xl px-6">
        <div className="landing-panel rounded-xl p-4 sm:p-6">
          <p className="text-center text-foreground/80 text-sm sm:text-lg md:text-xl font-medium mb-5 sm:mb-7 leading-relaxed max-w-[90%] sm:max-w-2xl mx-auto">
            MEET AIA SOLUTION FOR ACADEMIC INTEGRITY.
          </p>

          <div className="landing-ruler h-6 mb-4 rounded-sm" />
          <WorkflowStepper />
        </div>
      </div>

      {/* Code-line decorative ticker */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="mt-20 ticker-mask overflow-hidden font-mono text-xs text-muted-foreground/60"
      >
        <div className="flex gap-12 whitespace-nowrap animate-marquee">
          {Array.from({ length: 2 }).flatMap((_, i) =>
            [
              "Detecting similarity in assignments",
              "▮▮▮▮ ▮ ▮▮ ▮▮▮▮▮ ▮▮ ▮ ▮▮▮▮",
              "<<<Vectorize",
              "▮▮▮▮ ▮ ▮▮ ▮▮▮▮▮ ▮▮ ▮ ▮▮▮▮",
              "model.embed(submission).then(compare)",
              "Report similarity",
            ].map((t, j) => <span key={`${i}-${j}`}>{t}</span>)
          )}
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;