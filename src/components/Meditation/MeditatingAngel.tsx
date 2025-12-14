import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export const MeditatingAngel = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Randomly show/hide the angel for variety
    const interval = setInterval(() => {
      setIsVisible(Math.random() > 0.3);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed bottom-8 right-8 z-20 pointer-events-none"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 2, ease: "easeOut" }}
    >
      {/* Meditation Aura */}
      <motion.div
        className="absolute inset-0 -m-8"
        animate={{
          boxShadow: [
            "0 0 40px 20px rgba(0, 231, 255, 0.1)",
            "0 0 60px 30px rgba(168, 85, 247, 0.15)",
            "0 0 40px 20px rgba(255, 215, 0, 0.1)",
            "0 0 60px 30px rgba(0, 231, 255, 0.15)",
          ],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{ borderRadius: "50%" }}
      />

      {/* Angel Container */}
      <motion.div
        className="relative w-24 h-24 md:w-32 md:h-32"
        animate={{
          y: [0, -5, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Lotus Base */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-8 md:w-24 md:h-10">
          <motion.div
            className="w-full h-full bg-gradient-to-t from-pink-400 via-pink-300 to-pink-200 rounded-t-full opacity-60"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Angel Video */}
        <video
          src="/videos/angel-mascot-new.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-contain opacity-90"
          style={{ mixBlendMode: "screen" }}
        />

        {/* Halo Effect */}
        <motion.div
          className="absolute -top-4 left-1/2 -translate-x-1/2 w-16 h-4 md:w-20 md:h-5"
          animate={{
            opacity: [0.6, 1, 0.6],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="w-full h-full bg-gradient-to-r from-transparent via-amber-300 to-transparent rounded-full blur-sm" />
        </motion.div>

        {/* Sparkles around */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-amber-300 rounded-full"
            style={{
              left: `${20 + (i % 3) * 30}%`,
              top: `${10 + Math.floor(i / 3) * 40}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              delay: i * 0.3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>

      {/* Peaceful Message */}
      <motion.p
        className="text-center text-xs text-cyan-300/70 mt-2 font-light"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        Om Shanti ✨
      </motion.p>
    </motion.div>
  );
};
