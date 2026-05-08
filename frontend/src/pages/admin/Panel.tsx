import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface PanelProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: PanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`
        relative
        overflow-hidden
        rounded-2xl
        border border-white/10
        bg-[#081120]/88
        p-4 sm:p-5 md:p-6
        shadow-[0_10px_35px_rgba(0,0,0,0.32)]
        backdrop-blur-xl
        ${className}
      `}
    >
      {/* TOP GLOW */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 right-0 h-40 w-40 rounded-full bg-white/4 blur-3xl" />
      </div>

      {/* HEADER */}
      {(title || subtitle || action) && (
        <div className="relative z-10 mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          
          {/* LEFT */}
          <div className="min-w-0 flex-1">
            {title && (
              <h3
                className="
                  break-words
                  text-lg
                  sm:text-xl
                  font-semibold
                  leading-tight
                  tracking-tight
                  text-white
                "
              >
                {title}
              </h3>
            )}

            {subtitle && (
              <p
                className="
                  mt-1.5
                  text-sm
                  leading-relaxed
                  text-slate-400
                "
              >
                {subtitle}
              </p>
            )}
          </div>

          {/* ACTION */}
          {action && (
            <div className="shrink-0 self-start">
              {action}
            </div>
          )}
        </div>
      )}

      {/* CONTENT */}
      <div className="relative z-10 w-full min-w-0">
        {children}
      </div>
    </motion.div>
  );
}

export default Panel;