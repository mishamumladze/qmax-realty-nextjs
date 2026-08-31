// app/template.tsx
"use client";

import { motion, useReducedMotion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0.9, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ease: "easeOut", duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
}
