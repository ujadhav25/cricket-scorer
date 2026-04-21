'use client';

import { motion, AnimatePresence } from 'framer-motion';

export function WicketAnim({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-red-900/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Flash overlay */}
          <motion.div
            className="absolute inset-0 bg-red-600/30"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />

          {/* Falling stumps */}
          <div className="relative flex gap-3">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="relative"
                initial={{ rotate: 0, y: 0 }}
                animate={{ rotate: -60 + i * 15, y: 40, opacity: 0 }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: 'easeIn' }}
              >
                <div className="h-20 w-3 rounded bg-amber-200" />
                <div className="mx-auto mt-1 h-1.5 w-5 rounded bg-amber-300" />
              </motion.div>
            ))}
          </div>

          <motion.div
            className="absolute rounded-2xl bg-red-700/90 px-10 py-5 text-white shadow-2xl"
            style={{ top: '38%' }}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ type: 'spring', delay: 0.3 }}
          >
            <span className="block text-center text-5xl">🏏</span>
            <span className="block text-center text-2xl font-black tracking-widest">WICKET!</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
