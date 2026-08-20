// app/template.tsx
'use client';

import { motion } from 'framer-motion';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: .5, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ease: 'easeOut', duration: 0.35 }}
    >
      {children}
    </motion.div>
  );
}
