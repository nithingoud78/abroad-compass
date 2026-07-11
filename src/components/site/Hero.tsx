import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import heroStudents from "@/assets/hero-students.png";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-hero-warm">
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-16 sm:px-6 sm:pt-24 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            Built for students heading to Germany
          </span>
          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Your Journey to Germany Starts Here.
            <span className="block text-foreground/90">
              Master the Complete Study Abroad Operating System.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Seamlessly navigate university applications, German language learning, budget planning,
            and visa procedures, all in one place. Built for ambitious students like you.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-foreground text-background hover:bg-foreground/90"
            >
              <Link to="/auth">
                Get Started Free <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-border bg-background/70 backdrop-blur"
            >
              <a href="#features">
                <Play className="mr-1 h-4 w-4" /> Explore Platform
              </a>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="relative mx-auto mt-12 max-w-4xl"
        >
          <img
            src={heroStudents}
            alt="International students preparing for university in Germany"
            width={1536}
            height={896}
            className="mx-auto w-full max-w-3xl object-contain"
          />
        </motion.div>
      </div>
    </section>
  );
}
