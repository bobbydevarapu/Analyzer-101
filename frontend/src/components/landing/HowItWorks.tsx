import { motion } from "framer-motion";

const steps = [
  { n: "01", title: "Upload", body: "Submit assignments in any supported format." },
  { n: "02", title: "Analyze", body: "Extracted content analyzed using similarity algorithms." },
  { n: "03", title: "Detect", body: "Similarity scores computed between all submissions." },
  { n: "04", title: "Report", body: "Results include similarity matrix and flagged pairs." },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative py-20 sm:py-28 landing-shell">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14 sm:mb-20"
        >
          <div className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">
            ◆ How It Works
          </div>

          <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-semibold">
            Detect - Compare - Report
          </h2>

          <p className="mt-3 sm:mt-5 max-w-xl mx-auto text-sm sm:text-base text-muted-foreground leading-relaxed">
            Upload submissions, analyze similarity, and generate reports to identify copied work quickly.
          </p>
        </motion.div>

        {/* PANEL */}
        <div className="landing-panel rounded-2xl p-4 sm:p-6 md:p-8 overflow-hidden">
          <div className="relative">

            {/* DESKTOP LINE */}
            <div className="hidden md:block absolute left-14 right-14 top-20 h-1 rounded-full bg-white/10" />

            {/* GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-4">
              {steps.map((s, i) => (
                <motion.div
                  key={s.n}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="relative flex flex-col items-center text-center group how-node"
                >
                  {/* NODE CARD */}
                  <div className="
                    relative 
                    flex 
                    w-full 
                    sm:w-[90%] 
                    md:w-44 
                    md:h-44 
                    items-center 
                    justify-center 
                    rounded-xl 
                    md:rounded-full 
                    p-5 md:p-0 
                    bg-card/40 md:bg-transparent 
                    border border-border/40 md:border-none
                  ">

                    {/* FIXED RING */}
                    <motion.span
                      className="
                        node-ring 
                        absolute inset-0 
                        rounded-xl md:rounded-full 
                        border border-white/60 
                        pointer-events-none
                      "
                      aria-hidden
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    />

                    {/* STEP NUMBER */}
                    <div className="absolute top-3 left-3 md:top-4 md:left-4 flex items-center gap-2">
                      <motion.span
                        className="h-3 w-3 rounded-full bg-[hsl(var(--gold))]"
                        animate={{ opacity: [0.6, 1, 0.6], scale: [0.9, 1.1, 0.9] }}
                        transition={{ duration: 2.2, repeat: Infinity }}
                      />
                      <span className="font-mono text-xs sm:text-sm font-semibold text-[hsl(var(--gold))]">
                        {s.n}
                      </span>
                    </div>

                    {/* CONTENT */}
                    <div className="relative z-10 px-3 sm:px-4 py-4 sm:py-6 flex flex-col items-center text-center">
                      <h3 className="font-display text-lg sm:text-xl md:text-2xl font-semibold mb-1">
                        {s.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-[14rem]">
                        {s.body}
                      </p>
                    </div>

                  </div>
                </motion.div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;