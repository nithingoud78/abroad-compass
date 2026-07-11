import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const items = [
  {
    quote:
      "Abroad Compass turned an overwhelming process into a clear weekly checklist. I got my visa with months to spare.",
    name: "Priya S.",
    role: "MS Informatics, TU München",
  },
  {
    quote:
      "The German learning tracker kept me consistent. Hitting B2 felt natural with daily missions and streaks.",
    name: "Daniel O.",
    role: "BSc Mechatronics, RWTH Aachen",
  },
  {
    quote:
      "Shortlisting universities used to take days. The fit score saved me hours and helped me choose with confidence.",
    name: "Aisha K.",
    role: "MSc Data Science, Uni Stuttgart",
  },
];

export function Testimonials() {
  return (
    <section className="bg-secondary/40 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-brand">
            Students
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Trusted by ambitious students worldwide
          </h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {items.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="rounded-2xl border border-border/60 bg-card p-7 shadow-[var(--shadow-soft)]"
            >
              <Quote className="h-5 w-5 text-brand" />
              <blockquote className="mt-4 text-sm leading-relaxed text-foreground/90">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-5 border-t border-border/60 pt-4">
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
