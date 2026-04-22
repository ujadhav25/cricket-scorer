'use client';

import { motion, AnimatePresence } from 'framer-motion';

export function WicketAnim({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Red flash overlay */}
          <motion.div
            className="absolute inset-0 bg-red-600/25"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />

          {/* Shockwave ring */}
          <motion.div
            className="absolute rounded-full border border-red-400/40"
            initial={{ width: 40, height: 40, opacity: 0.8 }}
            animate={{ width: 500, height: 500, opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />

          {/* Falling stumps */}
          <div className="relative flex gap-4">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="relative"
                initial={{ rotate: 0, y: 0, opacity: 1 }}
                animate={{ rotate: -50 + i * 20, y: 50, opacity: 0 }}
                transition={{ duration: 0.7, delay: i * 0.06, ease: 'easeIn' }}
              >
                <div className="h-24 w-3.5 rounded-sm bg-gradient-to-b from-amber-100 to-amber-200 shadow-md" />
                <div className="mx-auto mt-0.5 h-1.5 w-6 rounded bg-amber-300" />
              </motion.div>
            ))}
          </div>

          <motion.div
            className="absolute overflow-hidden rounded-3xl bg-gradient-to-br from-red-500 to-red-700 px-12 py-6 text-white shadow-2xl shadow-red-500/30"
            style={{ top: '35%' }}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            transition={{ type: 'spring', delay: 0.25, stiffness: 400 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 0.7, delay: 0.4 }}
            />
            <span className="block text-center text-5xl mb-1">🏏</span>
            <span className="block text-center text-2xl font-black tracking-[0.2em] uppercase">Wicket!</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
