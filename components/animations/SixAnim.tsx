'use client';

import { motion, AnimatePresence } from 'framer-motion';

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  angle: (i / 20) * 360,
  distance: 120 + Math.random() * 80,
  size: 8 + Math.random() * 12,
}));

export function SixAnim({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Particle burst */}
          {PARTICLES.map((p) => {
            const rad = (p.angle * Math.PI) / 180;
            return (
              <motion.div
                key={p.id}
                className="absolute rounded-full bg-green-400"
                style={{ width: p.size, height: p.size }}
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{
                  x: Math.cos(rad) * p.distance,
                  y: Math.sin(rad) * p.distance,
                  opacity: 0,
                }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            );
          })}

          <motion.div
            className="relative z-10 rounded-2xl bg-green-600/90 px-12 py-6 text-white shadow-2xl"
            initial={{ scale: 0.3, rotate: -15, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 1.3, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
          >
            <span className="block text-center text-6xl font-black">6</span>
            <span className="block text-center text-xl font-semibold tracking-widest">SIX!</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
