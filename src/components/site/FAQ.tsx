import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    q: "Is Abroad Compass free to use?",
    a: "Yes — the core platform is free for students. Premium tools may be added later for advanced workflows.",
  },
  {
    q: "Does it support countries other than Germany?",
    a: "Germany is our launch focus, but the platform is architected to add Canada, USA, France, Netherlands and more without restructuring.",
  },
  {
    q: "How is my data protected?",
    a: "Your data is encrypted in transit and at rest. We never sell information and you can export or delete it anytime.",
  },
  {
    q: "Do I need to know German to start?",
    a: "Not at all. The learning suite supports complete beginners through C1, with daily missions and CEFR tracking.",
  },
  {
    q: "Can I track my budget in multiple currencies?",
    a: "Yes — log expenses in any currency with conversion, categories and analytics for savings goals like the blocked account.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-brand">FAQ</span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Frequently asked questions
          </h2>
        </div>
        <div className="mt-10 divide-y divide-border/60 rounded-2xl border border-border/60 bg-card shadow-[var(--shadow-soft)]">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="font-medium">{f.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">
                        {f.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
