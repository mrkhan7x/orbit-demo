import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
  /** Disable padding for full-bleed layouts like Calendar */
  noPadding?: boolean;
}

/** Wraps every page with consistent enter animation + padding */
export function PageShell({ children, className, noPadding = false }: PageShellProps) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "flex-1 overflow-y-auto",
        !noPadding && "p-6",
        className
      )}
      style={{ background: "var(--bg-app)" }}
    >
      {children}
    </motion.main>
  );
}
