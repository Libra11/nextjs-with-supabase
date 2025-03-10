/**
 * Author: Libra
 * Date: 2025-03-10 17:57:10
 * LastEditors: Libra
 * Description: 页面切换动画
 */
"use client";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

export function PresenceAnimation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const variants = {
    initial: { opacity: 0, y: 50 },
    enter: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -50 },
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={variants}
        initial="initial"
        animate="enter"
        exit="exit"
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
