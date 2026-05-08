import { motion } from "framer-motion";

const features = [
  {
    n: "01",
    tag: "Semantic Engine",
    title: "Semantic Similarity Detection",
    body: "Uses embedding-based comparison to find paraphrased or reworded submissions beyond exact text matches.",
  },
  {
    n: "02",
    tag: "Document OCR",
    title: "Handwriting and Text OCR",
    body: "Extracts handwritten and digital content so every submission can be analyzed consistently.",
  },
  {
    n: "03",
    tag: "Layered Analysis",
    title: "Multi-Stage Comparison Pipeline",
    body: "Combines lexical, semantic, and layout-aware checks to reduce false positives and highlight meaningful matches.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-32 overflow-hidden landing-shell">
      <div className="landing-dot-cluster mid-left" aria-hidden />
      <div className="absolute inset-0 dot-bg opacity-8" />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-primary mb-4">◆ Outcomes </div>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold leading-[1.05]">
            Product Features
          </h2>
        </div>

        <div className="landing-panel rounded-xl p-5 md:p-7 mb-14">
          <div className="grid md:grid-cols-4 gap-0 border border-border/50">
            {features.concat([{ n: "04", tag: "Violation Tracking", title: "Suspicious Activity Flags", body: "Tracks repeated violations and helps administrators review risky submissions faster." }]).map((f, i) => (
              <motion.div
                key={f.n}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55, delay: i * 0.08 }}
                className="min-h-52 md:min-h-64 p-8 border-b md:border-b-0 md:border-r border-border/45 last:border-r-0"
              >
                <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary mb-7">{f.tag}</div>
                <h3 className="font-display text-[clamp(1.45rem,2vw,2rem)] leading-tight mb-4">{f.title}</h3>
                <p className="text-muted-foreground text-base leading-relaxed">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="landing-section-rule mb-10" />

        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-primary mb-4">◆ Features</div>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold leading-[1.05]">
            Clear Detection <br /> Better Decisions
          </h2>
          <p className="mt-6 text-muted-foreground">
            Review submissions with confidence using semantic matching, OCR extraction, and actionable integrity alerts.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.n}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="group relative rounded-xl landing-role-card p-7 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center justify-between font-mono text-xs uppercase tracking-[0.2em] text-primary mb-8">
                <span>{f.n} — {f.tag}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-dot" />
              </div>
              <h3 className="font-display text-2xl font-semibold leading-tight mb-4">
                {f.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {f.body}
              </p>
              <div className="absolute inset-x-7 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
