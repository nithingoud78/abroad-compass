import { motion } from "framer-motion";
import {
  GraduationCap,
  Map,
  Building2,
  Wallet,
  BookOpenCheck,
  Languages,
  FileCheck2,
  CalendarClock,
} from "lucide-react";

const features = [
  {
    icon: GraduationCap,
    title: "German Learning Suite",
    desc: "Track vocabulary, grammar, reading and CEFR progress with daily missions and AI summaries.",
  },
  {
    icon: Map,
    title: "Journey Roadmap",
    desc: "Step-by-step conditional checklist from APS to arrival, tailored to where you are.",
  },
  {
    icon: Building2,
    title: "University Shortlisting",
    desc: "Compare universities with fit scores, deadlines, requirements and personal notes.",
  },
  {
    icon: Wallet,
    title: "Budget Manager",
    desc: "Plan expenses, blocked account, and savings goals across currencies and categories.",
  },
  {
    icon: BookOpenCheck,
    title: "Portfolio & Projects",
    desc: "Showcase projects, certificates and skills ready for SOP and resume export.",
  },
  {
    icon: Languages,
    title: "Daily Resource Tracker",
    desc: "Save YouTube, Goethe, DW and articles — auto-summarized into your learning timeline.",
  },
  {
    icon: FileCheck2,
    title: "Document Vault",
    desc: "Keep APS, visa, insurance and offer documents organized with status workflows.",
  },
  {
    icon: CalendarClock,
    title: "Deadlines & Streaks",
    desc: "Never miss a deadline. Build study streaks with achievements that actually motivate.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-brand">
            Platform
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need, in one calm place
          </h2>
          <p className="mt-3 text-muted-foreground">
            Eight integrated modules built around how students actually plan, learn and apply.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              id={
                f.title === "German Learning Suite"
                  ? "german-learning"
                  : f.title === "University Shortlisting"
                    ? "university-search"
                    : undefined
              }
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              className="group rounded-2xl border border-border/60 bg-card p-6 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] scroll-mt-24"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-base font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
