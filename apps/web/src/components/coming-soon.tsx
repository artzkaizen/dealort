import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface ComingSoonProps {
  title: string;
}

export function ComingSoon({ title }: ComingSoonProps) {
  return (
    <Card className="max-w-lg">
      <CardHeader>
        <div className="flex items-center justify-end gap-1">
          <motion.div className="h-2 w-2 animate-bounce rounded-full bg-red-500" />
          <motion.div className="h-2 w-2 animate-bounce rounded-full bg-amber-500 delay-400" />
          <motion.div className="h-2 w-2 animate-bounce rounded-full bg-green-500 delay-800" />
        </div>
        <CardTitle className="font-clash-display font-semibold text-primary text-xl tracking-tight sm:text-2xl">
          Coming Soon!!
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-xs sm:text-sm">
          {title} page/feature is coming soon. We are working hard to bring you
          the best experience possible.
        </p>
      </CardContent>
    </Card>
  );
}
