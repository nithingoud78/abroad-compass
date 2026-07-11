import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-6">
      <header>
        <Badge variant="secondary" className="mb-2 gap-1">
          <Sparkles className="h-3 w-3" />
          Coming soon
        </Badge>
        <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
      </header>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="shadow-card">
          <CardContent className="grid place-items-center p-12 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-warm-peach to-warm-cream">
              <Sparkles className="h-6 w-6 text-brand" />
            </div>
            <p className="mt-4 font-display text-lg font-semibold">Building this next</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              This module is part of the Abroad Compass roadmap and is on its way. The architecture
              is in place so it slots in seamlessly when ready.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
