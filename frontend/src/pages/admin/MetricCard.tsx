import {
    animate,
    motion,
    useMotionValue,
    useTransform,
} from "framer-motion";

import type { LucideIcon } from "lucide-react";
import { useEffect } from "react";

type Tone = "cyan" | "green" | "orange" | "red" | "yellow";

interface MetricCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: Tone;
  suffix?: string;
  hint?: string;
}

const toneColors: Record<
  Tone,
  {
    text: string;
    bg: string;
    border: string;
    iconBg: string;
    iconText: string;
  }
> = {
  cyan: {
    text: "text-cyan-300",
    bg: "bg-cyan-500/[0.08]",
    border: "border-cyan-500/30",
    iconBg: "bg-cyan-500/15",
    iconText: "text-cyan-400",
  },

  green: {
    text: "text-emerald-300",
    bg: "bg-emerald-500/[0.08]",
    border: "border-emerald-500/30",
    iconBg: "bg-emerald-500/15",
    iconText: "text-emerald-400",
  },

  orange: {
    text: "text-orange-300",
    bg: "bg-orange-500/[0.08]",
    border: "border-orange-500/30",
    iconBg: "bg-orange-500/15",
    iconText: "text-orange-400",
  },

  red: {
    text: "text-red-300",
    bg: "bg-red-500/[0.08]",
    border: "border-red-500/30",
    iconBg: "bg-red-500/15",
    iconText: "text-red-400",
  },

  yellow: {
    text: "text-yellow-300",
    bg: "bg-yellow-500/[0.08]",
    border: "border-yellow-500/30",
    iconBg: "bg-yellow-500/15",
    iconText: "text-yellow-400",
  },
};

export function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "cyan",
  suffix = "",
  hint,
}: MetricCardProps) {
  const motionValue = useMotionValue(0);

  const displayValue = useTransform(
    motionValue,
    (v) => `${Math.round(v).toLocaleString()}${suffix}`
  );

  const colors = toneColors[tone];

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 1.2,
      ease: "easeOut",
    });

    return () => controls.stop();
  }, [value, motionValue]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        y: -4,
        scale: 1.02,
      }}
      transition={{
        duration: 0.25,
      }}
      className={`
        relative
        overflow-hidden
        rounded-3xl
        border
        ${colors.border}
        ${colors.bg}
        p-4
        sm:p-5
        md:p-6
        backdrop-blur-lg
        transition-all
        duration-300
        group
      `}
    >
      {/* CONTENT */}
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.24em] font-semibold text-slate-400">
            {label}
          </p>

          <motion.p
            className={`mt-3 sm:mt-4 text-4xl sm:text-5xl md:text-6xl font-bold leading-none ${colors.text}`}
          >
            {displayValue}
          </motion.p>

          {hint && (
            <p className="mt-2 sm:mt-3 text-xs font-medium text-slate-500">
              {hint}
            </p>
          )}
        </div>

        <div
          className={`
            flex
            h-14
            w-14
            sm:h-16
            sm:w-16
            md:h-[70px]
            md:w-[70px]
            flex-shrink-0
            items-center
            justify-center
            rounded-2xl
            sm:rounded-3xl
            ${colors.iconBg}
            backdrop-blur-md
            border
            border-white/10
          `}
        >
          <Icon className={`h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 ${colors.iconText}`} />
        </div>
      </div>

      {/* GRADIENT GLOW */}
      <div
        className={`
          absolute
          -bottom-20
          -right-20
          h-40
          w-40
          rounded-full
          opacity-20
          blur-3xl
          pointer-events-none
          transition-all
          duration-500
          group-hover:opacity-30
          group-hover:scale-110
        `}
        style={{
          background: `radial-gradient(circle, ${
            tone === "cyan"
              ? "#06b6d4"
              : tone === "green"
                ? "#10b981"
                : tone === "orange"
                  ? "#f97316"
                  : tone === "red"
                    ? "#ef4444"
                    : "#eab308"
          }, transparent)`,
        }}
      />
    </motion.div>
  );
}