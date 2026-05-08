import { motion } from "framer-motion";

const steps = [
  { label: "Input", icon: UploadIcon },
  { label: "Process", icon: ProcessIcon },
  { label: "Train", icon: DetectIcon },
  { label: "Deploy", icon: ReportIcon },
];

export function WorkflowStepper() {
  return (
    <div className="relative mx-auto max-w-3xl px-6">
      <div className="mx-auto mb-6 h-2 w-2 rounded-sm bg-primary animate-pulse-dot" />
      <div className="grid grid-cols-4 gap-2 items-start">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 + i * 0.1 }}
              className="relative flex flex-col items-center gap-3"
            >
              {i < steps.length - 1 && (
                <div className="absolute top-3 left-[60%] right-[-40%] border-t border-dashed border-border" />
              )}
              <div className="relative z-10 flex h-7 w-7 items-center justify-center rounded-md bg-background text-foreground/80">
                <Icon />
              </div>
              <span className="font-mono text-xs text-muted-foreground">{s.label}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 4v12m0-12l-4 4m4-4l4 4M4 20h16" strokeLinecap="round" />
    </svg>
  );
}

function ProcessIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" strokeLinecap="round" />
    </svg>
  );
}

function DetectIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M5 12h3l2-6 4 12 2-6h3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M7 3h7l5 5v13H7V3z" strokeLinejoin="round" />
      <path d="M14 3v5h5M9 13h6M9 17h6" strokeLinecap="round" />
    </svg>
  );
}
