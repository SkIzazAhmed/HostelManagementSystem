import { motion, useScroll, useSpring } from 'motion/react';

// Thin bar along the top of the window showing how far the page has been scrolled.
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 h-1 z-[60] origin-left bg-gradient-to-r from-indigo-500 to-purple-600 print:hidden"
      style={{ scaleX }}
    />
  );
}
