import { motion } from "framer-motion";

const AiALogo = ({ size = "text-lg" }: { size?: string }) => {
  return (
    <div className="relative inline-flex items-center justify-center group">
      
      {/* ===== GLOW RING ===== */}
      <div className="absolute inset-0 flex items-center justify-center">
        
        {/* Outer subtle ring */}
        <motion.div
          animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-[120%] h-[120%] rounded-full border border-white/30"
        />

        {/* Glow aura */}
        <motion.div
          animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-[130%] h-[130%] rounded-full blur-xl bg-white/10"
        />
      </div>

      {/* ===== LOGO TEXT ===== */}
      <div className={`relative z-10 font-display font-semibold tracking-[0.2em] flex items-center ${size}`}>
        
        <motion.span
          className="text-foreground"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          A
        </motion.span>

        <motion.span
          className="text-primary drop-shadow-[0_0_10px_rgba(212,156,64,0.6)]"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
        >
          I
        </motion.span>

        <motion.span
          className="text-foreground"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
        >
          A
        </motion.span>

      </div>
    </div>
  );
};

export default AiALogo;