'use client';

import { motion, AnimatePresence } from 'framer-motion';

export function BoundaryAnim({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Ripple rings */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border-4 border-blue-400"
              initial={{ width: 80, height: 80, opacity: 0.8 }}
              animate={{ width: 500, height: 500, opacity: 0 }}
              transition={{ duration: 1.5, delay: i * 0.3, ease: 'easeOut' }}
            />
          ))}
          <motion.div
            className="relative z-10 rounded-2xl bg-blue-600/90 px-12 py-6 text-white shadow-2xl"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <span className="block text-center text-6xl font-black">4</span>
            <span className="block text-center text-xl font-semibold tracking-widest">FOUR!</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
