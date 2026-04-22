'use client';

import { motion, AnimatePresence } from 'framer-motion';

const PARTICLES = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  angle: (i / 30) * 360,
  distance: 100 + Math.random() * 120,
  size: 6 + Math.random() * 10,
  color: i % 3 === 0 ? 'bg-green-300' : i % 3 === 1 ? 'bg-emerald-400' : 'bg-lime-300',
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
          {/* Background flash */}
          <motion.div
            className="absolute inset-0 bg-green-500/15"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />

          {/* Particle burst */}
          {PARTICLES.map((p) => {
            const rad = (p.angle * Math.PI) / 180;
            return (
              <motion.div
                key={p.id}
                className={`absolute rounded-full ${p.color}`}
                style={{ width: p.size, height: p.size }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: Math.cos(rad) * p.distance,
                  y: Math.sin(rad) * p.distance,
                  opacity: 0,
                  scale: 0.3,
                }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            );
          })}

          {/* Outer glow ring */}
          <motion.div
            className="absolute w-48 h-48 rounded-full bg-green-500/20 blur-xl"
            initial={{ scale: 0 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 1.2 }}
          />

          <motion.div
            className="relative z-10 overflow-hidden rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 px-14 py-7 text-white shadow-2xl shadow-green-500/40"
            initial={{ scale: 0.2, rotate: -20, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 0.6, delay: 0.2 }}
            />
            <motion.span
              className="block text-center text-8xl font-black drop-shadow-lg"
              initial={{ y: 30 }}
              animate={{ y: 0 }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
            >
              6
            </motion.span>
            <span className="block text-center text-lg font-bold tracking-[0.3em] uppercase mt-1">Maximum!</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
