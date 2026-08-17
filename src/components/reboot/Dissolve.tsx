import { motion } from "motion/react";
import { useEffect } from "react";

export function Dissolve({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-void">
      <motion.div
        className="absolute h-[42vmin] w-[42vmin] rounded-full"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--signal) 60%, white) 0%, color-mix(in oklab, var(--signal) 30%, transparent) 45%, transparent 70%)",
        }}
        initial={{ scale: 1.1, opacity: 0.85 }}
        animate={{ scale: [1.1, 0.12, 26], opacity: [0.85, 1, 0] }}
        transition={{ duration: 1.15, times: [0, 0.42, 1], ease: [0.7, 0, 0.2, 1] }}
      />
      <motion.div
        className="absolute inset-0 bg-paper"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.62, duration: 0.72, ease: [0.22, 0.9, 0.24, 1] }}
      />
      <motion.p
        className="relative font-serif text-[1.75rem] italic text-ink"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: [0, 1, 1], y: 0 }}
        transition={{ delay: 0.95, duration: 0.6 }}
      >
        Clarity.
      </motion.p>
    </div>
  );
}
