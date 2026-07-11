import { motion, AnimatePresence } from "framer-motion";
import { Flame, Trophy, Sparkles } from "lucide-react";
import { useEffect } from "react";

export function StreakCelebration({
  open,
  streak,
  onDone,
}: {
  open: boolean;
  streak: number;
  onDone: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [open, onDone]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] grid place-items-center bg-background/70 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.7, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
            className="relative w-[min(420px,90vw)] rounded-3xl border bg-card p-8 text-center shadow-elegant"
          >
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
              {Array.from({ length: 18 }).map((_, i) => (
                <motion.span
                  key={i}
                  className="absolute h-1.5 w-1.5 rounded-full bg-brand"
                  initial={{ x: "50%", y: "60%", opacity: 1 }}
                  animate={{
                    x: `${50 + (Math.random() - 0.5) * 160}%`,
                    y: `${60 - Math.random() * 80}%`,
                    opacity: 0,
                  }}
                  transition={{ duration: 1.6, delay: i * 0.04 }}
                />
              ))}
            </div>
            <motion.div
              animate={{ scale: [1, 1.15, 1], rotate: [0, -6, 6, 0] }}
              transition={{ repeat: 1, duration: 0.9 }}
              className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-warm-rose to-warm-peach text-brand shadow-soft"
            >
              <Flame className="h-10 w-10" />
            </motion.div>
            <h2 className="mt-5 font-display text-3xl font-bold">{streak}-day streak</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Consistency compounds. Keep the fire burning tomorrow.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Trophy className="h-4 w-4 text-brand" /> Daily check-in saved
              <Sparkles className="ml-2 h-4 w-4 text-brand" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
