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
          {/* Background flash */}
          <motion.div
            className="absolute inset-0 bg-blue-500/10"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />

          {/* Ripple rings */}
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border-2 border-blue-400/60"
              initial={{ width: 60, height: 60, opacity: 0.6 }}
              animate={{ width: 600, height: 600, opacity: 0 }}
              transition={{ duration: 1.8, delay: i * 0.2, ease: 'easeOut' }}
            />
          ))}

          {/* Sparkle particles */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i / 12) * 360;
            const rad = (angle * Math.PI) / 180;
            const dist = 80 + Math.random() * 60;
            return (
              <motion.div
                key={`spark-${i}`}
                className="absolute h-2 w-2 rounded-full bg-blue-300"
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: Math.cos(rad) * dist,
                  y: Math.sin(rad) * dist,
                  opacity: 0,
                  scale: 0,
                }}
                transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
              />
            );
          })}

          <motion.div
            className="relative z-10 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 px-14 py-7 text-white shadow-2xl shadow-blue-500/30"
            initial={{ scale: 0.3, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.1, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
            <span className="block text-center text-7xl font-black drop-shadow-lg">4</span>
            <span className="block text-center text-lg font-bold tracking-[0.3em] uppercase mt-1">Boundary!</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
