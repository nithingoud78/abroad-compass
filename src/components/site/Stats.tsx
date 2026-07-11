import { motion } from "framer-motion";

const stats = [
  { value: "10k+", label: "Students Guided" },
  { value: "50+", label: "Supported Universities" },
  { value: "100+", label: "Learning Modules" },
  { value: "24/7", label: "Always Available" },
];

export function Stats() {
  return (
    <section className="border-y border-border/60 bg-secondary/40 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Built for impact
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Numbers that reflect the journey we support.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="rounded-2xl border border-border/60 bg-card p-8 text-center shadow-[var(--shadow-soft)]"
            >
              <div className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                {s.value}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
