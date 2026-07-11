import { motion } from "framer-motion";
import { ClipboardList, FileBadge, Landmark, Plane, MapPin } from "lucide-react";

const steps = [
  { icon: ClipboardList, title: "Initial Preparation", desc: "APS, language tests, transcripts." },
  { icon: FileBadge, title: "Applications", desc: "Shortlist, apply, track offers." },
  { icon: Landmark, title: "Financial Setup", desc: "Blocked account, scholarships, budget." },
  { icon: Plane, title: "Visa & Travel", desc: "Visa, insurance, accommodation, flight." },
  { icon: MapPin, title: "Arrival in Germany", desc: "Registration, university onboarding." },
];

export function Roadmap() {
  return (
    <section id="roadmap" className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-brand">
            Roadmap
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            A guided path from idea to arrival
          </h2>
          <p className="mt-3 text-muted-foreground">
            Each stage adapts to your progress with conditional workflows — never ask twice, never
            miss a step.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-5">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="relative rounded-2xl border border-border/60 bg-card p-6 shadow-[var(--shadow-soft)]"
            >
              <div className="absolute -top-3 left-6 grid h-7 w-7 place-items-center rounded-full bg-foreground text-xs font-semibold text-background">
                {i + 1}
              </div>
              <s.icon className="mt-2 h-5 w-5 text-brand" />
              <h3 className="mt-4 font-display text-base font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
