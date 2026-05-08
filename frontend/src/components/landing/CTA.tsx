import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export function CTA() {
  return (
    <section
      id="access"
      className="relative py-16 sm:py-24 overflow-hidden landing-shell"
    >
      {/* Background */}
      <div className="absolute inset-0 dot-bg opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <div className="absolute inset-0 grid-bg opacity-10 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="landing-panel relative mx-auto max-w-2xl px-4 sm:px-6 text-center rounded-xl py-10 sm:py-14"
      >
        {/* Tag */}
        <div className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.25em] text-muted-foreground mb-3">
          ◆ ACCESS
        </div>

        {/* Divider */}
        <div className="landing-ruler h-4 mb-6 rounded-sm" />

        {/* Icon */}
        <div className="mx-auto mb-4 h-10 w-10 rounded-full border border-primary/40 flex items-center justify-center">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse-dot" />
        </div>

        {/* Heading */}
        <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-semibold leading-[1.25] tracking-tight max-w-[90%] sm:max-w-2xl mx-auto">
          Reliability Meets High Performance
        </h2>

        {/* Description */}
        <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-[85%] sm:max-w-md mx-auto leading-relaxed">
          Accelerate processing, monitor systems proactively, and protect infrastructure with scalable similarity computation.
        </p>

        {/* CTA Button */}
        <Link
          to="/signup"
          className="landing-access-btn mt-6 sm:mt-8 inline-flex items-center gap-2 rounded-full px-5 sm:px-6 py-2.5 sm:py-3 text-sm font-medium transition-transform hover:scale-[1.02]"
        >
          <span className="landing-access-btn-icon" aria-hidden>
            ▶
          </span>
          LETS GO
        </Link>
      </motion.div>
    </section>
  );
}

export default CTA;